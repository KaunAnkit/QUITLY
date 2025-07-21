import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log("🔧 Loading Cloudinary config...");
console.log("📋 Environment variables check:");
console.log("- CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME || "❌ NOT SET");
console.log("- CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ SET" : "❌ NOT SET");
console.log("- CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ SET" : "❌ NOT SET");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration
const config = cloudinary.config();
console.log("☁️ Cloudinary configured with cloud_name:", config.cloud_name);

if (!config.cloud_name || !config.api_key || !config.api_secret) {
  console.error("❌ Cloudinary configuration is incomplete!");
  console.error("Please check your .env file contains:");
  console.error("CLOUDINARY_CLOUD_NAME=your_cloud_name");
  console.error("CLOUDINARY_API_KEY=your_api_key");  
  console.error("CLOUDINARY_API_SECRET=your_api_secret");
} else {
  console.log("✅ Cloudinary configuration loaded successfully");
}

export default cloudinary;