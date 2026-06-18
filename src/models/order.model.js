import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.Mixed },
        unit: { type: String, required: true },
        price: { type: String, required: true },
        count: { type: String, required: true },
        splitType: { type: String, enum: ["equal", "percentage", "custom"], default: "equal" },
        splitAmong: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        date: { type: String, required: true },
        totalPrice: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        items: [orderItemSchema],
        financeEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "Finance" },
    },
    { timestamps: true }
);

orderSchema.pre("save", async function () {
    const Product = mongoose.model("Product");
    for (const item of this.items) {
        const val = item.product;
        if (val && typeof val === "string" && mongoose.isValidObjectId(val)) {
            const doc = await Product.findById(val).lean();
            if (doc) item.product = doc;
        } else if (val && val._bsontype === "ObjectId") {
            const doc = await Product.findById(val).lean();
            if (doc) item.product = doc;
        }
    }
});

export default mongoose.model("Order", orderSchema);
