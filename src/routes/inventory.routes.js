import { Router } from "express";
import { inventoryController } from "../controllers/index.js";

const router = Router();

router.get("/", inventoryController.getAll);
router.get("/:id", inventoryController.getOne);
router.post("/", inventoryController.upsert);
router.put("/:id", inventoryController.update);
router.delete("/:id", inventoryController.remove);

export default router;
