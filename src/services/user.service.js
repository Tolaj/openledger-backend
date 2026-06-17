import User from "../models/user.model.js";

/* CREATE */
export const createUser = async (data) => {
    const user = new User(data);
    await user.save(); // triggers pre-save bcrypt hook
    return user;
};

/* AUTH */
export const signIn = async (email, password) => {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) throw Object.assign(new Error("Invalid email or password"), { status: 401 });

    const match = await user.comparePassword(password);
    if (!match) throw Object.assign(new Error("Invalid email or password"), { status: 401 });

    return user;
};

/* READ */
export const getAllUsers = async () => {
    return await User.find().select("-password");
};

export const getUserById = async (id) => {
    return await User.findById(id).select("-password");
};

/* UPDATE */
export const updateUser = async (id, data) => {
    return await User.findByIdAndUpdate(id, data, { new: true }).select("-password");
};

/* DELETE */
export const deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};
