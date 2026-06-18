import mongoose from "mongoose";

const debtTrackingSchema = new mongoose.Schema(
    {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        to:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        settled: { type: Boolean, default: false },
    },
    { _id: false }
);

const splitAmongSchema = new mongoose.Schema(
    {
        user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
    },
    { _id: false }
);

const financeSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ["income", "expense", "loan", "investment"],
        },
        amount:      { type: Number, required: true },
        description: { type: String },
        date:        { type: Date, default: Date.now },
        group:       { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
        user:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        category:    { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        paidBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        splitAmong:  [splitAmongSchema],
        debtTracking: [debtTrackingSchema],
    },
    { timestamps: true }
);

export default mongoose.model("Finance", financeSchema);
