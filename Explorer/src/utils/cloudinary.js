import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    console.log("uploadToCloudinary called with:", localFilePath);
    if (!localFilePath) {
      return null;
    }

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been successfully uploaded, we can remove it from the local disk
    // console.log(`File is uploaded on cloudinary : ${response.url}`);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // If an error occurs, we can remove the file from the local disk
    fs.unlinkSync(localFilePath);
    console.error("Error uploading file to Cloudinary:", error);
    throw error;
  }
};

export { uploadToCloudinary };
