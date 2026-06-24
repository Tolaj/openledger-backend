import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import * as roleController from "../controllers/role.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/",      roleController.getAll);
router.get("/:id",   roleController.getOne);
router.post("/",     roleController.create);
router.put("/:id",   roleController.update);
router.delete("/:id",roleController.remove);

export default router;
