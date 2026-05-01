import prisma from "./prisma.js";
import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary just in case (though it usually is globally)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts Cloudinary public ID from URL
 * Example: https://res.cloudinary.com/demo/image/upload/v1234/folder/file.jpg
 * Public ID: folder/file
 */
function getPublicId(url) {
  if (!url) return null;
  // Match after /upload/ and v[0-9]+/ but before the extension
  const parts = url.split("/upload/");
  if (parts.length < 2) return null;
  
  let afterUpload = parts[1];
  // Remove versioning (v1234567890/)
  afterUpload = afterUpload.replace(/^v\d+\//, "");
  
  // Remove extension
  const dotIndex = afterUpload.lastIndexOf(".");
  if (dotIndex > -1) {
    return afterUpload.substring(0, dotIndex);
  }
  return afterUpload;
}

export async function cleanupExpiredAttachments() {
  console.log("Checking for expired attachments...");
  try {
    const expired = await prisma.message.findMany({
      where: {
        isCloudDeleted: false,
        expiresAt: { lt: new Date() },
        OR: [
          { fileUrl: { not: null } },
          { imageUrl: { not: null } }
        ]
      },
      take: 50 // Batches of 50
    });

    if (expired.length === 0) {
      console.log("No expired attachments found.");
      return;
    }

    for (const msg of expired) {
      const url = msg.fileUrl || msg.imageUrl;
      const publicId = getPublicId(url);
      
      if (publicId) {
        console.log(`Deleting ${publicId} from Cloudinary...`);
        // We use resource_type auto or specific based on our knowledge
        const resourceType = msg.fileType === "video" ? "video" : (msg.fileType === "pdf" ? "raw" : "image");
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      }

      await prisma.message.update({
        where: { id: msg.id },
        data: { 
          isCloudDeleted: true,
          fileUrl: null,
          imageUrl: null
        }
      });
    }

    console.log(`Cleaned up ${expired.length} attachments.`);
  } catch (err) {
    console.error("Cleanup job failed:", err);
  }
}
