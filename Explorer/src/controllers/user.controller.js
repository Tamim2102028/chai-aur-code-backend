import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // 1. get user data from req.body
  const { fullName, userName, email, password } = req.body;
  console.log(`email : ${email}`);

  // 2. validate user data - check for empty
  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  // 3. check if user already exists in DB: email and username
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { userName: userName.toLowerCase() }],
  });
  if (existingUser) {
    throw new apiError(409, "User with email or username alredy exist");
  }

  // 4. check for image , check for avatar
  const avatarLocalPath = req.files?.avatar?.[0].path;
  const coverImageLocalPath = req.files?.coverImage?.[0].path;
  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar image is required");
  }

  // 5. upload to cloudinary if image present - avatar check must
  const avatarUploadResult = await uploadToCloudinary(avatarLocalPath);
  const coverImageUploadResult = coverImageLocalPath
    ? await uploadToCloudinary(coverImageLocalPath)
    : null;

  if (!avatarUploadResult) {
    throw new apiError(500, "Failed to upload avatar image");
  }

  // 6. create user object - create entry in DB
  const user = await User.create({
    fullName,
    avatar: avatarUploadResult.url,
    coverImage: coverImageUploadResult?.url || "",
    userName: userName.toLowerCase(),
    email,
    password,
  });

  // 7. remove password & refreshToken from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 8. check if user created successfully
  if (!createdUser) {
    throw new apiError(500, "Failed to create user");
  }

  // 9. send response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered"));
});

export { registerUser };
