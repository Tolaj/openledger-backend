import Group from "../models/group.model.js";

export const getAllGroups = () => Group.find().populate("members");

export const getGroupById = async (id) => {
    const group = await Group.findById(id).populate("members");
    if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });
    return group;
};

export const createGroup = async (body) => {
    const data = { ...body };
    data.members = Array.isArray(data.members) ? data.members : [data.members];
    if (data.userId) {
        data.members.push(data.userId);
        delete data.userId;
    }
    const group = new Group(data);
    group.$locals = { isNew: true };
    return group.save();
};

export const updateGroup = async (id, body) => {
    const data = { ...body };
    if (data.members) {
        data.members = Array.isArray(data.members) ? data.members : [data.members];
        if (data.userId) {
            data.members.push(data.userId);
            delete data.userId;
        }
    }
    const group = await Group.findByIdAndUpdate(id, data, { new: true });
    if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });
    return group;
};

export const deleteGroup = async (id) => {
    const group = await Group.findByIdAndDelete(id);
    if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });
};
