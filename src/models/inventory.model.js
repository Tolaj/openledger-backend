import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        unit: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
        splitAmong: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        quantityAvailable: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model("Inventory", inventorySchema);
