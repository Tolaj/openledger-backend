import mongoose from "mongoose";

/**
 * An audit record of what happened on each recurring run / notification action,
 * so users can see how well they're following the recurrings they set up.
 */
const recurringLogSchema = new mongoose.Schema(
    {
        group:         { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        recurring:     { type: mongoose.Schema.Types.ObjectId, ref: "Recurring" },
        recurringName: { type: String },
        user:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        action: {
            type: String,
            enum: ["auto", "notified", "asked", "confirmed", "snoozed", "skipped", "expired"],
            required: true,
        },
        summary:       { type: String },   // e.g. "Rice: -2 kg"
        scheduledFor:  { type: Date },     // the occurrence this action relates to
    },
    { timestamps: true }
);

export default mongoose.model("RecurringLog", recurringLogSchema);
