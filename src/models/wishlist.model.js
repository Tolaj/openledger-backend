import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        unit: { type: String, required: true },
        price: { type: String, required: true },
        count: { type: String, required: true },
        taxRate: { type: Number, default: 0 },
        splitType: { type: String, enum: ["equal", "percentage", "custom"] },
        splitAmong: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { _id: false }
);

const wishlistSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        date: { type: String, required: true },
        totalPrice: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        items: [wishlistItemSchema],
    },
    { timestamps: true }
);

export default mongoose.model("Wishlist", wishlistSchema);
