import Finance from "../models/finance.model.js";

const populate = [
    { path: "paidBy", select: "name email" },
    { path: "user",   select: "name email" },
    { path: "category", select: "name icon" },
    { path: "splitAmong.user", select: "name email" },
    { path: "debtTracking.from", select: "name email" },
    { path: "debtTracking.to",   select: "name email" },
    { path: "items.category", select: "name icon" },
];

export const getAllFinance = async ({ groupId, type, startDate, endDate }) => {
    const query = {};
    if (groupId)   query.group = groupId;
    if (type)      query.type  = type;
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate)   query.date.$lte = new Date(endDate);
    }
    return Finance.find(query).populate(populate).sort({ date: -1 });
};

export const getFinanceById = async (id) => {
    const entry = await Finance.findById(id).populate(populate);
    if (!entry) throw Object.assign(new Error("Finance entry not found"), { status: 404 });
    return entry;
};

export const createFinance = async (body) => {
    // Auto-generate debtTracking from splitAmong + paidBy
    const debtTracking = [];
    if (body.paidBy && body.splitAmong?.length) {
        for (const split of body.splitAmong) {
            const fromId = String(split.user);
            const toId   = String(body.paidBy);
            if (fromId !== toId) {
                debtTracking.push({ from: split.user, to: body.paidBy, amount: split.amount, settled: false });
            }
        }
    }
    if (!body.paidBy)   delete body.paidBy;
    if (!body.category) delete body.category;
    if (!body.user)     delete body.user;
    return new Finance({ ...body, debtTracking }).save();
};

export const updateFinance = async (id, body) => {
    if (!body.paidBy)   delete body.paidBy;
    if (!body.category) delete body.category;
    if (!body.user)     delete body.user;
    const entry = await Finance.findByIdAndUpdate(id, body, { new: true }).populate(populate);
    if (!entry) throw Object.assign(new Error("Finance entry not found"), { status: 404 });
    return entry;
};

export const deleteFinance = async (id) => {
    const entry = await Finance.findByIdAndDelete(id);
    if (!entry) throw Object.assign(new Error("Finance entry not found"), { status: 404 });
};

export const settleDebt = async (financeId, debtIndex) => {
    const entry = await Finance.findById(financeId);
    if (!entry) throw Object.assign(new Error("Finance entry not found"), { status: 404 });
    if (!entry.debtTracking[debtIndex]) throw Object.assign(new Error("Debt not found"), { status: 404 });
    entry.debtTracking[debtIndex].settled = true;
    return entry.save();
};

export const getSummary = async ({ groupId, startDate, endDate }) => {
    const query = { group: groupId };
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate)   query.date.$lte = new Date(endDate);
    }

    const entries = await Finance.find(query).lean();

    const summary = { income: 0, expense: 0, loan: 0, investment: 0, net: 0 };
    for (const e of entries) {
        if (summary[e.type] !== undefined) summary[e.type] += e.amount;
    }
    summary.net = summary.income - summary.expense;
    return summary;
};
