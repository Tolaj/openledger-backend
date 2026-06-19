import Group from "../models/group.model.js";
import User from "../models/user.model.js";

// Only return groups where the requesting user is a member
export const getAllGroups = (userId) =>
    Group.find({ members: userId }).populate("members");

export const getGroupById = async (id, userId) => {
    const group = await Group.findOne({ _id: id, members: userId }).populate("members");
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

export const updateGroup = async (id, body, userId) => {
    const data = { ...body };
    if (data.members) {
        data.members = Array.isArray(data.members) ? data.members : [data.members];
        if (data.userId) {
            data.members.push(data.userId);
            delete data.userId;
        }
    }
    const group = await Group.findOneAndUpdate(
        { _id: id, members: userId },
        data,
        { new: true }
    );
    if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });
    return group;
};

export const deleteGroup = async (id, userId) => {
    const group = await Group.findOneAndDelete({ _id: id, members: userId });
    if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });
};

// Called during onboarding — creates the user's primary group and marks onboarding complete.
export const setupPrimaryGroup = async ({ userId, displayName, groupType, accountType, businessName }) => {
    const group = new Group({
        name:        displayName,
        displayName: displayName,
        type:        groupType || "personal",
        members:     [userId],
    });
    group.$locals = { isNew: true };
    const saved = await group.save();

    await User.findByIdAndUpdate(userId, {
        $push: { groups: saved._id },
        accountType:        accountType || "personal",
        onboardingComplete: true,
        ...(businessName ? { businessName } : {}),
    });

    return Group.findById(saved._id).populate("members");
};
