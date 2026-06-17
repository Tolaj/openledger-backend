import mongoose from "mongoose";

const resourcePlanSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        type: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        calories: { type: Number },
        protein: { type: Number },
        contents: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
                quantityUsed: { type: Number },
            },
        ],
        duration: { type: Number, required: true },
    },
    { timestamps: true }
);

export default mongoose.model("ResourcePlan", resourcePlanSchema);
