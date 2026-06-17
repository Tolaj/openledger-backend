import User from "../models/user.model.js";

export const getMe = async (id) => {
    const user = await User.findById(id)
        .populate({ path: "groups", populate: { path: "members" } })
        .populate("friends.requester");
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
    return user;
};

export const updateUser = async (id, data) => {
    const user = await User.findByIdAndUpdate(id, data, { new: true });
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
    return user;
};
