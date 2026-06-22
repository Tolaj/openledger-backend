import mongoose from "mongoose";

const budgetCategorySchema = new mongoose.Schema(
    {
        categoryRef:     { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        name:            { type: String, required: true },
        allocatedAmount: { type: Number, required: true },
        spentAmount:     { type: Number, default: 0 },
    },
    { _id: false }
);

const budgetSchema = new mongoose.Schema(
    {
        name:      { type: String, required: true },
        group:     { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
        user:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        totalAmount:  { type: Number, required: true },
        amountSpent:  { type: Number, default: 0 },
        categories:   [budgetCategorySchema],
        startDate:    { type: Date, required: true },
        endDate:      { type: Date, required: true },
        notes:        { type: String },
    },
    { timestamps: true }
);

// Virtual: amountRemaining
budgetSchema.virtual("amountRemaining").get(function () {
    return this.totalAmount - this.amountSpent;
});

budgetSchema.set("toJSON", { virtuals: true });
budgetSchema.set("toObject", { virtuals: true });

export default mongoose.model("Budget", budgetSchema);
