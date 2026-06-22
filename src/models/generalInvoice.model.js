import mongoose from "mongoose";

const giItemSchema = new mongoose.Schema(
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

const generalInvoiceSchema = new mongoose.Schema(
    {
        invoiceNumber:  { type: String, required: true },
        generalOrder:   { type: mongoose.Schema.Types.ObjectId, ref: "GeneralOrder" },
        recipient:      { type: mongoose.Schema.Types.ObjectId, ref: "Recipient", required: true },
        group:          { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        // Determines Finance entry type on paid: income or expense
        direction:      { type: String, enum: ["income", "expense"], default: "expense" },
        status:         { type: String, enum: ["draft", "sent", "paid", "overdue", "cancelled"], default: "draft" },
        items:          [giItemSchema],
        subtotal:       { type: Number, default: 0 },
        taxAmount:      { type: Number, default: 0 },
        grandTotal:     { type: Number, default: 0 },
        invoiceDate:    { type: Date },
        dueDate:        { type: Date },
        notes:          { type: String },
        createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        financeEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "Finance" },
    },
    { timestamps: true }
);

export default mongoose.model("GeneralInvoice", generalInvoiceSchema);
