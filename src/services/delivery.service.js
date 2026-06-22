import Delivery from "../models/delivery.model.js";
import SalesOrder from "../models/salesOrder.model.js";
import Inventory from "../models/inventory.model.js";
import Product from "../models/product.model.js";
import StockMovement from "../models/stockMovement.model.js";
import Counter from "../models/counter.model.js";
import { writeMovement } from "./stockMovement.service.js";

const nextDeliveryNumber = async (groupId) => {
    const counter = await Counter.findOneAndUpdate(
        { key: `delivery_${groupId}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `DEL-${String(counter.seq).padStart(4, "0")}`;
};

// Verify sufficient stock for all tracked products before committing delivery
const checkStockAvailability = async (items) => {
    const shortages = [];
    for (const item of items) {
        if (!item.product || item.qtyDelivered <= 0) continue;
        const inv = await Inventory.findOne({ product: item.product }).populate("product", "name");
        const available = inv?.quantityAvailable ?? 0;
        if (item.qtyDelivered > available) {
            shortages.push({
                name: inv?.product?.name || item.description || "Item",
                requested: item.qtyDelivered,
                available,
                unit: item.unit || "",
            });
        }
    }
    if (shortages.length > 0) {
        const detail = shortages
            .map((s) => `"${s.name}": need ${s.requested}${s.unit ? " " + s.unit : ""}, only ${s.available} in stock`)
            .join("; ");
        throw Object.assign(new Error(`Insufficient stock — ${detail}`), { status: 422 });
    }
};

// Bump stock DOWN for catalog products that were delivered (only if inventory tracking is enabled)
const updateStockOut = async (items) => {
    for (const item of items) {
        if (!item.product || item.qtyDelivered <= 0) continue;
        const prod = await Product.findById(item.product).select("inventory");
        if (!prod?.inventory) continue;
        const existing = await Inventory.findOne({ product: item.product });
        if (existing) {
            existing.quantityAvailable = Math.max(0, existing.quantityAvailable - item.qtyDelivered);
            existing.lastUpdated = new Date();
            await existing.save();
        }
    }
};

export const getAllDeliveries = (groupId) =>
    Delivery.find({ group: groupId })
        .populate({ path: "salesOrder", select: "soNumber customer", populate: { path: "customer", select: "name" } })
        .populate("items.product", "name unit")
        .sort({ createdAt: -1 });

export const getDeliveryById = async (id, groupId) => {
    const delivery = await Delivery.findOne({ _id: id, group: groupId })
        .populate({ path: "salesOrder", populate: { path: "customer", select: "name" } })
        .populate("items.product");
    if (!delivery) throw Object.assign(new Error("Delivery not found"), { status: 404 });
    return delivery;
};

export const createDelivery = async (body) => {
    const { group, salesOrder: soId, items, deliveredDate, notes, createdBy } = body;

    const so = await SalesOrder.findOne({ _id: soId, group });
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });

    // Sum qty already delivered across all prior deliveries for this SO
    const priorDeliveries = await Delivery.find({ salesOrder: soId, group });
    const alreadyDelivered = {};
    for (const d of priorDeliveries) {
        for (const it of d.items) {
            const key = String(it.product || it.description);
            alreadyDelivered[key] = (alreadyDelivered[key] || 0) + it.qtyDelivered;
        }
    }

    const deliveryNumber = await nextDeliveryNumber(group);

    // Determine if SO is now fully delivered (cumulative across all deliveries including this one)
    const allFull = so.items.every((soItem) => {
        const key = String(soItem.product);
        const previouslyDelivered = alreadyDelivered[key] || 0;
        const thisDelivery = items.find((it) => String(it.product) === key)?.qtyDelivered || 0;
        return previouslyDelivered + thisDelivery >= soItem.qty;
    });

    const delivery = await new Delivery({
        deliveryNumber, salesOrder: soId, group,
        status: allFull ? "complete" : "partial",
        items: items.map((it) => ({
            ...(it.product ? { product: it.product } : {}),
            description: it.description,
            qtyOrdered: it.qtyOrdered,
            qtyDelivered: it.qtyDelivered,
            unit: it.unit,
            unitPrice: it.unitPrice,
        })),
        deliveredDate: deliveredDate || new Date(),
        notes,
        createdBy,
    }).save();

    // Check stock before committing anything
    await checkStockAvailability(items);

    // Update SO status
    await SalesOrder.findByIdAndUpdate(soId, {
        status: allFull ? "delivered" : "partial",
    });

    // If this delivery is complete, mark all other partial deliveries for this SO as complete too
    if (allFull) {
        await Delivery.updateMany(
            { salesOrder: soId, group, _id: { $ne: delivery._id }, status: "partial" },
            { $set: { status: "complete" } }
        );
    }

    // Stock OUT + movement records
    await updateStockOut(items);
    for (const item of items) {
        if (!item.product || item.qtyDelivered <= 0) continue;
        await writeMovement({
            group,
            product: item.product,
            change: -item.qtyDelivered,
            sourceType: "delivery",
            sourceRef: deliveryNumber,
            sourceId: delivery._id,
            createdBy,
        });
    }

    return Delivery.findById(delivery._id)
        .populate({ path: "salesOrder", select: "soNumber customer", populate: { path: "customer", select: "name" } })
        .populate("items.product", "name unit");
};

export const updateDelivery = async (id, groupId, data) => {
    const delivery = await Delivery.findOne({ _id: id, group: groupId });
    if (!delivery) throw Object.assign(new Error("Delivery not found"), { status: 404 });

    await Delivery.findByIdAndUpdate(id, data);

    // When a delivery is marked complete, mark all sibling deliveries complete too
    // and update the SO status to delivered
    if (data.status === "complete" && delivery.salesOrder) {
        await Delivery.updateMany(
            { salesOrder: delivery.salesOrder, group: groupId, _id: { $ne: id } },
            { $set: { status: "complete" } }
        );
        await SalesOrder.findByIdAndUpdate(delivery.salesOrder, { status: "delivered" });
    }

    return Delivery.findById(id)
        .populate({ path: "salesOrder", select: "soNumber customer", populate: { path: "customer", select: "name" } })
        .populate("items.product", "name unit");
};

export const deleteDelivery = async (id, groupId) => {
    const delivery = await Delivery.findOneAndDelete({ _id: id, group: groupId });
    if (!delivery) throw Object.assign(new Error("Delivery not found"), { status: 404 });

    // Reverse stock: add back quantities that were shipped out (only if inventory tracking enabled)
    for (const item of delivery.items) {
        if (!item.product || item.qtyDelivered <= 0) continue;
        const prod = await Product.findById(item.product).select("inventory");
        if (!prod?.inventory) continue;
        const inv = await Inventory.findOne({ product: item.product });
        if (inv) {
            inv.quantityAvailable += item.qtyDelivered;
            inv.lastUpdated = new Date();
            await inv.save();
        }
    }

    // Delete associated stock movements
    await StockMovement.deleteMany({ sourceType: "delivery", sourceId: delivery._id });

    // Revert SO status based on remaining deliveries
    if (delivery.salesOrder) {
        const remainingDeliveries = await Delivery.find({ salesOrder: delivery.salesOrder, group: groupId });
        const newStatus = remainingDeliveries.length === 0 ? "confirmed" : "partial";
        await SalesOrder.findByIdAndUpdate(delivery.salesOrder, { status: newStatus });
    }
};
