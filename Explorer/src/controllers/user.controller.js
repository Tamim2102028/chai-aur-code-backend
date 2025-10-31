import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

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

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new apiError(400, "Old password and new password are required");
  }
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError(401, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // Implementation for updating account details
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new apiError(400, "Full name and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localAvatarPath = req.file?.path;

  if (!localAvatarPath) {
    throw new apiError(400, "Avatar image is required");
  }

  const avatarUploadResult = await uploadToCloudinary(localAvatarPath);
  // todo - delete old image from cloudinary after successful upload new image

  if (!avatarUploadResult) {
    throw new apiError(500, "Failed to upload avatar image on Cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    {
      $set: {
        avatar: avatarUploadResult.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localCoverImagePath = req.file?.path;

  if (!localCoverImagePath) {
    throw new apiError(400, "Cover image is required");
  }

  const coverImageUploadResult = await uploadToCloudinary(localCoverImagePath);

  if (!coverImageUploadResult) {
    throw new apiError(500, "Failed to upload cover image on Cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    {
      $set: {
        coverImage: coverImageUploadResult.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
