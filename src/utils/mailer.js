import nodemailer from "nodemailer";
import { decrypt } from "./encrypt.js";

const getTransport = (smtpUser, smtpPass) => {
    const { SMTP_HOST, SMTP_PORT } = process.env;
    const user = smtpUser || process.env.SMTP_USER;
    // smtpPass from DB is AES-256-GCM encrypted (iv:authTag:ciphertext); decrypt it
    let pass = process.env.SMTP_PASS;
    if (smtpPass) {
        try { pass = decrypt(smtpPass) } catch { pass = smtpPass } // fallback for plain-text legacy values
    }

    if (!user || !pass) {
        throw Object.assign(
            new Error("Email is not configured for this workspace. Add SMTP credentials in Settings → Configuration."),
            { status: 503 }
        );
    }

    return nodemailer.createTransport({
        host:   SMTP_HOST || "smtp.gmail.com",
        port:   parseInt(SMTP_PORT || "587"),
        secure: parseInt(SMTP_PORT || "587") === 465,
        auth: { user, pass },
    });
};

// smtpConfig = { smtpUser, smtpPass, emailEnabled } from group.businessDetails
export const sendMail = async ({ to, subject, html, attachments = [], smtpConfig = {} }) => {
    if (smtpConfig.emailEnabled === false) {
        throw Object.assign(
            new Error("Email sending is disabled for this workspace. Enable it in Settings → Configuration."),
            { status: 503 }
        );
    }
    const transport = getTransport(smtpConfig.smtpUser, smtpConfig.smtpPass);
    const fromUser  = smtpConfig.smtpUser || process.env.SMTP_USER;
    return transport.sendMail({
        from: `"OpenLedger" <${fromUser}>`,
        to,
        subject,
        html,
        attachments,
    });
};
