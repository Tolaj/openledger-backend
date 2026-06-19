import mongoose from "mongoose";

const grnItemSchema = new mongoose.Schema(
    {
        product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        description: { type: String },
        qtyOrdered:  { type: Number, default: 0 },
        qtyReceived: { type: Number, required: true, min: 0 },
        unit:        { type: String },
        unitPrice:   { type: Number, default: 0 },
    },
    { _id: false }
);

const grnSchema = new mongoose.Schema(
    {
        grnNumber:     { type: String, required: true },
        purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true },
        group:         { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        status:        { type: String, enum: ["complete", "partial"], default: "complete" },
        items:         [grnItemSchema],
        receivedDate:  { type: Date, default: Date.now },
        notes:         { type: String },
        createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("GRN", grnSchema);
