import User from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // 1. Token নেওয়া
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Access token is missing");
    }

    // 2. Token verify করা
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. Database থেকে user খুঁজে বের করা
    const user = await User.findById(decoded.userId).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 4. ✅ এইখানে req.user তে user attach করা হয়
    req.user = user; // attach user to request object

    // 5. পরবর্তী middleware/controller এ পাঠানো
    next();
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid or expired token");
  }
});

export { verifyJWT };
