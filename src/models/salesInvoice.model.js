import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
    {
        product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        description: { type: String },
        qty:         { type: Number, default: 0 },
        unit:        { type: String },
        unitPrice:   { type: Number, default: 0 },
        taxRate:     { type: Number, default: 0 },
        amount:      { type: Number, default: 0 },
    },
    { _id: false }
);

const salesInvoiceSchema = new mongoose.Schema(
    {
        invoiceNumber:  { type: String, required: true },
        salesOrder:     { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder" },
        delivery:       { type: mongoose.Schema.Types.ObjectId, ref: "Delivery" },
        customer:       { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
        group:          { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        status:         { type: String, enum: ["draft", "sent", "paid", "overdue", "cancelled"], default: "draft" },
        items:          [invoiceItemSchema],
        subtotal:       { type: Number, default: 0 },
        taxAmount:      { type: Number, default: 0 },
        grandTotal:     { type: Number, default: 0 },
        invoiceDate:    { type: Date, default: Date.now },
        dueDate:        { type: Date },
        notes:          { type: String },
        createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        financeEntryId: { type: mongoose.Schema.Types.ObjectId, ref: "Finance" },
    },
    { timestamps: true }
);

export default mongoose.model("SalesInvoice", salesInvoiceSchema);
