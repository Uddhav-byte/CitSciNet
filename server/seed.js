import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const sampleObservations = [
    {
        latitude: 28.6139,
        longitude: 77.2090,
        category: 'Bird',
        aiLabel: 'Indian Peafowl',
        confidenceScore: 0.92,
        userName: 'Arjun Sharma',
        notes: 'Spotted a beautiful peacock displaying its feathers near the park entrance',
        verified: true,
    },
    {
        latitude: 19.0760,
        longitude: 72.8777,
        category: 'Mammal',
        aiLabel: 'Rhesus Macaque',
        confidenceScore: 0.87,
        userName: 'Priya Patel',
        notes: 'Group of monkeys near the mangrove area',
        verified: true,
    },
    {
        latitude: 12.9716,
        longitude: 77.5946,
        category: 'Insect',
        aiLabel: 'Common Jezebel Butterfly',
        confidenceScore: 0.78,
        userName: 'Deepak Kumar',
        notes: 'Beautiful butterfly resting on a flower in Cubbon Park',
        verified: false,
    },
    {
        latitude: 13.0827,
        longitude: 80.2707,
        category: 'Bird',
        aiLabel: 'Spotted Owlet',
        confidenceScore: 0.83,
        userName: 'Lakshmi Narayanan',
        notes: 'Owl spotted at dusk in IIT campus',
        verified: true,
    },
    {
        latitude: 22.5726,
        longitude: 88.3639,
        category: 'Reptile',
        aiLabel: 'Indian Garden Lizard',
        confidenceScore: 0.71,
        userName: 'Rahul Das',
        notes: 'Changeable lizard basking on a wall',
        verified: false,
    },
    {
        latitude: 26.9124,
        longitude: 75.7873,
        category: 'Plant',
        aiLabel: 'Bougainvillea',
        confidenceScore: 0.95,
        userName: 'Meera Joshi',
        notes: 'Massive blooming bougainvillea near Hawa Mahal',
        verified: true,
    },
    {
        latitude: 15.2993,
        longitude: 74.1240,
        category: 'Bird',
        aiLabel: 'White-bellied Sea Eagle',
        confidenceScore: 0.68,
        userName: 'Vikram Naik',
        notes: 'Eagle soaring over the beach during high tide',
        verified: false,
    },
    {
        latitude: 23.0225,
        longitude: 72.5714,
        category: 'Mammal',
        aiLabel: 'Indian Palm Squirrel',
        confidenceScore: 0.91,
        userName: 'Anita Shah',
        notes: 'Three-striped squirrel collecting nuts in the garden',
        verified: true,
    },
    {
        latitude: 11.0168,
        longitude: 76.9558,
        category: 'Amphibian',
        aiLabel: 'Indian Bullfrog',
        confidenceScore: 0.74,
        userName: 'Suresh Rajan',
        notes: 'Large green bullfrog near the rice paddy after rain',
        verified: false,
    },
    {
        latitude: 30.7333,
        longitude: 76.7794,
        category: 'Insect',
        aiLabel: 'Blue Mormon Butterfly',
        confidenceScore: 0.82,
        userName: 'Harpreet Singh',
        notes: 'Stunning blue-winged butterfly in the university garden',
        verified: true,
    },
    {
        latitude: 17.3850,
        longitude: 78.4867,
        category: 'Bird',
        aiLabel: 'Rose-ringed Parakeet',
        confidenceScore: 0.89,
        userName: 'Kavitha Reddy',
        notes: 'Flock of parakeets feeding on neem berries',
        verified: true,
    },
    {
        latitude: 25.3176,
        longitude: 82.9739,
        category: 'Fish',
        aiLabel: 'Indian Catfish',
        confidenceScore: 0.65,
        userName: 'Amit Mishra',
        notes: 'Caught a glimpse in the shallow waters of the Ganges tributary',
        verified: false,
    },
];

const sampleMissions = [
    {
        title: 'Bird Census — Delhi Ridge Forest',
        description: 'Count and photograph all bird species in the Delhi Ridge area. Focus on migratory birds during the winter season.',
        bountyPoints: 50,
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [77.17, 28.64],
                    [77.22, 28.64],
                    [77.22, 28.60],
                    [77.17, 28.60],
                    [77.17, 28.64],
                ],
            ],
        },
        createdBy: 'Dr. Rajan Patel',
    },
    {
        title: 'Butterfly Survey — Bangalore Parks',
        description: 'Document butterfly species across Bangalore urban parks. Record wing patterns and host plants.',
        bountyPoints: 30,
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [77.57, 12.99],
                    [77.62, 12.99],
                    [77.62, 12.95],
                    [77.57, 12.95],
                    [77.57, 12.99],
                ],
            ],
        },
        createdBy: 'Prof. Sunita Rao',
    },
    {
        title: 'Mangrove Wildlife — Mumbai Coast',
        description: 'Monitor wildlife activity in Mumbai mangrove zones. Look for crabs, mudskippers, and wading birds.',
        bountyPoints: 75,
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [72.85, 19.10],
                    [72.92, 19.10],
                    [72.92, 19.05],
                    [72.85, 19.05],
                    [72.85, 19.10],
                ],
            ],
        },
        createdBy: 'Dr. Farah Khan',
    },
];

async function seed() {
    console.log('🌱 Seeding CitSciNet database...\n');

    // Clear existing data
    await prisma.userMission.deleteMany();
    await prisma.mission.deleteMany();
    await prisma.observation.deleteMany();

    console.log('  ✓ Cleared existing data');

    // Seed observations
    for (const obs of sampleObservations) {
        await prisma.observation.create({ data: obs });
    }
    console.log(`  ✓ Created ${sampleObservations.length} observations`);

    // Seed missions
    for (const mission of sampleMissions) {
        await prisma.mission.create({ data: mission });
    }
    console.log(`  ✓ Created ${sampleMissions.length} missions`);

    console.log('\n✅ Seeding complete!');
}

seed()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
