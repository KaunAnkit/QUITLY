import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const router = express.Router();

// Configure multer
const upload = multer({ 
    dest: "uploads/",
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for PDF
});

// Test Cloudinary connection
router.get("/test", async (req, res) => {
    try {
        const result = await cloudinary.api.ping();
        res.json({ success: true, message: "Cloudinary connected", result });
    } catch (err) {
        res.status(500).json({ success: false, message: "Cloudinary connection failed", error: err.message });
    }
});

// POST route for multiple file upload
router.post("/", upload.fields([
    { name: "coverupload", maxCount: 1 },
    { name: "pdfUpload", maxCount: 1 }
]), async (req, res) => {
    try {
        const coverFile = req.files.coverupload?.[0];
        const pdfFile = req.files.pdfUpload?.[0];

        if (!coverFile) return res.status(400).json({ success: false, message: "No cover image uploaded" });
        if (!pdfFile) return res.status(400).json({ success: false, message: "No PDF uploaded" });

        // Upload cover to Cloudinary
        const coverResult = await cloudinary.uploader.upload(coverFile.path, {
            folder: "book_covers",
            resource_type: "auto",
            public_id: `book_${Date.now()}`
        });

        // Optionally: Upload PDF to Cloudinary (resource_type 'raw')
        const pdfResult = await cloudinary.uploader.upload(pdfFile.path, {
            folder: "book_pdfs",
            resource_type: "raw",
            public_id: `book_${Date.now()}_pdf`
        });

        // Cleanup local files
        [coverFile.path, pdfFile.path].forEach(path => {
            if (fs.existsSync(path)) fs.unlinkSync(path);
        });

        res.json({
            success: true,
            message: "Files uploaded successfully",
            data: {
                bookName: req.body.bookName,
                authorName: req.body.authorName,
                coverUrl: coverResult.secure_url,
                pdfUrl: pdfResult.secure_url
            }
        });

    } catch (err) {
        console.error(err);
        if (req.files) {
            Object.values(req.files).flat().forEach(f => {
                if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            });
        }
        res.status(500).json({ success: false, message: "Upload failed", error: err.message });
    }
});

export default router;
