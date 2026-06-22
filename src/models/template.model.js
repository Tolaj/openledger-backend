import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        emoji: { type: String, default: "📦" },
        description: { type: String },
        isSystem: { type: Boolean, default: false },
        type: { type: String, enum: ["personal", "business", "all"], default: "all" },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        categories: [
            {
                name: String,
                icon: String,
                color: String,
            },
        ],
        products: [
            {
                name: String,
                category: String,
                price: { type: String, default: "0" },
                unit: { type: String, default: "unit" },
                description: String,
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Template", templateSchema);
