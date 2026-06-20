import mongoose from "mongoose";

const goItemSchema = new mongoose.Schema(
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

const generalOrderSchema = new mongoose.Schema(
    {
        goNumber:   { type: String, required: true },
        recipient:  { type: mongoose.Schema.Types.ObjectId, ref: "Recipient", required: true },
        group:      { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        // "payable" = we owe (expense direction), "receivable" = owed to us (income direction)
        direction:  { type: String, enum: ["payable", "receivable"], default: "payable" },
        status:     { type: String, enum: ["draft", "sent", "confirmed", "partial", "received", "delivered", "cancelled"], default: "draft" },
        items:      [goItemSchema],
        subtotal:   { type: Number, default: 0 },
        taxAmount:  { type: Number, default: 0 },
        grandTotal: { type: Number, default: 0 },
        orderDate:  { type: Date },
        notes:      { type: String },
        createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("GeneralOrder", generalOrderSchema);
