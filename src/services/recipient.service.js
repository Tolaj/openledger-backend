import Recipient from "../models/recipient.model.js";

export const getAllRecipients = (groupId) =>
    Recipient.find({ group: groupId }).sort({ name: 1 });

export const getRecipientById = async (id, groupId) => {
    const r = await Recipient.findOne({ _id: id, group: groupId });
    if (!r) throw Object.assign(new Error("Recipient not found"), { status: 404 });
    return r;
};

export const createRecipient = (body) => new Recipient(body).save();

export const updateRecipient = async (id, groupId, data) => {
    const r = await Recipient.findOneAndUpdate({ _id: id, group: groupId }, data, { new: true });
    if (!r) throw Object.assign(new Error("Recipient not found"), { status: 404 });
    return r;
};

export const deleteRecipient = async (id, groupId) => {
    const r = await Recipient.findOneAndDelete({ _id: id, group: groupId });
    if (!r) throw Object.assign(new Error("Recipient not found"), { status: 404 });
};
