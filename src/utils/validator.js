export const isValidEmail = (email) => {
    if (typeof email !== "string") throw new Error("Email must be a string");
    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned)) throw new Error(`Invalid email address: ${email}`);
    return cleaned;
};

export const isNonEmptyString = (value, fieldName = "Field") => {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${fieldName} must be a non-empty string`);
    }
    return value.trim();
};
