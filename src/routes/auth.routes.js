import { Router } from "express";
import { authController } from "../controllers/index.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/session", authController.session);

export default router;
