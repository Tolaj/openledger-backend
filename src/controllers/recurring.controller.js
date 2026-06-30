import { recurringService } from "../services/index.js";
import { runDueRecurrings, confirmPendingRun, declinePendingRun, snoozePendingRun } from "../services/recurringRun.service.js";

export const recurringController = {
    // Triggered by the scheduler (Vercel Cron). Protected by CRON_SECRET.
    run: async (req, res, next) => {
        try {
            const auth = req.headers.authorization || "";
            const secret = process.env.CRON_SECRET;
            if (!secret || auth !== `Bearer ${secret}`) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            res.json(await runDueRecurrings());
        } catch (err) { next(err); }
    },
    // User tapped "Yes" on the confirmation notification.
    confirm: async (req, res, next) => {
        try {
            res.json(await confirmPendingRun(req.params.id, req.body.token || req.query.token, req.user?.id));
        } catch (err) { next(err); }
    },
    // User tapped "Snooze".
    snooze: async (req, res, next) => {
        try {
            res.json(await snoozePendingRun(req.params.id, req.body.token || req.query.token, req.user?.id));
        } catch (err) { next(err); }
    },
    // User tapped "Skip".
    decline: async (req, res, next) => {
        try {
            res.json(await declinePendingRun(req.params.id, req.body.token || req.query.token, req.user?.id));
        } catch (err) { next(err); }
    },
    getAll: async (req, res, next) => {
        try { res.json(await recurringService.getAllRecurring(req.query.groupId)); }
        catch (err) { next(err); }
    },
    logs: async (req, res, next) => {
        try { res.json(await recurringService.getRecurringLogs(req.query.groupId)); }
        catch (err) { next(err); }
    },
    getOne: async (req, res, next) => {
        try { res.json(await recurringService.getRecurringById(req.params.id, req.query.groupId)); }
        catch (err) { next(err); }
    },
    create: async (req, res, next) => {
        try {
            res.status(201).json(await recurringService.createRecurring({
                ...req.body,
                group:     req.query.groupId,
                createdBy: req.user.id,
            }));
        } catch (err) { next(err); }
    },
    update: async (req, res, next) => {
        try { res.json(await recurringService.updateRecurring(req.params.id, req.query.groupId, req.body)); }
        catch (err) { next(err); }
    },
    remove: async (req, res, next) => {
        try {
            await recurringService.deleteRecurring(req.params.id, req.query.groupId);
            res.json({ message: "Recurring deleted" });
        } catch (err) { next(err); }
    },
};
