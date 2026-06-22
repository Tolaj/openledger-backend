import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { categoryController } from "../controllers/index.js";

const router = Router();

router.use(requireAuth);

router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getOne);
router.post("/", categoryController.create);
router.put("/:id", categoryController.update);
router.delete("/:id", categoryController.remove);

export default router;
