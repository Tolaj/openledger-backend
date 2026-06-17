import { Router } from "express";
import { APP_CONFIG } from "../config/settings.js";

const router = Router();

router.get("/sign-in", (req, res) => {
    return res.render("auth/signin", { layout: "auth", title: "Sign In" });
});

router.get("/sign-up", (req, res) => {
    return res.render("auth/signup", { layout: "auth", title: "Sign Up" });
});

router.get("/verify-otp", (req, res) => {
    return res.render("auth/verification", { layout: "auth", title: "OTP Verification" });
});

export default router;
