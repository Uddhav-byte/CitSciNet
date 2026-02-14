import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { validateObservation, validateImage } from './services/aiValidation.js';

dotenv.config();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

let connectedClients = 0;

io.on('connection', (socket) => {
    connectedClients++;
    console.log(`Client connected (${connectedClients} total)`);
    io.emit('client-count', connectedClients);

    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`Client disconnected (${connectedClients} total)`);
        io.emit('client-count', connectedClients);
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        connectedClients,
        timestamp: new Date().toISOString()
    });
});

// ==================== OBSERVATIONS ====================

app.get('/api/observations', async (req, res) => {
    try {
        const observations = await prisma.observation.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200
        });
        res.json(observations);
    } catch (err) {
        console.error('Failed to fetch observations:', err);
        res.status(500).json({ error: 'Failed to fetch observations' });
    }
});

app.post('/api/observations', async (req, res) => {
    try {
        const {
            latitude, longitude, imageUrl, audioUrl, category,
            aiLabel, confidenceScore, userName, userId, notes, missionId
        } = req.body;

        if (!latitude || !longitude || !category) {
            return res.status(400).json({ error: 'latitude, longitude, and category are required' });
        }

        // Create the observation immediately (with pending status)
        const observation = await prisma.observation.create({
            data: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                imageUrl: imageUrl || null,
                audioUrl: audioUrl || null,
                category,
                aiLabel: aiLabel || null,
                confidenceScore: confidenceScore ? parseFloat(confidenceScore) : null,
                userName: userName || 'Anonymous',
                userId: userId || null,
                missionId: missionId || null,
                notes: notes || null,
                validationStatus: 'pending',
            }
        });

        // Run AI validation asynchronously (don't block the response)
        (async () => {
            try {
                // Fetch mission context if linked
                let mission = null;
                if (missionId) {
                    mission = await prisma.mission.findUnique({ where: { id: missionId } });
                }

                // Run data validation via Groq
                const validation = await validateObservation({ observation, mission });

                // If image present, also validate the image
                if (imageUrl && mission) {
                    const imageResult = await validateImage({ imageUrl, mission });
                    if (imageResult.score !== undefined) {
                        // Average data + image scores
                        validation.score = (validation.score + imageResult.score) / 2;
                        validation.notes += `\n\nImage Analysis: ${imageResult.description || 'N/A'}`;
                        validation.status = validation.score >= 0.80 ? 'auto_approved' : 'needs_review';
                    }
                }

                // Update the observation with validation results
                const updated = await prisma.observation.update({
                    where: { id: observation.id },
                    data: {
                        validationStatus: validation.status,
                        validationScore: validation.score,
                        validationNotes: validation.notes,
                        // Auto-verify if score >= 0.80
                        verified: validation.status === 'auto_approved',
                    },
                });

                console.log(`🤖 Observation ${observation.id} → ${validation.status} (${(validation.score * 100).toFixed(0)}%)`);

                // Emit real-time update with validation status
                io.emit('observation-validated', {
                    id: updated.id,
                    validationStatus: updated.validationStatus,
                    validationScore: updated.validationScore,
                    validationNotes: updated.validationNotes,
                    verified: updated.verified,
                });

                // If needs review, notify moderators
                if (validation.status === 'needs_review') {
                    io.emit('review-needed', {
                        observationId: updated.id,
                        category: updated.category,
                        userName: updated.userName,
                        score: validation.score,
                    });
                }
            } catch (valErr) {
                console.error('Async validation failed:', valErr.message);
                await prisma.observation.update({
                    where: { id: observation.id },
                    data: {
                        validationStatus: 'needs_review',
                        validationNotes: `Validation error: ${valErr.message}`,
                    },
                });
            }
        })();

        // Award points dynamic based on mission bounty
        try {
            let pointsToAward = 10;
            let reason = 'observation';

            if (missionId) {
                const mission = await prisma.mission.findUnique({ where: { id: missionId } });
                if (mission && mission.bountyPoints) {
                    pointsToAward = mission.bountyPoints;
                    reason = `mission bounty (${mission.title})`;
                }
            }

            await awardPoints(observation.userName, pointsToAward, false);
            io.emit('points-awarded', { userName: observation.userName, points: pointsToAward, reason });
        } catch (e) { /* user may not exist */ }

        io.emit('new-observation', observation);
        res.status(201).json(observation);
    } catch (err) {
        console.error('Failed to create observation:', err);
        res.status(500).json({ error: 'Failed to create observation' });
    }
});

// ==================== REVIEW QUEUE (Middleman) ====================

// Get all observations that need review (for moderators)
app.get('/api/observations/review-queue', async (req, res) => {
    try {
        const observations = await prisma.observation.findMany({
            where: { validationStatus: 'needs_review' },
            orderBy: { createdAt: 'desc' },
        });
        res.json(observations);
    } catch (err) {
        console.error('Failed to fetch review queue:', err);
        res.status(500).json({ error: 'Failed to fetch review queue' });
    }
});

// Moderator approves or rejects an observation
app.patch('/api/observations/:id/review', async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reviewerNotes } = req.body; // action: 'approve' | 'reject'

        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'action must be "approve" or "reject"' });
        }

        const observation = await prisma.observation.update({
            where: { id },
            data: {
                validationStatus: action === 'approve' ? 'auto_approved' : 'rejected',
                verified: action === 'approve',
                validationNotes: reviewerNotes
                    ? `Manual review: ${reviewerNotes}`
                    : `Manually ${action}d by moderator`,
            },
        });

        io.emit('observation-reviewed', observation);
        res.json(observation);
    } catch (err) {
        console.error('Review failed:', err);
        res.status(500).json({ error: 'Review failed' });
    }
});

app.patch('/api/observations/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const { verified } = req.body;
        const observation = await prisma.observation.update({
            where: { id },
            data: { verified: verified !== undefined ? verified : true },
        });
        io.emit('observation-updated', observation);
        res.json(observation);
    } catch (err) {
        console.error('Failed to update observation:', err);
        res.status(500).json({ error: 'Failed to update observation' });
    }
});

app.delete('/api/observations/:id', async (req, res) => {
    try {
        await prisma.observation.delete({ where: { id: req.params.id } });
        io.emit('delete-observation', req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to delete observation:', err);
        res.status(500).json({ error: 'Failed to delete observation' });
    }
});

// ==================== EXPORT ====================

app.get('/api/observations/export', async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const observations = await prisma.observation.findMany({
            orderBy: { createdAt: 'desc' }
        });

        if (format === 'csv') {
            const headers = ['id', 'latitude', 'longitude', 'category', 'aiLabel', 'confidenceScore', 'userName', 'notes', 'verified', 'createdAt'];
            const csvRows = [headers.join(',')];
            observations.forEach(obs => {
                csvRows.push(headers.map(h => {
                    const val = obs[h];
                    if (val === null || val === undefined) return '';
                    const str = String(val);
                    return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
                }).join(','));
            });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=citsci-export-${new Date().toISOString().slice(0, 10)}.csv`);
            return res.send(csvRows.join('\n'));
        }

        res.json(observations);
    } catch (err) {
        console.error('Export failed:', err);
        res.status(500).json({ error: 'Export failed' });
    }
});

// ==================== UPLOAD ====================

app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'citsci-observations',
            resource_type: 'image',
            transformation: [
                { quality: 'auto', fetch_format: 'auto' },
                { width: 800, height: 600, crop: 'limit' },
            ],
        });

        res.json({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
        });
    } catch (err) {
        console.error('Upload failed:', err);
        if (req.body?.base64) {
            return res.json({ url: req.body.base64 });
        }
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.post('/api/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'citsci-observations-audio',
            resource_type: 'video', // Cloudinary treats audio as video
        });

        res.json({
            url: result.secure_url,
            publicId: result.public_id
        });
    } catch (err) {
        console.error('Audio upload failed:', err);
        res.status(500).json({ error: 'Audio upload failed' });
    }
});

app.post('/api/upload-base64', async (req, res) => {
    try {
        const { base64 } = req.body;
        if (!base64) return res.status(400).json({ error: 'No image data' });

        try {
            const result = await cloudinary.uploader.upload(base64, {
                folder: 'citsci-observations',
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' },
                    { width: 800, height: 600, crop: 'limit' },
                ],
            });
            return res.json({ url: result.secure_url });
        } catch {
            return res.json({ url: base64 });
        }
    } catch (err) {
        console.error('Base64 upload failed:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// ==================== MISSIONS ====================

app.get('/api/missions', async (req, res) => {
    try {
        const missions = await prisma.mission.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' },
            include: {
                userMissions: {
                    select: { userName: true, status: true }
                }
            }
        });
        res.json(missions);
    } catch (err) {
        console.error('Failed to fetch missions:', err);
        res.status(500).json({ error: 'Failed to fetch missions' });
    }
});

app.post('/api/missions', async (req, res) => {
    try {
        const { title, description, scientificGoal, dataProtocol, dataRequirement, bountyPoints, geometry, missionType, createdBy } = req.body;

        if (!title || !geometry) {
            return res.status(400).json({ error: 'title and geometry are required' });
        }

        const mission = await prisma.mission.create({
            data: {
                title,
                description: description || null,
                scientificGoal: scientificGoal || null,
                dataProtocol: dataProtocol || null,
                dataRequirement: dataRequirement || 'both',
                bountyPoints: bountyPoints || 10,
                missionType: missionType || 'Wildlife',
                geometry,
                createdBy: createdBy || 'Researcher'
            }
        });

        io.emit('new-mission', mission);
        res.status(201).json(mission);
    } catch (err) {
        console.error('Failed to create mission:', err);
        res.status(500).json({ error: 'Failed to create mission' });
    }
});

app.post('/api/missions/:id/accept', async (req, res) => {
    try {
        const { userName } = req.body;
        const { id } = req.params;

        if (!userName) {
            return res.status(400).json({ error: 'userName is required' });
        }

        const userMission = await prisma.userMission.create({
            data: {
                missionId: id,
                userName,
                status: 'accepted'
            }
        });

        res.status(201).json(userMission);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Mission already accepted by this user' });
        }
        console.error('Failed to accept mission:', err);
        res.status(500).json({ error: 'Failed to accept mission' });
    }
});

app.post('/api/missions/:id/complete', async (req, res) => {
    try {
        const { userName } = req.body;
        const { id } = req.params;

        if (!userName) {
            return res.status(400).json({ error: 'userName is required' });
        }

        const userMission = await prisma.userMission.updateMany({
            where: {
                missionId: id,
                userName,
                status: 'accepted'
            },
            data: {
                status: 'completed',
                completedAt: new Date()
            }
        });

        if (userMission.count === 0) {
            return res.status(404).json({ error: 'No accepted mission found for this user' });
        }

        // Award bounty points for mission completion
        const mission = await prisma.mission.findUnique({ where: { id } });
        const bountyAwarded = mission?.bountyPoints || 10;
        try {
            await awardPoints(userName, bountyAwarded, true);
            io.emit('points-awarded', { userName, points: bountyAwarded, reason: 'mission-bounty', missionTitle: mission?.title });
        } catch (e) { /* user may not exist */ }

        io.emit('mission-completed', { missionId: id, userName, bountyAwarded });
        res.json({ success: true, message: 'Mission completed!', bountyAwarded });
    } catch (err) {
        console.error('Failed to complete mission:', err);
        res.status(500).json({ error: 'Failed to complete mission' });
    }
});

// Helper: compute rank from total points
function computeRank(totalPoints) {
    if (totalPoints >= 500) return 'Master';
    if (totalPoints >= 250) return 'Expert';
    if (totalPoints >= 100) return 'Explorer';
    if (totalPoints >= 30) return 'Scout';
    return 'Novice';
}

// Award points to a user (upsert if user doesn't exist by name)
async function awardPoints(userName, points, isBounty = false) {
    // Try to find user by name
    let user = await prisma.user.findFirst({ where: { name: userName } });
    if (user) {
        const newTotal = user.totalPoints + points;
        await prisma.user.update({
            where: { id: user.id },
            data: {
                totalPoints: newTotal,
                observationCount: { increment: isBounty ? 0 : 1 },
                bountyCount: { increment: isBounty ? 1 : 0 },
                rank: computeRank(newTotal),
            },
        });
    }
    // If no user record, points are tracked on client side
}

// ==================== GAMIFICATION ====================

// Leaderboard — top contributors
app.get('/api/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const users = await prisma.user.findMany({
            where: { role: 'citizen' },
            orderBy: { totalPoints: 'desc' },
            take: limit,
            select: {
                id: true,
                name: true,
                rank: true,
                totalPoints: true,
                observationCount: true,
                bountyCount: true,
                createdAt: true,
            },
        });
        res.json(users);
    } catch (err) {
        console.error('Leaderboard failed:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// User stats
app.get('/api/users/:name/stats', async (req, res) => {
    try {
        const { name } = req.params;
        let user = await prisma.user.findFirst({
            where: { name },
            select: {
                id: true, name: true, rank: true,
                totalPoints: true, observationCount: true, bountyCount: true,
            },
        });

        if (!user) {
            // Build stats from observations for an unregistered user
            const obsCount = await prisma.observation.count({ where: { userName: name } });
            const completedMissions = await prisma.userMission.count({
                where: { userName: name, status: 'completed' },
            });
            user = {
                name,
                rank: computeRank(obsCount * 10 + completedMissions * 25),
                totalPoints: obsCount * 10 + completedMissions * 25,
                observationCount: obsCount,
                bountyCount: completedMissions,
            };
        }

        // Next rank info
        const rankThresholds = [
            { rank: 'Novice', min: 0 },
            { rank: 'Scout', min: 30 },
            { rank: 'Explorer', min: 100 },
            { rank: 'Expert', min: 250 },
            { rank: 'Master', min: 500 },
        ];
        const currentIdx = rankThresholds.findIndex(r => r.rank === user.rank);
        const nextRank = currentIdx < rankThresholds.length - 1 ? rankThresholds[currentIdx + 1] : null;
        const currentMin = rankThresholds[currentIdx]?.min || 0;
        const progress = nextRank
            ? Math.min(100, Math.round(((user.totalPoints - currentMin) / (nextRank.min - currentMin)) * 100))
            : 100;

        res.json({
            ...user,
            nextRank: nextRank?.rank || null,
            nextRankPoints: nextRank?.min || null,
            rankProgress: progress,
        });
    } catch (err) {
        console.error('User stats failed:', err);
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
});

// Points summary (all-time stats)
app.get('/api/stats/summary', async (req, res) => {
    try {
        const [totalObs, totalUsers, totalMissions, topContributors] = await Promise.all([
            prisma.observation.count(),
            prisma.user.count({ where: { role: 'citizen' } }),
            prisma.mission.count({ where: { active: true } }),
            prisma.user.findMany({
                where: { role: 'citizen' },
                orderBy: { totalPoints: 'desc' },
                take: 3,
                select: { name: true, totalPoints: true, rank: true },
            }),
        ]);
        res.json({ totalObs, totalUsers, totalMissions, topContributors });
    } catch (err) {
        console.error('Stats summary failed:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ==================== SPATIAL QUERIES ====================

// Bounding-box search for observations
app.get('/api/observations/spatial', async (req, res) => {
    try {
        const { minLat, maxLat, minLng, maxLng, category } = req.query;

        if (!minLat || !maxLat || !minLng || !maxLng) {
            return res.status(400).json({ error: 'minLat, maxLat, minLng, maxLng are required' });
        }

        const where = {
            latitude: { gte: parseFloat(minLat), lte: parseFloat(maxLat) },
            longitude: { gte: parseFloat(minLng), lte: parseFloat(maxLng) },
        };
        if (category) where.category = category;

        const observations = await prisma.observation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 500,
        });

        res.json(observations);
    } catch (err) {
        console.error('Spatial query failed:', err);
        res.status(500).json({ error: 'Spatial query failed' });
    }
});

// Full area analysis for a given center point + radius (km)
app.get('/api/area-analysis', async (req, res) => {
    try {
        const { lat, lng, radiusKm = 5 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng are required' });
        }

        const centerLat = parseFloat(lat);
        const centerLng = parseFloat(lng);
        const radius = parseFloat(radiusKm);

        // Approximate bounding box (1 degree ≈ 111km)
        const latDelta = radius / 111;
        const lngDelta = radius / (111 * Math.cos(centerLat * Math.PI / 180));

        const observations = await prisma.observation.findMany({
            where: {
                latitude: { gte: centerLat - latDelta, lte: centerLat + latDelta },
                longitude: { gte: centerLng - lngDelta, lte: centerLng + lngDelta },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Get missions whose bounding boxes overlap this area
        const allMissions = await prisma.mission.findMany({ where: { active: true } });
        const nearbyMissions = allMissions.filter(m => {
            if (!m.geometry?.coordinates?.[0]) return false;
            const coords = m.geometry.coordinates[0];
            const mLats = coords.map(c => c[1]);
            const mLngs = coords.map(c => c[0]);
            const mMinLat = Math.min(...mLats), mMaxLat = Math.max(...mLats);
            const mMinLng = Math.min(...mLngs), mMaxLng = Math.max(...mLngs);
            // Check bounding box overlap
            return !(mMaxLat < centerLat - latDelta || mMinLat > centerLat + latDelta ||
                mMaxLng < centerLng - lngDelta || mMinLng > centerLng + lngDelta);
        });

        // Compute analytics
        const categoryBreakdown = {};
        const speciesSet = new Set();
        const dailyActivity = {};
        let verifiedCount = 0;

        observations.forEach(obs => {
            categoryBreakdown[obs.category] = (categoryBreakdown[obs.category] || 0) + 1;
            if (obs.aiLabel) speciesSet.add(obs.aiLabel);
            if (obs.verified) verifiedCount++;
            const day = new Date(obs.createdAt).toISOString().slice(0, 10);
            dailyActivity[day] = (dailyActivity[day] || 0) + 1;
        });

        // Recent contributors
        const contributorMap = {};
        observations.forEach(obs => {
            if (!contributorMap[obs.userName]) {
                contributorMap[obs.userName] = { count: 0, latest: obs.createdAt };
            }
            contributorMap[obs.userName].count++;
        });
        const topContributors = Object.entries(contributorMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            center: { lat: centerLat, lng: centerLng },
            radiusKm: radius,
            summary: {
                totalObservations: observations.length,
                uniqueSpecies: speciesSet.size,
                verifiedCount,
                verificationRate: observations.length > 0 ? (verifiedCount / observations.length * 100).toFixed(1) : 0,
                activeMissions: nearbyMissions.length,
            },
            categoryBreakdown,
            speciesList: [...speciesSet].sort(),
            dailyActivity,
            topContributors,
            nearbyMissions: nearbyMissions.map(m => ({
                id: m.id, title: m.title, missionType: m.missionType,
                bountyPoints: m.bountyPoints, description: m.description,
            })),
            recentObservations: observations.slice(0, 10),
        });
    } catch (err) {
        console.error('Area analysis failed:', err);
        res.status(500).json({ error: 'Area analysis failed' });
    }
});

// ==================== PAPERS ====================

app.get('/api/papers', async (req, res) => {
    try {
        const papers = await prisma.paper.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                researcher: { select: { id: true, name: true, institution: true } },
                mission: { select: { id: true, title: true, missionType: true } },
            },
        });
        res.json(papers);
    } catch (err) {
        console.error('Failed to fetch papers:', err);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

app.post('/api/papers', async (req, res) => {
    try {
        const { title, abstract, aiSummary, pdfUrl, researcherId, missionId } = req.body;

        if (!title || !researcherId) {
            return res.status(400).json({ error: 'title and researcherId are required' });
        }

        const paper = await prisma.paper.create({
            data: {
                title,
                abstract: abstract || null,
                aiSummary: aiSummary || null,
                pdfUrl: pdfUrl || null,
                researcherId,
                missionId: missionId || null,
            },
            include: {
                researcher: { select: { name: true, institution: true } },
                mission: { select: { title: true } },
            },
        });

        io.emit('new-paper', paper);
        res.status(201).json(paper);
    } catch (err) {
        console.error('Failed to create paper:', err);
        res.status(500).json({ error: 'Failed to create paper' });
    }
});

// ==================== USERS & LEADERBOARD ====================

app.get('/api/users', async (req, res) => {
    try {
        const { role } = req.query;
        const where = role ? { role } : {};
        const users = await prisma.user.findMany({
            where,
            orderBy: { totalPoints: 'desc' },
            select: {
                id: true, name: true, email: true, role: true,
                institution: true, rank: true, totalPoints: true,
                observationCount: true, bountyCount: true, createdAt: true,
            },
        });
        res.json(users);
    } catch (err) {
        console.error('Failed to fetch users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.get('/api/users/leaderboard', async (req, res) => {
    try {
        const leaderboard = await prisma.user.findMany({
            where: { role: 'citizen' },
            orderBy: { totalPoints: 'desc' },
            take: 10,
            select: {
                id: true, name: true, rank: true,
                totalPoints: true, observationCount: true, bountyCount: true,
            },
        });
        res.json(leaderboard);
    } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});


const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
    console.log(`CitSciNet server running on http://localhost:${PORT}`);
    console.log(`Socket.io ready for connections`);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
