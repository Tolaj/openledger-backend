import session from 'express-session';
import MongoStore from "connect-mongo";
import { mongoConfig, APP_CONFIG } from '../config/settings.js';

const sessionConfig = session({
    name: APP_CONFIG.sessionName,
    secret: APP_CONFIG.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoConfig.serverUrl,
        dbName: mongoConfig.database,
        collectionName: "sessions",
        ttl: 60 * 60 * 24 * 2, // 2 days
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
});

export { sessionConfig };