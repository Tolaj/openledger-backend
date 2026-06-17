import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        items: [
            {
                groceryItemId: { type: mongoose.Schema.Types.ObjectId },
                unit: { type: Number },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
