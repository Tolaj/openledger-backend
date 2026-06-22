import mongoose from "mongoose";

const deliveryItemSchema = new mongoose.Schema(
    {
        product:      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        description:  { type: String },
        qtyOrdered:   { type: Number, default: 0 },
        qtyDelivered: { type: Number, required: true, min: 0 },
        unit:         { type: String },
        unitPrice:    { type: Number, default: 0 },
    },
    { _id: false }
);

const deliverySchema = new mongoose.Schema(
    {
        deliveryNumber: { type: String, required: true },
        salesOrder:     { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder", required: true },
        group:          { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        status:         { type: String, enum: ["complete", "partial"], default: "complete" },
        items:          [deliveryItemSchema],
        deliveredDate:  { type: Date, default: Date.now },
        notes:          { type: String },
        createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("Delivery", deliverySchema);
