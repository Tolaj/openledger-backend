import GRN from "../models/grn.model.js";
import PurchaseOrder from "../models/purchaseOrder.model.js";
import Inventory from "../models/inventory.model.js";
import StockMovement from "../models/stockMovement.model.js";
import Group from "../models/group.model.js";
import Counter from "../models/counter.model.js";
import { writeMovement } from "./stockMovement.service.js";

const nextGrnNumber = async (groupId) => {
    const counter = await Counter.findOneAndUpdate(
        { key: `grn_${groupId}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `GRN-${String(counter.seq).padStart(4, "0")}`;
};

// Bump stock UP for catalog products that were received
const updateStockIn = async (items, groupId) => {
    for (const item of items) {
        if (!item.product || item.qtyReceived <= 0) continue;
        const existing = await Inventory.findOne({ product: item.product });
        if (existing) {
            existing.quantityAvailable += item.qtyReceived;
            existing.lastUpdated = new Date();
            await existing.save();
        } else {
            const created = await new Inventory({
                product: item.product,
                quantityAvailable: item.qtyReceived,
                price: item.unitPrice || 0,
                splitAmong: [],
                lastUpdated: new Date(),
            }).save();
            await Group.updateOne({ _id: groupId }, { $addToSet: { inventories: created._id } });
        }
    }
};

export const getAllGRNs = (groupId) =>
    GRN.find({ group: groupId })
        .populate({ path: "purchaseOrder", select: "poNumber vendor", populate: { path: "vendor", select: "name" } })
        .populate("items.product", "name unit")
        .sort({ createdAt: -1 });

export const getGRNById = async (id, groupId) => {
    const grn = await GRN.findOne({ _id: id, group: groupId })
        .populate({ path: "purchaseOrder", populate: { path: "vendor", select: "name" } })
        .populate("items.product");
    if (!grn) throw Object.assign(new Error("GRN not found"), { status: 404 });
    return grn;
};

export const createGRN = async (body) => {
    const { group, purchaseOrder: poId, items, receivedDate, notes, createdBy } = body;

    const po = await PurchaseOrder.findOne({ _id: poId, group });
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });

    // Sum qty already received across all prior GRNs for this PO
    const priorGRNs = await GRN.find({ purchaseOrder: poId, group });
    const alreadyReceived = {}; // productId => totalQtyReceived so far
    for (const g of priorGRNs) {
        for (const it of g.items) {
            const key = String(it.product || it.description);
            alreadyReceived[key] = (alreadyReceived[key] || 0) + it.qtyReceived;
        }
    }

    const grnNumber = await nextGrnNumber(group);

    // Determine if PO is now fully received (cumulative across all GRNs including this one)
    const allFull = po.items.every((poItem) => {
        const key = String(poItem.product);
        const previouslyReceived = alreadyReceived[key] || 0;
        const thisReceipt = items.find((it) => String(it.product) === key)?.qtyReceived || 0;
        return previouslyReceived + thisReceipt >= poItem.qty;
    });

    const grn = await new GRN({
        grnNumber, purchaseOrder: poId, group,
        status: allFull ? "complete" : "partial",
        items: items.map((it) => ({
            ...(it.product ? { product: it.product } : {}),
            description: it.description,
            qtyOrdered: it.qtyOrdered,
            qtyReceived: it.qtyReceived,
            unit: it.unit,
            unitPrice: it.unitPrice,
        })),
        receivedDate: receivedDate || new Date(),
        notes,
        createdBy,
    }).save();

    // Update PO status
    await PurchaseOrder.findByIdAndUpdate(poId, {
        status: allFull ? "received" : "partial",
    });

    // Stock IN + movement records
    await updateStockIn(items, group);
    for (const item of items) {
        if (!item.product || item.qtyReceived <= 0) continue;
        await writeMovement({
            group,
            product: item.product,
            change: item.qtyReceived,
            sourceType: "grn",
            sourceRef: grnNumber,
            sourceId: grn._id,
            createdBy,
        });
    }

    return GRN.findById(grn._id)
        .populate({ path: "purchaseOrder", select: "poNumber vendor", populate: { path: "vendor", select: "name" } })
        .populate("items.product", "name unit");
};

export const deleteGRN = async (id, groupId) => {
    const grn = await GRN.findOneAndDelete({ _id: id, group: groupId });
    if (!grn) throw Object.assign(new Error("GRN not found"), { status: 404 });

    // Reverse stock for each received item
    for (const item of grn.items) {
        if (!item.product || item.qtyReceived <= 0) continue;
        const inv = await Inventory.findOne({ product: item.product });
        if (inv) {
            inv.quantityAvailable = Math.max(0, inv.quantityAvailable - item.qtyReceived);
            inv.lastUpdated = new Date();
            await inv.save();
        }
    }

    // Delete associated stock movements
    await StockMovement.deleteMany({ sourceType: "grn", sourceId: grn._id });

    // Revert PO status: recompute based on remaining GRNs
    if (grn.purchaseOrder) {
        const remainingGRNs = await GRN.find({ purchaseOrder: grn.purchaseOrder, group: groupId });
        const newStatus = remainingGRNs.length === 0 ? "sent" : "partial";
        await PurchaseOrder.findByIdAndUpdate(grn.purchaseOrder, { status: newStatus });
    }
};
