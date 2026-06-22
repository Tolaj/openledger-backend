import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { productController } from "../controllers/index.js";

const router = Router();

router.use(requireAuth);

router.post("/convert-currency", productController.convertCurrency);
router.get("/", productController.getAll);
router.get("/:id", productController.getOne);
router.post("/", productController.create);
router.put("/:id", productController.update);
router.delete("/:id", productController.remove);

export default router;
