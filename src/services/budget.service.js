import Budget from "../models/budget.model.js";

export const getAllBudgets = async ({ groupId, userId }) => {
    const query = {};
    if (groupId) query.group = groupId;
    else if (userId) query.user = userId;
    return Budget.find(query).sort({ startDate: -1 });
};

export const getBudgetById = async (id) => {
    const budget = await Budget.findById(id);
    if (!budget) throw Object.assign(new Error("Budget not found"), { status: 404 });
    return budget;
};

export const createBudget = async (body) => {
    return new Budget(body).save();
};

export const updateBudget = async (id, body) => {
    const budget = await Budget.findByIdAndUpdate(id, body, { new: true });
    if (!budget) throw Object.assign(new Error("Budget not found"), { status: 404 });
    return budget;
};

export const deleteBudget = async (id) => {
    const budget = await Budget.findByIdAndDelete(id);
    if (!budget) throw Object.assign(new Error("Budget not found"), { status: 404 });
};
