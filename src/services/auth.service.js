import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const signToken = (user) =>
    jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async ({ name, email, password }) => {
    if (!name || !email || !password)
        throw Object.assign(new Error("name, email, and password are required"), { status: 400 });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
        throw Object.assign(new Error("Email already in use"), { status: 400 });

    const user = await new User({ name, email, password }).save();
    return { token: signToken(user), user };
};

export const login = async ({ email, password }) => {
    if (!email || !password)
        throw Object.assign(new Error("email and password are required"), { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password)))
        throw Object.assign(new Error("Invalid credentials"), { status: 401 });

    return { token: signToken(user), user };
};

export const decodeSession = (token) => {
    if (!token) throw Object.assign(new Error("No session"), { status: 401 });
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        throw Object.assign(new Error("Invalid session"), { status: 401 });
    }
};
