import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (allowedFormats.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, JPEG, PNG, and WebP files are allowed'), false);
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: <any>{
    folder: 'crypto-mining',
    format: async (_req: any, file: any) => file.mimetype.split('/')[1],
    public_id: (_req: any, file: any) => `${Date.now()}-${file.originalname.split('.')[0]}`,
  },
});

const upload = multer({ storage, fileFilter });

export default upload;
