import multer from 'multer';

const storage = multer.memoryStorage();

// Accept any file at the multer layer; the magic-byte check in
// assertValidMedia (media.js) rejects non-image/video content strictly.
// Checking only the filename extension here causes false rejections when
// phones or OS tools rename files (e.g. IMG_001.HEIC renamed to .jpg,
// screenshots saved as .png.jpg, etc.).
export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 120 * 1024 * 1024 },
});