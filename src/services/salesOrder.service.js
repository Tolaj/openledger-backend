import SalesOrder from "../models/salesOrder.model.js";
import Counter from "../models/counter.model.js";

const calcTotals = (items) => {
    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxAmount = items.reduce((s, i) => s + ((i.amount || 0) * (i.taxRate || 0) / 100), 0);
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
};

const nextSoNumber = async (groupId) => {
    const key = `so_${groupId}`;
    const counter = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `SO-${String(counter.seq).padStart(4, "0")}`;
};

export const getAllSalesOrders = (groupId) =>
    SalesOrder.find({ group: groupId })
        .populate("customer", "name")
        .populate("items.product", "name")
        .sort({ createdAt: -1 });

export const getSalesOrderById = async (id, groupId) => {
    const so = await SalesOrder.findOne({ _id: id, group: groupId })
        .populate("customer")
        .populate("items.product");
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });
    return so;
};

export const createSalesOrder = async (body) => {
    const soNumber = await nextSoNumber(body.group);
    const totals = calcTotals(body.items || []);
    return new SalesOrder({ ...body, soNumber, ...totals }).save();
};

export const updateSalesOrder = async (id, groupId, body) => {
    const totals = body.items ? calcTotals(body.items) : {};
    const so = await SalesOrder.findOneAndUpdate(
        { _id: id, group: groupId },
        { ...body, ...totals },
        { new: true }
    ).populate("customer", "name").populate("items.product", "name");
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });
    return so;
};

export const deleteSalesOrder = async (id, groupId) => {
    const so = await SalesOrder.findOneAndDelete({ _id: id, group: groupId });
    if (!so) throw Object.assign(new Error("Sales order not found"), { status: 404 });
};
