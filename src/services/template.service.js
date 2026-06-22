import Template from "../models/template.model.js";
import { systemTemplates } from "../constants/systemTemplates.js";

export const getTemplates = async (userId, type) => {
    // Re-seed if system templates count doesn't match (handles new templates added)
    const count = await Template.countDocuments({ isSystem: true });
    if (count !== systemTemplates.length) {
        await Template.deleteMany({ isSystem: true });
        await Template.insertMany(systemTemplates.map((t) => ({ ...t, isSystem: true })));
    }
    const query = userId
        ? { $or: [{ isSystem: true }, { createdBy: userId }] }
        : { isSystem: true };
    if (type && type !== "all") {
        query.$and = [{ $or: [{ type }, { type: "all" }] }];
    }
    return Template.find(query);
};

export const createTemplate = async (body, userId) => {
    return new Template({ ...body, createdBy: userId, isSystem: false }).save();
};

export const deleteTemplate = async (id, userId) => {
    const template = await Template.findById(id);
    if (!template) throw Object.assign(new Error("Template not found"), { status: 404 });
    if (template.isSystem || String(template.createdBy) !== String(userId))
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    await template.deleteOne();
};
