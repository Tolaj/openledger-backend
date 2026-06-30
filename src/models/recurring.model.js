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
        // Anchor / start date — the cadence (frequency) is measured from this date
        nextRunDate: { type: Date, required: true },
        // Times of day to fire on a cadence day, "HH:mm" (24h). Empty = use nextRunDate's time.
        times:       [{ type: String }],
        lastRunDate: { type: Date },
        // Timestamp of the most recent fired occurrence — prevents duplicate runs
        lastRunAt:   { type: Date },
        autoCreate:  { type: Boolean, default: false },
        // Recurring stock usage: on each run, deduct item quantities from inventory
        deductStock: { type: Boolean, default: false },
        // Push behaviour for stock-deduction runs: silent / notify-only / ask-first
        notifyMode:  { type: String, enum: ["none", "notify", "confirm"], default: "none" },
        // Holds a run awaiting the user's "Yes" confirmation (notifyMode === "confirm")
        pendingRun:  {
            token:       { type: String },
            dueDate:     { type: Date },
            expiresAt:   { type: Date },
            snoozedUntil:{ type: Date },   // when set, re-send the confirm push at this time
        },
        status:      { type: String, enum: ["active", "paused", "cancelled"], default: "active" },
        items:       [recurringItemSchema],
        grandTotal:  { type: Number, default: 0 },
        notes:       { type: String },
        createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("Recurring", recurringSchema);
