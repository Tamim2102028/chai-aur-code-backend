import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new apiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Token generation failed");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // 1. get user data from req.body
  const { fullName, userName, email, password } = req.body;

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
  // const coverImageLocalPath = req.files?.coverImage?.[0].path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar image is required");
  }

  // 5. upload to cloudinary if image present - avatar check must
  const avatarUploadResult = await uploadToCloudinary(avatarLocalPath);
  console.log("avatarUploadResult:", avatarUploadResult);
  const coverImageUploadResult = coverImageLocalPath
    ? await uploadToCloudinary(coverImageLocalPath)
    : null;
  console.log("coverImageUploadResult:", coverImageUploadResult);

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

const loginUser = asyncHandler(async (req, res) => {
  // 1. req.body -> data - userName or email + password
  const { email, userName, password } = req.body;
  if (!(userName || email)) {
    throw new apiError(400, "Username or email is required");
  }

  // 2. find user in DB
  const user = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { userName: userName.toLowerCase() }],
  });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  // 3. password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new apiError(401, "Invalid password");
  }

  // 4. access token + refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // optional: get safe user data
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 5. send cookies and response
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // clear refresh token from DB
  req.user._id;
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // clear cookies and send response
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request - Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken.userId);

    if (!user) {
      throw new apiError(401, "Invalid refresh token - User not found");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Invalid refresh token - Token mismatch");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new apiError(401, "Internal Server Error");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
