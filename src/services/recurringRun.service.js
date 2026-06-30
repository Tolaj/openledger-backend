import crypto from "crypto";
import Recurring from "../models/recurring.model.js";
import Inventory from "../models/inventory.model.js";
import { writeMovement } from "./stockMovement.service.js";
import { sendToUser } from "./push.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** Is `date` an on-cadence day relative to the anchor + frequency? */
function isOnCadenceDay(anchor, date, frequency) {
    const a = startOfDay(anchor), d = startOfDay(date);
    if (d < a) return false;
    const days = Math.round((d - a) / DAY_MS);
    switch (frequency) {
        case "daily":     return true;
        case "weekly":    return days % 7 === 0;
        case "monthly":   return d.getDate() === a.getDate();
        case "quarterly": {
            const m = (d.getFullYear() - a.getFullYear()) * 12 + (d.getMonth() - a.getMonth());
            return d.getDate() === a.getDate() && m % 3 === 0;
        }
        case "yearly":    return d.getDate() === a.getDate() && d.getMonth() === a.getMonth();
        default:          return true;
    }
}

/** All datetimes the recurring should fire today (based on its times of day). */
function occurrencesToday(rec, now) {
    if (!isOnCadenceDay(rec.nextRunDate, now, rec.frequency)) return [];
    const times = (rec.times && rec.times.length)
        ? rec.times
        : [new Date(rec.nextRunDate).toTimeString().slice(0, 5)];
    return times.map((t) => {
        const [h, m] = String(t).split(":").map(Number);
        const d = new Date(now);
        d.setHours(h || 0, m || 0, 0, 0);
        return d;
    });
}

/** The latest occurrence that is due (<= now) and not yet fired, else null. */
function dueOccurrence(rec, now) {
    const past = occurrencesToday(rec, now).filter((o) => o <= now);
    if (!past.length) return null;
    const latest = new Date(Math.max(...past.map((o) => o.getTime())));
    const last = rec.lastRunAt ? new Date(rec.lastRunAt) : new Date(0);
    return latest > last ? latest : null;
}

/** Deduct each item's qty from inventory (clamped at 0) and record a movement. */
async function consumeStock(rec) {
    const lines = [];
    for (const it of rec.items || []) {
        if (!it.product || !(it.qty > 0)) continue;
        const inv = await Inventory.findOne({ product: it.product });
        if (!inv) continue;
        const before = inv.quantityAvailable ?? 0;
        const after = Math.max(0, before - it.qty);
        const change = after - before;
        if (change === 0) continue;
        inv.quantityAvailable = after;
        inv.lastUpdated = new Date();
        await inv.save();
        await writeMovement({
            group:      rec.group,
            product:    it.product,
            change,
            sourceType: "adjustment",
            sourceRef:  "Recurring",
            sourceId:   rec._id,
            reason:     "recurring usage",
            notes:      rec.name,
            createdBy:  rec.createdBy,
        });
        lines.push({ qty: -change, unit: it.unit, desc: it.description });
    }
    return lines;
}

const summarize = (lines) =>
    !lines.length ? "No stock changes (already empty)."
        : lines.map((l) => `${l.desc || "item"}: -${l.qty}${l.unit ? " " + l.unit : ""}`).join(", ");

const SNOOZE_MINUTES = 60;

/** Send the actionable "Use stock?" push for a recurring with a pending run. */
async function sendConfirmPush(rec) {
    if (!rec.createdBy || !rec.pendingRun?.token) return;
    const base = (process.env.API_PUBLIC_URL || "").replace(/\/$/, "");
    await sendToUser(rec.createdBy, {
        title: `Use stock for "${rec.name}"?`,
        body: "Tap Yes to deduct the scheduled items, or Snooze to be reminded later.",
        tag: `recurring-${rec._id}`,
        requireInteraction: true,
        data: {
            type: "recurring-confirm",
            recurringId: String(rec._id),
            token: rec.pendingRun.token,
            confirmUrl: `${base}/recurring/${rec._id}/confirm`,
            declineUrl: `${base}/recurring/${rec._id}/decline`,
            snoozeUrl:  `${base}/recurring/${rec._id}/snooze`,
        },
        actions: [
            { action: "yes", title: "Yes, deduct" },
            { action: "snooze", title: "Snooze 1h" },
            { action: "no", title: "Skip" },
        ],
    });
}

/**
 * Process every active recurring whose start date has passed and that has a
 * due time-of-day occurrence. Designed to be called frequently (e.g. hourly).
 */
export async function runDueRecurrings(now = new Date()) {
    const result = { checked: 0, consumed: 0, awaitingConfirm: 0, snoozedResent: 0, skipped: 0 };

    // 1) Re-send any snoozed confirmations whose snooze window has elapsed
    const snoozed = await Recurring.find({
        status: "active",
        "pendingRun.snoozedUntil": { $lte: now },
    });
    for (const rec of snoozed) {
        if (rec.pendingRun?.expiresAt && now > new Date(rec.pendingRun.expiresAt)) {
            rec.pendingRun = undefined;        // expired — give up
            await rec.save();
            continue;
        }
        rec.pendingRun.snoozedUntil = undefined; // back to "awaiting action"
        await rec.save();
        await sendConfirmPush(rec);
        result.snoozedResent += 1;
    }

    // 2) Fire due occurrences
    const candidates = await Recurring.find({ status: "active", nextRunDate: { $lte: now } });
    result.checked = candidates.length;

    for (const rec of candidates) {
        const occ = dueOccurrence(rec, now);
        if (!occ) continue;

        if (!rec.deductStock) {
            // Order-mode (autoCreate) runs aren't handled by this engine yet.
            rec.lastRunAt = now; rec.lastRunDate = occ;
            await rec.save();
            result.skipped += 1;
            continue;
        }

        if (rec.notifyMode === "confirm") {
            const token = crypto.randomBytes(16).toString("hex");
            rec.pendingRun = { token, dueDate: occ, expiresAt: new Date(now.getTime() + DAY_MS) };
            rec.lastRunAt = now; rec.lastRunDate = occ;
            await rec.save();
            result.awaitingConfirm += 1;
            await sendConfirmPush(rec);
            continue;
        }

        // none / notify → deduct immediately
        const lines = await consumeStock(rec);
        rec.lastRunAt = now; rec.lastRunDate = occ;
        await rec.save();
        result.consumed += 1;

        if (rec.notifyMode === "notify" && rec.createdBy) {
            await sendToUser(rec.createdBy, {
                title: `Stock used: "${rec.name}"`,
                body: summarize(lines),
                tag: `recurring-${rec._id}`,
                data: { type: "recurring-done", recurringId: String(rec._id) },
            });
        }
    }

    return result;
}

/** Confirm a pending run (user tapped "Yes" on the notification). */
export async function confirmPendingRun(id, token, userId) {
    const rec = await Recurring.findById(id);
    if (!rec) throw Object.assign(new Error("Recurring not found"), { status: 404 });
    if (userId && rec.createdBy && String(rec.createdBy) !== String(userId)) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    if (!rec.pendingRun?.token || rec.pendingRun.token !== token) {
        throw Object.assign(new Error("No matching pending run"), { status: 409 });
    }
    if (rec.pendingRun.expiresAt && new Date() > new Date(rec.pendingRun.expiresAt)) {
        rec.pendingRun = undefined;
        await rec.save();
        throw Object.assign(new Error("Confirmation expired"), { status: 410 });
    }
    const lines = await consumeStock(rec);
    rec.pendingRun = undefined;
    await rec.save();
    return { ok: true, summary: summarize(lines) };
}

/** Snooze a pending run (user tapped "Snooze") — re-ask after SNOOZE_MINUTES. */
export async function snoozePendingRun(id, token, userId, minutes = SNOOZE_MINUTES) {
    const rec = await Recurring.findById(id);
    if (!rec) throw Object.assign(new Error("Recurring not found"), { status: 404 });
    if (userId && rec.createdBy && String(rec.createdBy) !== String(userId)) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    if (!rec.pendingRun?.token || rec.pendingRun.token !== token) {
        throw Object.assign(new Error("No matching pending run"), { status: 409 });
    }
    const until = new Date(Date.now() + minutes * 60 * 1000);
    rec.pendingRun.snoozedUntil = until;
    // keep it alive at least until the snooze fires
    if (!rec.pendingRun.expiresAt || until > new Date(rec.pendingRun.expiresAt)) {
        rec.pendingRun.expiresAt = new Date(until.getTime() + DAY_MS);
    }
    await rec.save();
    return { ok: true, snoozedUntil: until };
}

/** Decline a pending run (user tapped "Skip"). */
export async function declinePendingRun(id, token, userId) {
    const rec = await Recurring.findById(id);
    if (!rec) throw Object.assign(new Error("Recurring not found"), { status: 404 });
    if (userId && rec.createdBy && String(rec.createdBy) !== String(userId)) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
    }
    if (rec.pendingRun?.token === token) {
        rec.pendingRun = undefined;
        await rec.save();
    }
    return { ok: true };
}
