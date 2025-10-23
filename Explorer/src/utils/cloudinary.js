import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePath) => {
  try {
    
  } catch (error) {}
};

cloudinary.v2.uploader.upload(
  "path/to/image.jpg",
  { public_id: "sample_id" },
  (error, result) => {
    console.log(result);
  }
);
