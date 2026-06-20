import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { recipientController } from "../controllers/recipient.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",      recipientController.getAll);
router.get("/:id",   recipientController.getOne);
router.post("/",     recipientController.create);
router.put("/:id",   recipientController.update);
router.delete("/:id", recipientController.remove);

export default router;
