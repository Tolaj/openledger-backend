import Delivery from "../models/delivery.model.js";
import SalesOrder from "../models/salesOrder.model.js";
import Inventory from "../models/inventory.model.js";
import Counter from "../models/counter.model.js";

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

// Bump stock DOWN for catalog products that were delivered
const updateStockOut = async (items) => {
    for (const item of items) {
        if (!item.product || item.qtyDelivered <= 0) continue;
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

    const deliveryNumber = await nextDeliveryNumber(group);

    // Determine status: partial if any item delivered less than ordered
    const allFull = items.every((it) => {
        const ordered = so.items.find((s) => String(s.product) === String(it.product))?.qty ?? it.qtyOrdered;
        return it.qtyDelivered >= ordered;
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

    // Stock OUT
    await updateStockOut(items);

    return Delivery.findById(delivery._id)
        .populate({ path: "salesOrder", select: "soNumber customer", populate: { path: "customer", select: "name" } })
        .populate("items.product", "name unit");
};

export const deleteDelivery = async (id, groupId) => {
    const delivery = await Delivery.findOneAndDelete({ _id: id, group: groupId });
    if (!delivery) throw Object.assign(new Error("Delivery not found"), { status: 404 });
};
