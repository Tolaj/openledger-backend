import GeneralOrder from "../models/generalOrder.model.js";
import Counter from "../models/counter.model.js";

const nextGoNumber = async (groupId) => {
    const counter = await Counter.findOneAndUpdate(
        { key: `go_${groupId}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `GO-${String(counter.seq).padStart(4, "0")}`;
};

const populate = (query) =>
    query
        .populate({ path: "recipient", select: "name email phone type" })
        .populate({ path: "items.product", select: "name unit", populate: { path: "category", select: "name icon" } });

const calcTotals = (items = []) => {
    const subtotal  = items.reduce((s, i) => s + (i.amount || 0), 0);
    const taxAmount = items.reduce((s, i) => s + ((i.amount || 0) * (i.taxRate || 0)) / 100, 0);
    return { subtotal, taxAmount, grandTotal: subtotal + taxAmount };
};

export const getAllGeneralOrders = (groupId) =>
    populate(GeneralOrder.find({ group: groupId }).sort({ createdAt: -1 }));

export const getGeneralOrderById = async (id, groupId) => {
    const o = await populate(GeneralOrder.findOne({ _id: id, group: groupId }));
    if (!o) throw Object.assign(new Error("General order not found"), { status: 404 });
    return o;
};

export const createGeneralOrder = async (body) => {
    const { group, items = [] } = body;
    const goNumber = await nextGoNumber(group);
    const totals   = calcTotals(items);
    const order = await new GeneralOrder({ ...body, goNumber, ...totals }).save();
    return populate(GeneralOrder.findById(order._id));
};

export const updateGeneralOrder = async (id, groupId, data) => {
    if (data.items) {
        const totals = calcTotals(data.items);
        Object.assign(data, totals);
    }
    const order = await GeneralOrder.findOneAndUpdate({ _id: id, group: groupId }, data, { new: true });
    if (!order) throw Object.assign(new Error("General order not found"), { status: 404 });
    return populate(GeneralOrder.findById(order._id));
};

export const deleteGeneralOrder = async (id, groupId) => {
    const order = await GeneralOrder.findOneAndDelete({ _id: id, group: groupId });
    if (!order) throw Object.assign(new Error("General order not found"), { status: 404 });
};
