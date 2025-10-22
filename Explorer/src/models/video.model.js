import { Schema, model } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";
// pagination plugin for mongoose aggregate queries

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudnary url
      required: true,
    },
    thumbnail: {
      type: String, // cloudnary url
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // cloudnary url
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(aggregatePaginate);

export default model("Video", videoSchema);
