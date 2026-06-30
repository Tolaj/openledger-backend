import Recurring from "../models/recurring.model.js";
import RecurringLog from "../models/recurringLog.model.js";

const populate = (query) =>
    query.populate({ path: "recipient", select: "name email type" });

/** Record one action taken on a recurring (used by the run engine). */
export const logRecurringAction = (rec, action, summary, scheduledFor) =>
    RecurringLog.create({
        group:         rec.group,
        recurring:     rec._id,
        recurringName: rec.name,
        user:          rec.createdBy,
        action,
        summary,
        scheduledFor,
    }).catch((e) => console.error("[recurring] log failed:", e?.message));

export const getRecurringLogs = (groupId, limit = 200) =>
    RecurringLog.find({ group: groupId }).sort({ createdAt: -1 }).limit(limit);

export const getAllRecurring = (groupId) =>
    populate(Recurring.find({ group: groupId }).sort({ nextRunDate: 1 }));

export const getRecurringById = async (id, groupId) => {
    const r = await populate(Recurring.findOne({ _id: id, group: groupId }));
    if (!r) throw Object.assign(new Error("Recurring not found"), { status: 404 });
    return r;
};

export const createRecurring = (body) => {
    const grandTotal = (body.items || []).reduce((s, i) => s + (i.amount || 0), 0);
    return new Recurring({ ...body, grandTotal }).save();
};

export const updateRecurring = async (id, groupId, data) => {
    if (data.items) {
        data.grandTotal = data.items.reduce((s, i) => s + (i.amount || 0), 0);
    }
    const r = await Recurring.findOneAndUpdate({ _id: id, group: groupId }, data, { new: true });
    if (!r) throw Object.assign(new Error("Recurring not found"), { status: 404 });
    return r;
};

export const deleteRecurring = async (id, groupId) => {
    const r = await Recurring.findOneAndDelete({ _id: id, group: groupId });
    if (!r) throw Object.assign(new Error("Recurring not found"), { status: 404 });
};
