import { wishlistService } from "../services/index.js";

export const getAll = async (req, res, next) => {
    try { res.json(await wishlistService.getAllWishlists(req.query.groupId)); } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
    try { res.json(await wishlistService.getWishlistById(req.params.id)); } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
    try { res.status(201).json(await wishlistService.createWishlist(req.body)); } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
    try { res.json(await wishlistService.updateWishlist(req.params.id, req.body)); } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
    try { await wishlistService.deleteWishlist(req.params.id); res.json({ message: "Wishlist deleted" }); } catch (err) { next(err); }
};
