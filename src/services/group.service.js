import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import { createAdminRole } from "./role.service.js";
import { encrypt } from "../utils/encrypt.js";

const encryptSmtp = (data) => {
    const pass = data?.businessDetails?.smtpPass
    if (pass === '__CLEAR__') {
        data.businessDetails.smtpPass = ''
        data.businessDetails.smtpUser = ''
        data.businessDetails.emailEnabled = false
    } else if (pass) {
        data.businessDetails.smtpPass = encrypt(pass)
    }
    return data
};

const encryptGemini = (data) => {
    if (data.geminiApiKey === '__CLEAR__') {
        data.geminiApiKey = ''
    }
    return data
};

export const getDecryptedGeminiKey = async (groupId) => {
    const group = await Group.findById(groupId).select("geminiApiKey").lean()
    return group?.geminiApiKey || null
};

// Only return groups where the requesting user is a member
export const getAllGroups = (userId) =>
    Group.find({ members: userId })
         .populate("members")
         .populate("memberRoles.roleId");

export const getGroupById = async (id, userId) => {
    const group = await Group.findOne({ _id: id, members: userId })
        .populate("members")
        .populate("memberRoles.roleId");
    if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });
    return group;
};

export const createGroup = async (body) => {
    const data = encryptGemini(encryptSmtp({ ...body }));
    data.members = (Array.isArray(data.members) ? data.members : [data.members]).filter(Boolean);
    const creatorId = data.userId;
    if (creatorId) {
        data.members.push(creatorId);
        if (!data.createdBy) data.createdBy = creatorId;
        delete data.userId;
    }
    const group = new Group(data);
    group.$locals = { isNew: true };
    const saved = await group.save();

    // Auto-create Admin role for business groups
    if (saved.type === "business" && creatorId) {
        const adminRole = await createAdminRole(saved._id, creatorId);
        await Group.findByIdAndUpdate(saved._id, {
            $push: { memberRoles: { userId: creatorId, roleId: adminRole._id } },
        });
    }

    return Group.findById(saved._id).populate("members").populate("memberRoles.roleId");
};

export const updateGroup = async (id, body, userId) => {
    const data = encryptGemini(encryptSmtp({ ...body }));
    if (data.members) {
        data.members = (Array.isArray(data.members) ? data.members : [data.members]).filter(Boolean);
        if (data.userId) {
            data.members.push(data.userId);
            delete data.userId;
        }
    }

    // Enforce admin constraints for business groups
    if (data.memberRoles !== undefined) {
        const group = await Group.findOne({ _id: id, members: userId });
        if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });

        if (group.type === "business") {
            // Find the admin (isSystem) role for this group
            const adminRole = await Role.findOne({ groupId: id, isSystem: true });
            if (adminRole) {
                const adminRoleId = String(adminRole._id);
                const newMemberRoles = data.memberRoles || [];
                const adminAssignees = newMemberRoles.filter(
                    (mr) => String(mr.roleId) === adminRoleId
                );

                // Must have exactly one admin
                if (adminAssignees.length === 0) {
                    throw Object.assign(
                        new Error("A business workspace must always have exactly one Admin"),
                        { status: 400 }
                    );
                }
                if (adminAssignees.length > 1) {
                    throw Object.assign(
                        new Error("A workspace can only have one Admin"),
                        { status: 400 }
                    );
                }

                // Only the current admin can assign/transfer the admin role
                const currentAdminEntry = (group.memberRoles || []).find(
                    (mr) => String(mr.roleId) === adminRoleId
                );
                const currentAdminId = currentAdminEntry
                    ? String(currentAdminEntry.userId)
                    : String(group.createdBy);
                const newAdminId = String(adminAssignees[0].userId);

                // If admin is being transferred, the requester must be the current admin
                if (newAdminId !== currentAdminId && String(userId) !== currentAdminId) {
                    throw Object.assign(
                        new Error("Only the current Admin can transfer the Admin role"),
                        { status: 403 }
                    );
                }
            }
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
    // First check the group exists and user is a member
    const group = await Group.findOne({ _id: id, members: userId });
    if (!group) throw Object.assign(new Error("Group not found"), { status: 404 });
    // Only the creator can delete
    if (group.createdBy && group.createdBy.toString() !== userId.toString())
        throw Object.assign(new Error("Only the group creator can delete this group"), { status: 403 });
    await Group.findOneAndDelete({ _id: id });
};

// Called during onboarding — creates the user's primary group and marks onboarding complete.
export const setupPrimaryGroup = async ({ userId, displayName, groupType, accountType, businessName }) => {
    const group = new Group({
        name:        displayName,
        displayName: displayName,
        type:        groupType || "personal",
        members:     [userId],
        createdBy:   userId,
    });
    group.$locals = { isNew: true };
    const saved = await group.save();

    await User.findByIdAndUpdate(userId, {
        $push: { groups: saved._id },
        accountType:        accountType || "personal",
        onboardingComplete: true,
        ...(businessName ? { businessName } : {}),
    });

    // For business groups, auto-create Admin role and assign to creator
    if ((groupType || "personal") === "business") {
        const adminRole = await createAdminRole(saved._id, userId);
        await Group.findByIdAndUpdate(saved._id, {
            $push: { memberRoles: { userId, roleId: adminRole._id } },
        });
    }

    return Group.findById(saved._id).populate("members").populate("memberRoles.roleId");
};
