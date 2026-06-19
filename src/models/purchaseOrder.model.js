import mongoose from "mongoose";

const poItemSchema = new mongoose.Schema(
    {
        product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        description: { type: String },          // free-text if no product linked
        qty:         { type: Number, required: true, min: 0 },
        unit:        { type: String },
        unitPrice:   { type: Number, required: true, min: 0 },
        taxRate:     { type: Number, default: 0 }, // percentage e.g. 18 for 18% GST
        amount:      { type: Number, required: true }, // qty * unitPrice
    },
    { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
    {
        poNumber:      { type: String, required: true },
        vendor:        { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
        group:         { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        status:        {
            type: String,
            enum: ["draft", "sent", "partial", "received", "cancelled"],
            default: "draft",
        },
        items:         [poItemSchema],
        subtotal:      { type: Number, default: 0 },
        taxAmount:     { type: Number, default: 0 },
        grandTotal:    { type: Number, default: 0 },
        expectedDate:  { type: Date },
        notes:         { type: String },
        createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
