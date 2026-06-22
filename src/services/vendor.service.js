import Vendor from "../models/vendor.model.js";

export const getAllVendors = (groupId) =>
    Vendor.find({ group: groupId }).sort({ name: 1 });

export const getVendorById = async (id, groupId) => {
    const v = await Vendor.findOne({ _id: id, group: groupId });
    if (!v) throw Object.assign(new Error("Vendor not found"), { status: 404 });
    return v;
};

export const createVendor = (body) => new Vendor(body).save();

export const updateVendor = async (id, groupId, body) => {
    const v = await Vendor.findOneAndUpdate({ _id: id, group: groupId }, body, { new: true });
    if (!v) throw Object.assign(new Error("Vendor not found"), { status: 404 });
    return v;
};

export const deleteVendor = async (id, groupId) => {
    const v = await Vendor.findOneAndDelete({ _id: id, group: groupId });
    if (!v) throw Object.assign(new Error("Vendor not found"), { status: 404 });
};
