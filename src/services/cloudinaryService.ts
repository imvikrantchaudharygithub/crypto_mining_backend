import cloudinary from '../config/cloudinary';

export const uploadToCloudinary = async (filePath: string) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, { folder: 'crypto-mining' });
    return { url: result.secure_url, public_id: result.public_id };
  } catch (error) {
    throw new Error('Image upload failed');
  }
};

export const uploadCloudinary = async (file: Express.Multer.File, folder: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
