import { Request, Response } from 'express';
import Media from '../models/media.model';
import { deleteFromCloudinary } from '../services/cloudinaryService';

export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ message: 'No file uploaded' }); return; }

    const file = req.file as any;
    const media = await Media.create({
      url: file.path || file.secure_url,
      publicId: file.filename || file.public_id,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      folder: req.body.folder || 'misc',
      uploadedBy: req.user?._id,
    });

    res.status(201).json({ success: true, message: 'File uploaded', media });
  } catch (error) {
    console.error('Error in uploadMedia:', error);
    res.status(500).json({ success: false, message: 'Failed to upload media', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.folder) filter.folder = req.query.folder;
    const media = await Media.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, media });
  } catch (error) {
    console.error('Error in getMedia:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch media', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    const media = await Media.findById(id);
    if (!media) { res.status(404).json({ message: 'Media not found' }); return; }

    if (media.publicId) {
      await deleteFromCloudinary(media.publicId as string);
    }
    await Media.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Media deleted' });
  } catch (error) {
    console.error('Error in deleteMedia:', error);
    res.status(500).json({ success: false, message: 'Failed to delete media', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
