import { Router } from "express";
import { wishlistController } from "../controllers/index.js";

const router = Router();

router.get("/", wishlistController.getAll);
router.get("/:id", wishlistController.getOne);
router.post("/", wishlistController.create);
router.put("/:id", wishlistController.update);
router.delete("/:id", wishlistController.remove);

export default router;
