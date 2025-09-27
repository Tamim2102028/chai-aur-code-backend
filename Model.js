import mongoose from "mongoose";

// Define a schema
const schemaName = new mongoose.Schema(
  {
    fieldName1: {
      type: DataType, // e.g., String, Number, Boolean, Date, etc.
      type: mongoose.Schema.Types.ObjectId, // For referencing another document
      ref: "ReferencedModel", // For referencing another model
      required: true, // Makes the field mandatory
      unique: true, // Ensures the field value is unique
      lowercase: true, // Converts the value to lowercase
      default: "defaultValue", // Sets a default value
      enum: ["Value1", "Value2", "Value3"], // Restricts the value to a set of predefined values
      validate: {
        validator: function (v) {
          // Custom validation logic
          return v && v.length > 0; // Example: Ensure the array is not empty
        },
      },
    },
    fieldName2: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AnotherModel",
      },
    ],
    // Add more fields as needed
  },
  { timestamps: true }
); // Adds createdAt and updatedAt timestamps

// Create a model
const ModelName = mongoose.model("ModelName", schemaName);

module.exports = ModelName;
