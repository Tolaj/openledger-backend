import StockMovement from "../models/stockMovement.model.js";
import Inventory from "../models/inventory.model.js";

/**
 * Write a stock movement record.
 * Used internally by GRN, Delivery, and Adjustment services.
 */
export const writeMovement = async ({ group, product, change, sourceType, sourceRef, sourceId, reason, notes, createdBy }) => {
    const inv = await Inventory.findOne({ product });
    const qtyAfter = (inv?.quantityAvailable ?? 0);
    return StockMovement.create({ group, product, change, qtyAfter, sourceType, sourceRef, sourceId, reason, notes, createdBy });
};

export const getAllMovements = (groupId) =>
    StockMovement.find({ group: groupId })
        .populate("product", "name unit")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

export const createAdjustment = async ({ group, product, change, reason, notes, createdBy }) => {
    // Update inventory
    const inv = await Inventory.findOne({ product });
    if (!inv) throw Object.assign(new Error("No inventory entry for this product"), { status: 404 });
    inv.quantityAvailable = Math.max(0, inv.quantityAvailable + change);
    inv.lastUpdated = new Date();
    await inv.save();

    // Write movement
    return writeMovement({
        group, product, change,
        sourceType: "adjustment",
        sourceRef: "Manual",
        reason, notes, createdBy,
    });
};
