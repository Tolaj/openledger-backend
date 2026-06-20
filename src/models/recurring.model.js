import mongoose from "mongoose";

const recurringItemSchema = new mongoose.Schema(
    {
        product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        description: { type: String },
        qty:         { type: Number, default: 1 },
        unit:        { type: String },
        unitPrice:   { type: Number, default: 0 },
        taxRate:     { type: Number, default: 0 },
        amount:      { type: Number, default: 0 },
    },
    { _id: false }
);

const recurringSchema = new mongoose.Schema(
    {
        name:        { type: String, required: true, trim: true },
        recipient:   { type: mongoose.Schema.Types.ObjectId, ref: "Recipient" },
        group:       { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        direction:   { type: String, enum: ["payable", "receivable"], default: "payable" },
        frequency:   { type: String, enum: ["daily", "weekly", "monthly", "quarterly", "yearly"], required: true },
        nextRunDate: { type: Date, required: true },
        lastRunDate: { type: Date },
        autoCreate:  { type: Boolean, default: false },
        status:      { type: String, enum: ["active", "paused", "cancelled"], default: "active" },
        items:       [recurringItemSchema],
        grandTotal:  { type: Number, default: 0 },
        notes:       { type: String },
        createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("Recurring", recurringSchema);
