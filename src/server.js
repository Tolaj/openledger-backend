import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/mongoConnection.js";

const PORT = process.env.PORT || 3000;

const start = async () => {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });

    const shutdown = async (signal) => {
        console.log(`\n${signal} received — shutting down gracefully`);
        server.close(async () => {
            await mongoose.connection.close();
            console.log("MongoDB connection closed");
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
