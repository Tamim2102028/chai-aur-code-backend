import { model, Schema } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // User who is subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, // User who is being subscribed to
      ref: "User",
    },
  },
  { timestamps: true }
);

const Subscription = model("Subscription", SubscriptionSchema);
export default Subscription;
