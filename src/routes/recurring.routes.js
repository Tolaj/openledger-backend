import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { recurringController } from "../controllers/recurring.controller.js";

const router = Router();

// Scheduler endpoint — authenticated via CRON_SECRET in the controller (no user session).
// Vercel Cron invokes with GET; POST also allowed for manual triggering.
router.get("/run", recurringController.run);
router.post("/run", recurringController.run);

// Notification actions — authorized by the single-use per-run token (no session,
// because the service worker can't access the app's auth token).
router.post("/:id/confirm", recurringController.confirm);
router.post("/:id/snooze", recurringController.snooze);
router.post("/:id/decline", recurringController.decline);

router.use(requireAuth);

router.get("/",      recurringController.getAll);
router.get("/logs",  recurringController.logs);
router.get("/:id",   recurringController.getOne);
router.post("/",     recurringController.create);
router.put("/:id",   recurringController.update);
router.delete("/:id", recurringController.remove);

export default router;
