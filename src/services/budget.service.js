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

    const entries = await Finance.find(query)
        .populate("category", "name _id")
        .populate("items.category", "name _id")
        .lean();
    const amountSpent = entries.reduce((s, e) => s + (e.amount || 0), 0);

    // Return a plain object so we can override amountSpent without saving
    const obj = budget.toObject();
    obj.amountSpent = amountSpent;
    obj.amountRemaining = obj.totalAmount - amountSpent;

    // Helper: resolve the effective category ID(s) for a Finance entry.
    // If the entry has a top-level category, use it.
    // If not, fall back to item-level categories (weighted by item amount).
    const entryCategoryAmounts = (e, targetRefId, targetName) => {
        const topId = e.category?._id?.toString() || (typeof e.category === "string" ? e.category : null);
        const matches = (id, name) => {
            if (targetRefId && id) return id === targetRefId;
            return (name || "").trim().toLowerCase() === (targetName || "").trim().toLowerCase();
        };

        // Top-level category present — simple match
        if (topId || e.category?.name) {
            const topName = e.category?.name || "";
            return matches(topId, topName) ? e.amount || 0 : 0;
        }

        // No top-level category — sum matching item amounts
        if (e.items?.length) {
            return e.items.reduce((s, it) => {
                const itId = it.category?._id?.toString() || (typeof it.category === "string" ? it.category : null);
                const itName = it.category?.name || "";
                return s + (matches(itId, itName) ? it.amount || 0 : 0);
            }, 0);
        }

        return 0;
    };

    // Compute spentAmount per budget category
    if (obj.categories?.length) {
        obj.categories = obj.categories.map((cat) => {
            const refId = cat.categoryRef?.toString();
            const catSpent = entries.reduce((s, e) => s + entryCategoryAmounts(e, refId, cat.name), 0);
            return { ...cat, spentAmount: catSpent };
        });

        // Uncategorised = total spent minus what was matched to a category
        const categorisedSpent = obj.categories.reduce((s, c) => s + c.spentAmount, 0);
        obj.uncategorisedSpent = Math.max(0, amountSpent - categorisedSpent);
    } else {
        obj.uncategorisedSpent = 0;
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
