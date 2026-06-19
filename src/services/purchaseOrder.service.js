import PurchaseOrder from "../models/purchaseOrder.model.js";
import Counter from "../models/counter.model.js";

const calcTotals = (items) => {
    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxAmount = items.reduce((s, i) => s + ((i.amount || 0) * (i.taxRate || 0) / 100), 0);
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
};

const nextPoNumber = async (groupId) => {
    const key = `po_${groupId}`;
    const counter = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `PO-${String(counter.seq).padStart(4, "0")}`;
};

export const getAllPurchaseOrders = (groupId) =>
    PurchaseOrder.find({ group: groupId })
        .populate("vendor", "name")
        .populate("items.product", "name")
        .sort({ createdAt: -1 });

export const getPurchaseOrderById = async (id, groupId) => {
    const po = await PurchaseOrder.findOne({ _id: id, group: groupId })
        .populate("vendor")
        .populate("items.product");
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });
    return po;
};

export const createPurchaseOrder = async (body) => {
    const poNumber = await nextPoNumber(body.group);
    const totals = calcTotals(body.items || []);
    return new PurchaseOrder({ ...body, poNumber, ...totals }).save();
};

export const updatePurchaseOrder = async (id, groupId, body) => {
    const totals = body.items ? calcTotals(body.items) : {};
    const po = await PurchaseOrder.findOneAndUpdate(
        { _id: id, group: groupId },
        { ...body, ...totals },
        { new: true }
    ).populate("vendor", "name").populate("items.product", "name");
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });
    return po;
};

export const deletePurchaseOrder = async (id, groupId) => {
    const po = await PurchaseOrder.findOneAndDelete({ _id: id, group: groupId });
    if (!po) throw Object.assign(new Error("Purchase order not found"), { status: 404 });
};
