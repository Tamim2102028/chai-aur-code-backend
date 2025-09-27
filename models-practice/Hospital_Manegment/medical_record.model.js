const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({}, { timestamps: true });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
