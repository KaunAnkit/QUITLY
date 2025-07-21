// routes/coverpage.js
import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const router = express.Router();

// Configure multer
const upload = multer({ 
    dest: "uploads/",
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Test endpoint to verify Cloudinary connection
router.get("/test", async (req, res) => {
    try {
        console.log("Testing Cloudinary connection...");
        
        // Test the connection
        const result = await cloudinary.api.ping();
        console.log("✅ Cloudinary ping successful:", result);
        
        res.json({ 
            success: true, 
            message: "Cloudinary connected successfully", 
            result 
        });
    } catch (err) {
        console.error("❌ Cloudinary connection failed:", err);
        res.status(500).json({ 
            success: false, 
            message: "Cloudinary connection failed",
            error: err.message 
        });
    }
});

router.post("/", upload.single("coverupload"), async (req, res) => {
    console.log("\n=== NEW UPLOAD REQUEST ===");
    console.log("📁 Received file:", req.file);
    console.log("📝 Received fields:", req.body);
    
    try {
        // Check if file was received
        if (!req.file) {
            console.log("❌ No file received");
            return res.status(400).json({ 
                success: false, 
                message: "No file uploaded" 
            });
        }

        console.log("🔄 Starting Cloudinary upload...");
        console.log("📂 File path:", req.file.path);
        console.log("📊 File size:", req.file.size, "bytes");

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "book_covers",
            resource_type: "auto",
            public_id: `book_${Date.now()}` // Optional: give it a unique name
        });

        console.log("✅ Cloudinary upload successful!");
        console.log("🔗 Cloudinary URL:", result.secure_url);
        console.log("🆔 Public ID:", result.public_id);

        // Clean up local file
        try {
            fs.unlinkSync(req.file.path);
            console.log("🧹 Local file cleaned up");
        } catch (cleanupError) {
            console.log("⚠️ Failed to cleanup local file:", cleanupError.message);
        }

        // Send success response
        res.json({ 
            success: true, 
            message: "Upload successful",
            url: result.secure_url,
            publicId: result.public_id,
            data: {
                bookName: req.body.bookName,
                authorName: req.body.authorName,
                coverUrl: result.secure_url
            }
        });
        
    } catch (err) {
        console.error("\n❌ UPLOAD ERROR:");
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        
        // Clean up local file on error
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log("🧹 Cleaned up local file after error");
            } catch (cleanupError) {
                console.error("Failed to cleanup:", cleanupError.message);
            }
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Upload failed", 
            error: err.message 
        });
    }
});

export default router;