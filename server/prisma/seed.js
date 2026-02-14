import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// ────────────────────────────────────────────────────
// Helper: random point inside a polygon
// ────────────────────────────────────────────────────
function randomPointInPolygon(coords) {
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

    // Simple rejection sampling inside bounding box (good enough for convex-ish polygons)
    for (let attempt = 0; attempt < 100; attempt++) {
        const lat = minLat + Math.random() * (maxLat - minLat);
        const lng = minLng + Math.random() * (maxLng - minLng);
        if (pointInPolygon([lng, lat], coords)) return { lat, lng };
    }
    // Fallback: centroid
    return {
        lat: lats.reduce((a, b) => a + b) / lats.length,
        lng: lngs.reduce((a, b) => a + b) / lngs.length,
    };
}

function pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

function randomDate(daysBack) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
    d.setHours(Math.floor(Math.random() * 14) + 6); // 6 AM to 8 PM
    d.setMinutes(Math.floor(Math.random() * 60));
    return d;
}

// ────────────────────────────────────────────────────
// DATA DEFINITIONS
// ────────────────────────────────────────────────────

const RESEARCHERS = [
    {
        email: 'dr.sharma@nitp.ac.in',
        name: 'Dr. Ananya Sharma',
        role: 'researcher',
        institution: 'National Institute of Technology, Patna',
        rank: 'Peer Reviewer',
        totalPoints: 2400,
    },
    {
        email: 'ravi@ecowatch.org',
        name: 'Ravi Mehta',
        role: 'researcher',
        institution: 'EcoWatch India Foundation',
        rank: 'Peer Reviewer',
        totalPoints: 1800,
    },
];

const CITIZENS = [
    { email: 'priya.k@gmail.com', name: 'Priya Kumar', rank: 'Scout', totalPoints: 650, observationCount: 42, bountyCount: 8 },
    { email: 'arjun.s@gmail.com', name: 'Arjun Singh', rank: 'Novice', totalPoints: 120, observationCount: 12, bountyCount: 2 },
    { email: 'meera.r@gmail.com', name: 'Meera Rao', rank: 'Scout', totalPoints: 890, observationCount: 57, bountyCount: 12 },
    { email: 'vikram.d@outlook.com', name: 'Vikram Desai', rank: 'Peer Reviewer', totalPoints: 1450, observationCount: 98, bountyCount: 19 },
    { email: 'nisha.p@gmail.com', name: 'Nisha Patel', rank: 'Novice', totalPoints: 80, observationCount: 6, bountyCount: 1 },
];

// Polygons centered around Patna, Bihar (NIT Patna area ~25.62°N, 85.17°E)
const MISSIONS = [
    {
        title: 'River Health Check — Ganga Ghats',
        description: 'Monitor water quality along the Ganges ghats near Patna. Record pH levels, turbidity, and presence of aquatic life.',
        scientificGoal: 'Establish a citizen-science baseline for water quality metrics along a 5km stretch of the Ganges River near Patna.',
        dataProtocol: '1. Approach the water body safely\n2. Record water color and turbidity visually\n3. Use pH strip (if available) and record reading\n4. Note any wildlife or fish visible\n5. Photograph the water surface and surroundings\n6. Record GPS coordinates automatically',
        missionType: 'Water',
        bountyPoints: 25,
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [85.145, 25.615],
                [85.175, 25.615],
                [85.180, 25.630],
                [85.170, 25.640],
                [85.150, 25.635],
                [85.140, 25.625],
                [85.145, 25.615],
            ]],
        },
    },
    {
        title: 'Urban Butterfly Census — Eco Park',
        description: 'Count and photograph butterfly species in the Eco Park and surrounding green corridors. Focus on identifying native vs migratory species.',
        scientificGoal: 'Map butterfly diversity and seasonal migration patterns across urban green spaces in Patna.',
        dataProtocol: '1. Walk slowly through designated corridors\n2. Photograph every butterfly species spotted\n3. Record species name (if known) or describe wing pattern\n4. Count the number of individuals per species\n5. Note behavior: feeding, resting, flying\n6. Record time and weather conditions',
        missionType: 'Wildlife',
        bountyPoints: 15,
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [85.100, 25.590],
                [85.125, 25.590],
                [85.130, 25.605],
                [85.120, 25.615],
                [85.105, 25.610],
                [85.095, 25.600],
                [85.100, 25.590],
            ]],
        },
    },
    {
        title: 'Invasive Plant Tracking — Forest Edge',
        description: 'Identify and track invasive plant species along the forest boundary. Report Lantana camara, Parthenium, and Water Hyacinth sightings.',
        scientificGoal: 'Create a spatial distribution map of invasive plant species to guide ecological restoration efforts.',
        dataProtocol: '1. Walk along the designated forest boundary\n2. Identify invasive species (reference images provided)\n3. Photograph the plant with leaves visible\n4. Estimate the area covered by the invasion\n5. Note nearby native species affected\n6. Mark your GPS location',
        missionType: 'Plant',
        bountyPoints: 20,
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [85.185, 25.640],
                [85.210, 25.640],
                [85.215, 25.660],
                [85.200, 25.670],
                [85.185, 25.665],
                [85.180, 25.650],
                [85.185, 25.640],
            ]],
        },
    },
];

const UNSPLASH_IMAGES = {
    Water: [
        'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800',
        'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800',
    ],
    Wildlife: [
        'https://images.unsplash.com/photo-1549608276-5786777e6587?w=800',
        'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800',
        'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800',
        'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=800',
    ],
    Plant: [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
        'https://images.unsplash.com/photo-1518882039695-bbd718bf4ef3?w=800',
        'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800',
        'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800',
    ],
};

const CATEGORY_LABELS = {
    Water: [
        { category: 'Fish', labels: ['Rohu Fish', 'Catla Fish', 'Hilsa', 'Catfish'] },
        { category: 'Amphibian', labels: ['Indian Bullfrog', 'Tree Frog', 'Common Frog'] },
        { category: 'Bird', labels: ['Kingfisher', 'River Tern', 'White Egret'] },
    ],
    Wildlife: [
        { category: 'Bird', labels: ['Painted Lady Butterfly', 'Common Crow Butterfly', 'Blue Mormon', 'Monarch Butterfly'] },
        { category: 'Insect', labels: ['Monarch Butterfly', 'Painted Lady', 'Swallowtail', 'Blue Tiger'] },
        { category: 'Bird', labels: ['Indian Robin', 'House Sparrow', 'Rose-ringed Parakeet'] },
    ],
    Plant: [
        { category: 'Plant', labels: ['Lantana camara', 'Parthenium hysterophorus', 'Water Hyacinth'] },
        { category: 'Plant', labels: ['Neem Tree', 'Banyan Tree', 'Peepal Tree', 'Ashoka Tree'] },
        { category: 'Plant', labels: ['Congress Grass', 'Calotropis', 'Datura'] },
    ],
};

const PAPERS = [
    {
        title: 'Citizen-Driven Water Quality Assessment of the Ganges River near Patna: A Crowdsourced Approach',
        abstract: 'This study leverages citizen science observations to establish a comprehensive water quality baseline along a 5km stretch of the Ganges River near Patna, Bihar. Using mobile-submitted photographic evidence and structured protocols, we analyze turbidity patterns, aquatic biodiversity indicators, and seasonal variations. Our findings indicate significant spatial heterogeneity in water quality, with industrial outfall zones showing 3x higher turbidity than upstream reference points. The citizen science approach proved 87% concordant with laboratory-validated measurements.',
        aiSummary: 'Regular people helped scientists check how clean the Ganges River is near Patna. They took photos and measurements using their phones. The study found that water near factories is much dirtier than in other areas. Amazingly, the citizen data was almost as accurate as expensive lab tests — matching 87% of the time!',
    },
    {
        title: 'Urban Butterfly Diversity as a Bioindicator of Ecosystem Health in Patna Metropolitan Area',
        abstract: 'We present results from a 6-month citizen science survey documenting butterfly species diversity across urban green spaces in Patna. A total of 342 citizen observations across 23 species were recorded, including 4 species previously undocumented in the region. Statistical analysis reveals strong correlation (r=0.82) between butterfly diversity indices and vegetation cover percentage. Parks with >40% native plant cover hosted 2.3x more butterfly species than manicured gardens.',
        aiSummary: 'Scientists worked with local volunteers to count butterflies in Patna parks and gardens. They found 23 different species, including 4 never before recorded in this area! Parks with more natural plants had way more butterfly species — about 2.3 times more than carefully maintained gardens. This suggests butterflies can tell us how healthy our green spaces really are.',
    },
];

// ────────────────────────────────────────────────────
// MAIN SEED FUNCTION
// ────────────────────────────────────────────────────
async function main() {
    console.log('🌱 Seeding CitSciNet database...\n');

    // 1. Upsert researchers
    console.log('👩‍🔬 Creating researchers...');
    const researcherRecords = [];
    for (const r of RESEARCHERS) {
        const user = await prisma.user.upsert({
            where: { email: r.email },
            update: { name: r.name, institution: r.institution },
            create: { ...r },
        });
        researcherRecords.push(user);
        console.log(`   ✓ ${user.name} (${user.institution})`);
    }

    // 2. Upsert citizens
    console.log('\n🧑‍🔬 Creating citizen scientists...');
    const citizenRecords = [];
    for (const c of CITIZENS) {
        const user = await prisma.user.upsert({
            where: { email: c.email },
            update: { name: c.name },
            create: { ...c, role: 'citizen' },
        });
        citizenRecords.push(user);
        console.log(`   ✓ ${user.name} — Rank: ${user.rank} (${user.totalPoints} pts)`);
    }

    // 3. Create missions
    console.log('\n🎯 Creating missions...');
    const missionRecords = [];
    for (const m of MISSIONS) {
        // Delete existing mission with same title to avoid duplicates
        await prisma.mission.deleteMany({ where: { title: m.title } });
        const mission = await prisma.mission.create({
            data: {
                title: m.title,
                description: m.description,
                scientificGoal: m.scientificGoal,
                dataProtocol: m.dataProtocol,
                bountyPoints: m.bountyPoints,
                missionType: m.missionType,
                geometry: m.geometry,
                createdBy: researcherRecords[missionRecords.length % 2].name,
            },
        });
        missionRecords.push(mission);
        console.log(`   ✓ ${mission.title} [${mission.missionType}] — ${mission.bountyPoints} pts`);
    }

    // 4. Create observations (spread across 30 days)
    console.log('\n📍 Creating observations...');
    let obsCount = 0;

    for (let mIdx = 0; mIdx < missionRecords.length; mIdx++) {
        const mission = missionRecords[mIdx];
        const missionDef = MISSIONS[mIdx];
        const coords = missionDef.geometry.coordinates[0];
        const mType = missionDef.missionType;
        const images = UNSPLASH_IMAGES[mType] || UNSPLASH_IMAGES.Wildlife;
        const catLabels = CATEGORY_LABELS[mType] || CATEGORY_LABELS.Wildlife;

        // 8-9 observations per mission
        const numObs = 8 + Math.floor(Math.random() * 2);

        for (let i = 0; i < numObs; i++) {
            const point = randomPointInPolygon(coords);
            const catLabel = catLabels[Math.floor(Math.random() * catLabels.length)];
            const label = catLabel.labels[Math.floor(Math.random() * catLabel.labels.length)];
            const citizen = citizenRecords[Math.floor(Math.random() * citizenRecords.length)];
            const confidence = 0.70 + Math.random() * 0.28; // 0.70 — 0.98
            const createdAt = randomDate(30);

            await prisma.observation.create({
                data: {
                    latitude: parseFloat(point.lat.toFixed(6)),
                    longitude: parseFloat(point.lng.toFixed(6)),
                    imageUrl: images[Math.floor(Math.random() * images.length)],
                    category: catLabel.category,
                    aiLabel: label,
                    confidenceScore: parseFloat(confidence.toFixed(3)),
                    userName: citizen.name,
                    userId: citizen.id,
                    missionId: mission.id,
                    notes: faker.lorem.sentence({ min: 4, max: 12 }),
                    verified: Math.random() > 0.4, // 60% verified
                    createdAt,
                },
            });
            obsCount++;
        }
    }
    console.log(`   ✓ ${obsCount} observations created across ${missionRecords.length} mission zones`);

    // 5. Create papers
    console.log('\n📄 Creating research papers...');
    for (let i = 0; i < PAPERS.length; i++) {
        const paper = PAPERS[i];
        await prisma.paper.deleteMany({ where: { title: paper.title } });
        const created = await prisma.paper.create({
            data: {
                title: paper.title,
                abstract: paper.abstract,
                aiSummary: paper.aiSummary,
                pdfUrl: `https://arxiv.org/pdf/2024.${1000 + i}`,
                researcherId: researcherRecords[i % 2].id,
                missionId: missionRecords[i % missionRecords.length].id,
            },
        });
        console.log(`   ✓ "${created.title.slice(0, 60)}..." → linked to ${missionRecords[i % missionRecords.length].title.slice(0, 30)}`);
    }

    // 6. Accept some missions for citizens
    console.log('\n🤝 Creating mission acceptances...');
    for (let i = 0; i < 4; i++) {
        try {
            await prisma.userMission.create({
                data: {
                    missionId: missionRecords[i % missionRecords.length].id,
                    userName: citizenRecords[i].name,
                    status: i < 2 ? 'completed' : 'accepted',
                    completedAt: i < 2 ? randomDate(7) : null,
                },
            });
            console.log(`   ✓ ${citizenRecords[i].name} → ${missionRecords[i % missionRecords.length].title.slice(0, 30)}... (${i < 2 ? 'completed' : 'accepted'})`);
        } catch {
            // Ignore duplicate
        }
    }

    console.log('\n✅ Seed complete!\n');
    console.log('📊 Summary:');
    console.log(`   Researchers:   ${researcherRecords.length}`);
    console.log(`   Citizens:      ${citizenRecords.length}`);
    console.log(`   Missions:      ${missionRecords.length}`);
    console.log(`   Observations:  ${obsCount}`);
    console.log(`   Papers:        ${PAPERS.length}`);
    console.log(`\n🔬 Run 'npx prisma studio' to explore the data!`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
