import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
        price: { type: String, required: true },
        unit: { type: String, required: true },
        description: { type: String },
        manufacturer: { type: String },
        inventory: { type: Boolean, default: false },
        fileUrl: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model("Product", productSchema);
