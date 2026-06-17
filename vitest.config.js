import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./tests/setup.js"],
        env: {
            JWT_SECRET: "test-secret",
            NODE_ENV: "test",
        },
    },
});
