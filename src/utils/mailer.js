import nodemailer from "nodemailer";

const getTransport = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_USER || !SMTP_PASS) {
        throw Object.assign(
            new Error("Email not configured. Set SMTP_USER and SMTP_PASS in .env"),
            { status: 503 }
        );
    }

    return nodemailer.createTransport({
        host:   SMTP_HOST  || "smtp.gmail.com",
        port:   parseInt(SMTP_PORT || "587"),
        secure: parseInt(SMTP_PORT || "587") === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
};

export const sendMail = async ({ to, subject, html, attachments = [] }) => {
    const transport = getTransport();
    return transport.sendMail({
        from: `"OpenLedger" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments,
    });
};
