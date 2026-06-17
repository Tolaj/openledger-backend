import "dotenv/config";
import * as nodemailer from "nodemailer";
import { google } from "googleapis";

const getCredentials = () => {
    const GMAIL_ID = (process.env.GMAIL_ID || "").trim();
    const CLIENT_ID = (process.env.EMAIL_CLIENT_ID || "").trim();
    const CLIENT_SECRET = (process.env.EMAIL_CLIENT_SECRET || "").trim();
    const REFRESH_TOKEN = (process.env.EMAIL_REFRESH_TOKEN || "").trim();

    if (!GMAIL_ID || !CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        throw new Error(
            `Missing email env vars: ${JSON.stringify({
                GMAIL_ID: !!GMAIL_ID,
                CLIENT_ID: !!CLIENT_ID,
                CLIENT_SECRET: !!CLIENT_SECRET,
                REFRESH_TOKEN: !!REFRESH_TOKEN,
            })}`
        );
    }

    return { GMAIL_ID, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN };
};

const sendEmail = async (to, subject, text, html) => {
    const { GMAIL_ID, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = getCredentials();

    const oAuth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oAuth2.setCredentials({ refresh_token: REFRESH_TOKEN });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: GMAIL_ID,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
        },
    });

    const { token: accessToken } = await oAuth2.getAccessToken();

    const info = await transporter.sendMail({
        from: `"App" <${GMAIL_ID}>`,
        to,
        subject,
        text: text || "",
        html: html || "",
        auth: { user: GMAIL_ID, accessToken, refreshToken: REFRESH_TOKEN },
    });

    console.log("Email sent:", info.messageId, "| accepted:", info.accepted);
    return info;
};

export default sendEmail;
