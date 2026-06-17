import Order from "../models/order.model.js";
import Group from "../models/group.model.js";

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
    return order;
};

export const updateOrder = async (id, body) => {
    const order = await Order.findByIdAndUpdate(id, body, { new: true });
    if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
    return order;
};

export const deleteOrder = async (id) => {
    const order = await Order.findByIdAndDelete(id);
    if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
};
