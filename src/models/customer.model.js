import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        name:          { type: String, required: true, trim: true },
        contactPerson: { type: String, trim: true },
        phone:         { type: String, trim: true },
        email:         { type: String, trim: true },
        address:       { type: String, trim: true },
        gstin:         { type: String, trim: true },
        currency:      { type: String, default: "INR" },
        notes:         { type: String },
        group:         { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
