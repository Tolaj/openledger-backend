import * as userService from "../services/user.service.js";

export const createUser = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (err) {
        next(err);
    }
};

export const userSignIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await userService.signIn(email, password);

        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        res.json({ message: "Signed in", user: req.session.user });
    } catch (err) {
        next(err);
    }
};
