import mongoose from "mongoose";

const soItemSchema = new mongoose.Schema(
    {
        product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        description: { type: String },
        qty:         { type: Number, required: true, min: 0 },
        unit:        { type: String },
        unitPrice:   { type: Number, required: true, min: 0 },
        taxRate:     { type: Number, default: 0 },
        amount:      { type: Number, required: true },
    },
    { _id: false }
);

const salesOrderSchema = new mongoose.Schema(
    {
        soNumber:      { type: String, required: true },
        customer:      { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
        group:         { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        status:        {
            type: String,
            enum: ["draft", "confirmed", "partial", "delivered", "cancelled"],
            default: "draft",
        },
        items:         [soItemSchema],
        subtotal:      { type: Number, default: 0 },
        taxAmount:     { type: Number, default: 0 },
        grandTotal:    { type: Number, default: 0 },
        deliveryDate:  { type: Date },
        notes:         { type: String },
        createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("SalesOrder", salesOrderSchema);
