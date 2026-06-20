import mongoose from "mongoose";

const recipientSchema = new mongoose.Schema(
    {
        name:      { type: String, required: true, trim: true },
        email:     { type: String, trim: true },
        phone:     { type: String, trim: true },
        type:      { type: String, enum: ["payee", "payer", "both"], default: "both" },
        notes:     { type: String },
        group:     { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("Recipient", recipientSchema);
