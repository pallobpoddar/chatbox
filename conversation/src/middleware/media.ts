import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

const ensureDirectoryExists = (dirPath: string) => {
	if (!fs.existsSync(dirPath)) {
	  fs.mkdirSync(dirPath, { recursive: true }); // Creates the directory and any necessary subdirectories
	}
  };
  

  const storage = multer.diskStorage({
	destination: function (req, file, cb) {
	  const uploadDir = 'public/uploads/';
	  ensureDirectoryExists(uploadDir); // Ensure directory exists
	  cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
	  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
	  cb(null, uniqueSuffix + path.extname(file.originalname));
	},
  });

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Regular expression to match the allowed file types
    const fileTypes = /jpeg|jpg|png|gif|bmp|tiff|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|csv|rtf|zip|html|json|mp4|3gp|avi|mkv|mov|mpeg|m4v|webm|aac|m4a|amr|mp3|opus|wav/;
    // Check extension and mime type
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);
  
    if (extname && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only allowed images, PDFs, documents, videos, and audio files are permitted'));
    }
  };

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB file size limit
  fileFilter: fileFilter,
});

export const uploadMedia = upload.array('media', 5); // Allow up to 5 files
