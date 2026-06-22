import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { groupController } from "../controllers/index.js";

const router = Router();

router.use(requireAuth);

router.get("/", groupController.getAll);
router.get("/:id", groupController.getOne);
router.post("/setup", groupController.setup);
router.post("/", groupController.create);
router.put("/:id", groupController.update);
router.delete("/:id", groupController.remove);

export default router;
