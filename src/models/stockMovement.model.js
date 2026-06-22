import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
    {
        group:       { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        change:      { type: Number, required: true },          // +ve = in, -ve = out
        qtyAfter:    { type: Number, required: true },          // snapshot after the change
        sourceType:  { type: String, enum: ["grn", "delivery", "adjustment", "go"], required: true },
        sourceRef:   { type: String },                          // e.g. "GRN-0012", "DEL-0003"
        sourceId:    { type: mongoose.Schema.Types.ObjectId },  // optional FK to the source doc
        reason:      { type: String },                          // for adjustments: damage / write-off / recount / other
        notes:       { type: String },
        createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export default mongoose.model("StockMovement", stockMovementSchema);
