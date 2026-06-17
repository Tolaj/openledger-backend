import { Router } from "express";
import { orderController } from "../controllers/index.js";

const router = Router();

router.get("/", orderController.getAll);
router.get("/:id", orderController.getOne);
router.post("/", orderController.create);
router.put("/:id", orderController.update);
router.delete("/:id", orderController.remove);

export default router;
