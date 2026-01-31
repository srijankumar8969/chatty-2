import { v2 as cloudinary } from 'cloudinary';
import { config } from "dotenv";
import fs from 'fs';

config();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const deleteFromCloudinary = async (publicUrl) => {
    try {
        if (!publicUrl) return null;

        const urlParts = publicUrl.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];

        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.log("Error deleting file from cloudinary:", error);
        return null;
    }
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        try { if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath); } catch (e) { console.log('Error deleting temp file:', e); }
        return { url: response.secure_url || response.url, raw: response };
    } catch (error) {
        console.log("Error uploading file to cloudinary:", error);
        try { if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath); } catch (e) { console.log('Error deleting temp file after failed upload:', e); }
        return null;
    }
}

export default cloudinary;
export { uploadOnCloudinary, deleteFromCloudinary };