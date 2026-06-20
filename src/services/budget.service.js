import Budget from "../models/budget.model.js";
import Finance from "../models/finance.model.js";

// Compute amountSpent for a budget (and per-category) from actual Finance expense entries
const computeSpent = async (budget) => {
    const query = {
        type: "expense",
        date: { $gte: budget.startDate, $lte: budget.endDate },
    };
    if (budget.group) query.group = budget.group;
    else if (budget.user) query.user = budget.user;

    const entries = await Finance.find(query).populate("category", "name").lean();
    const amountSpent = entries.reduce((s, e) => s + (e.amount || 0), 0);

    // Return a plain object so we can override amountSpent without saving
    const obj = budget.toObject();
    obj.amountSpent = amountSpent;
    obj.amountRemaining = obj.totalAmount - amountSpent;

    // Compute spentAmount per budget category — match by categoryRef ID if set, else by name
    if (obj.categories?.length) {
        obj.categories = obj.categories.map((cat) => {
            const refId = cat.categoryRef?.toString();
            const catSpent = entries
                .filter((e) => {
                    const eRefId = e.category?._id?.toString() || e.category?.toString();
                    if (refId && eRefId) return eRefId === refId;
                    // fallback: name match
                    return (e.category?.name || "").trim().toLowerCase() === (cat.name || "").trim().toLowerCase();
                })
                .reduce((s, e) => s + (e.amount || 0), 0);
            return { ...cat, spentAmount: catSpent };
        });
    }

    return obj;
};

export const getAllBudgets = async ({ groupId, userId }) => {
    const query = {};
    if (groupId) query.group = groupId;
    else if (userId) query.user = userId;
    const budgets = await Budget.find(query).sort({ startDate: -1 });
    return Promise.all(budgets.map(computeSpent));
};

export const getBudgetById = async (id) => {
    const budget = await Budget.findById(id);
    if (!budget) throw Object.assign(new Error("Budget not found"), { status: 404 });
    return computeSpent(budget);
};

export const createBudget = async (body) => {
    const budget = await new Budget(body).save();
    return computeSpent(budget);
};

export const updateBudget = async (id, body) => {
    const budget = await Budget.findByIdAndUpdate(id, body, { new: true });
    if (!budget) throw Object.assign(new Error("Budget not found"), { status: 404 });
    return computeSpent(budget);
};

export const deleteBudget = async (id) => {
    const budget = await Budget.findByIdAndDelete(id);
    if (!budget) throw Object.assign(new Error("Budget not found"), { status: 404 });
};
