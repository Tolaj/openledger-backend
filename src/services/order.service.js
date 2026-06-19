import Order from "../models/order.model.js";
import Group from "../models/group.model.js";
import Finance from "../models/finance.model.js";

const populate = [
    { path: "paidBy" },
    { path: "createdBy" },
    { path: "items.splitAmong" },
];

export const getAllOrders = async (groupId) => {
    if (groupId) {
        const group = await Group.findById(groupId).select("orders").lean();
        return Order.find({ _id: { $in: group?.orders || [] } }).populate(populate);
    }
    return Order.find().populate(populate);
};

export const getOrderById = async (id) => {
    const order = await Order.findById(id).populate(populate);
    if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
    return order;
};

export const createOrder = async (body) => {
    const order = await new Order(body).save();
    await Group.updateOne({ _id: body.groupId }, { $addToSet: { orders: order._id } });

    // Auto-create expense Finance entry for every order
    const financeEntry = await new Finance({
        type:        "expense",
        amount:      parseFloat(order.totalPrice) || 0,
        description: order.name,
        date:        order.date ? new Date(order.date) : new Date(),
        group:       body.groupId,
        user:        body.createdBy,
        paidBy:      body.paidBy,
    }).save();

    order.financeEntryId = financeEntry._id;
    await order.save();

    return order;
};

export const updateOrder = async (id, body) => {
    const existing = await Order.findById(id);
    if (!existing) throw Object.assign(new Error("Order not found"), { status: 404 });

    const order = await Order.findByIdAndUpdate(id, body, { new: true });

    // Sync Finance entry if total price or name changed
    if (existing.financeEntryId && (body.totalPrice !== undefined || body.name !== undefined)) {
        await Finance.findByIdAndUpdate(existing.financeEntryId, {
            ...(body.totalPrice !== undefined ? { amount: parseFloat(body.totalPrice) || 0 } : {}),
            ...(body.name       !== undefined ? { description: body.name } : {}),
            ...(body.date       !== undefined ? { date: new Date(body.date) } : {}),
        }).catch(() => {});
    }

    return order;
};

export const deleteOrder = async (id) => {
    const order = await Order.findByIdAndDelete(id);
    if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
    // Delete linked finance entry if it exists
    if (order.financeEntryId) {
        await Finance.findByIdAndDelete(order.financeEntryId).catch(() => {});
    }
};
