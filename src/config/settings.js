import dotenv from 'dotenv';
dotenv.config();

const DB_NAME = process.env.DB_NAME || "testDB";

export const mongoConfig = {
    serverUrl: process.env.MONGO_URI || "mongodb://localhost:27017/",
    database: DB_NAME,
    config: {
        dbName: DB_NAME,
    },
};

export const APP_CONFIG = {
    sessionName: process.env.SESSION_NAME || "AppSession",
    sessionSecret: process.env.SESSION_SECRET || "change-me-in-production",
    afterLoginRedirect: process.env.AFTER_LOGIN_REDIRECT || "/",
};


