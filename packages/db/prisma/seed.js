import "dotenv/config";
import bcrypt from "bcryptjs";
import { DeviceType, FrameTemplateType, LocationStatus, PhotoProcessingStatus, PhotoSessionStatus, PrismaClient, Role } from "@prisma/client";
const prisma = new PrismaClient();
async function seedUsers() {
    const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
    const demoPasswordHash = await bcrypt.hash("Demo123!", 10);
    await prisma.user.upsert({
        where: { email: "admin@photobooth.local" },
        update: {
            fullName: "Photobooth Admin",
            passwordHash: adminPasswordHash,
            role: Role.ADMIN
        },
        create: {
            fullName: "Photobooth Admin",
            email: "admin@photobooth.local",
            passwordHash: adminPasswordHash,
            role: Role.ADMIN
        }
    });
    await prisma.user.upsert({
        where: { email: "demo@photobooth.local" },
        update: {
            fullName: "Demo User",
            passwordHash: demoPasswordHash,
            role: Role.USER
        },
        create: {
            fullName: "Demo User",
            email: "demo@photobooth.local",
            passwordHash: demoPasswordHash,
            role: Role.USER
        }
    });
}
async function seedLocationsAndFrames() {
    const hoiAn = await prisma.location.upsert({
        where: { slug: "hoi-an-ancient-town" },
        update: {
            name: "Hoi An Ancient Town",
            description: "Heritage photobooth template pack.",
            thumbnailUrl: "/seed/hoi-an.jpg",
            status: LocationStatus.ACTIVE
        },
        create: {
            id: "seed-location-hoian",
            name: "Hoi An Ancient Town",
            slug: "hoi-an-ancient-town",
            description: "Heritage photobooth template pack.",
            thumbnailUrl: "/seed/hoi-an.jpg",
            status: LocationStatus.ACTIVE
        }
    });
    const hue = await prisma.location.upsert({
        where: { slug: "hue-imperial-city" },
        update: {
            name: "Hue Imperial City",
            description: "Imperial city passport journey stop.",
            thumbnailUrl: "/seed/hue.jpg",
            status: LocationStatus.ACTIVE
        },
        create: {
            id: "seed-location-hue",
            name: "Hue Imperial City",
            slug: "hue-imperial-city",
            description: "Imperial city passport journey stop.",
            thumbnailUrl: "/seed/hue.jpg",
            status: LocationStatus.ACTIVE
        }
    });
    await prisma.frameTemplate.upsert({
        where: { id: "seed-frame-hoian-01" },
        update: {
            name: "Hoi An Frame 01",
            locationId: hoiAn.id,
            imageUrl: "/frames/hoi-an-frame-01.png",
            type: FrameTemplateType.SINGLE,
            isActive: true
        },
        create: {
            id: "seed-frame-hoian-01",
            name: "Hoi An Frame 01",
            locationId: hoiAn.id,
            imageUrl: "/frames/hoi-an-frame-01.png",
            type: FrameTemplateType.SINGLE,
            isActive: true
        }
    });
    await prisma.frameTemplate.upsert({
        where: { id: "seed-frame-hue-01" },
        update: {
            name: "Hue Frame 01",
            locationId: hue.id,
            imageUrl: "/frames/hue-frame-01.png",
            type: FrameTemplateType.SINGLE,
            isActive: true
        },
        create: {
            id: "seed-frame-hue-01",
            name: "Hue Frame 01",
            locationId: hue.id,
            imageUrl: "/frames/hue-frame-01.png",
            type: FrameTemplateType.SINGLE,
            isActive: true
        }
    });
}
async function seedDemoSession() {
    const demoUser = await prisma.user.findUniqueOrThrow({
        where: { email: "demo@photobooth.local" }
    });
    const location = await prisma.location.findUniqueOrThrow({
        where: { slug: "hoi-an-ancient-town" }
    });
    const session = await prisma.photoSession.upsert({
        where: { id: "seed-photo-session" },
        update: {
            userId: demoUser.id,
            locationId: location.id,
            deviceType: DeviceType.WEB,
            status: PhotoSessionStatus.PROCESSED
        },
        create: {
            id: "seed-photo-session",
            userId: demoUser.id,
            locationId: location.id,
            deviceType: DeviceType.WEB,
            status: PhotoSessionStatus.PROCESSED
        }
    });
    const asset = await prisma.photoAsset.upsert({
        where: { id: "seed-photo-asset" },
        update: {
            sessionId: session.id,
            selectedFrameTemplateId: "seed-frame-hoian-01",
            processingStatus: PhotoProcessingStatus.PROCESSED,
            originalKey: "seed/demo-original.jpg",
            processedKey: "seed/demo-processed.jpg",
            previewKey: "seed/demo-preview.jpg",
            qrCodeKey: "seed/demo-qr.png"
        },
        create: {
            id: "seed-photo-asset",
            sessionId: session.id,
            selectedFrameTemplateId: "seed-frame-hoian-01",
            processingStatus: PhotoProcessingStatus.PROCESSED,
            originalKey: "seed/demo-original.jpg",
            processedKey: "seed/demo-processed.jpg",
            previewKey: "seed/demo-preview.jpg",
            qrCodeKey: "seed/demo-qr.png"
        }
    });
    await prisma.passportStamp.upsert({
        where: {
            userId_locationId: {
                userId: demoUser.id,
                locationId: location.id
            }
        },
        update: {
            photoId: asset.id
        },
        create: {
            userId: demoUser.id,
            locationId: location.id,
            photoId: asset.id
        }
    });
}
async function main() {
    await seedUsers();
    await seedLocationsAndFrames();
    await seedDemoSession();
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map