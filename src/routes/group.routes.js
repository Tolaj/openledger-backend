import { Router } from "express";
import { groupController } from "../controllers/index.js";

const router = Router();

router.get("/", groupController.getAll);
router.get("/:id", groupController.getOne);
router.post("/", groupController.create);
router.put("/:id", groupController.update);
router.delete("/:id", groupController.remove);

export default router;
