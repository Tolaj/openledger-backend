import Customer from "../models/customer.model.js";

export const getAllCustomers = (groupId) =>
    Customer.find({ group: groupId }).sort({ name: 1 });

export const getCustomerById = async (id, groupId) => {
    const c = await Customer.findOne({ _id: id, group: groupId });
    if (!c) throw Object.assign(new Error("Customer not found"), { status: 404 });
    return c;
};

export const createCustomer = (body) => new Customer(body).save();

export const updateCustomer = async (id, groupId, body) => {
    const c = await Customer.findOneAndUpdate({ _id: id, group: groupId }, body, { new: true });
    if (!c) throw Object.assign(new Error("Customer not found"), { status: 404 });
    return c;
};

export const deleteCustomer = async (id, groupId) => {
    const c = await Customer.findOneAndDelete({ _id: id, group: groupId });
    if (!c) throw Object.assign(new Error("Customer not found"), { status: 404 });
};
