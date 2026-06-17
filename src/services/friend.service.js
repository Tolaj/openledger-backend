import User from "../models/user.model.js";
import Group from "../models/group.model.js";

export const sendFriendRequest = async ({ _id: userId, friendEmail }) => {
    const [user, friend] = await Promise.all([
        User.findById(userId),
        User.findOne({ email: friendEmail.toLowerCase() }),
    ]);

    if (!friend) throw Object.assign(new Error("User not found"), { status: 400 });
    if (String(friend._id) === String(userId))
        throw Object.assign(new Error("Cannot send friend request to yourself"), { status: 400 });

    const existingInFriend = friend.friends.find((f) => String(f.requester) === String(userId));
    const reverseInUser = user.friends.find((f) => String(f.requester) === String(friend._id));

    if (existingInFriend?.status === "ACCEPTED")
        throw Object.assign(new Error("Already friends"), { status: 400 });
    if (existingInFriend?.status === "REJECTED")
        throw Object.assign(new Error("Friend request was rejected"), { status: 400 });
    if (existingInFriend?.status === "PENDING")
        throw Object.assign(new Error("Friend request already pending"), { status: 400 });

    if (reverseInUser?.status === "PENDING") {
        reverseInUser.status = "ACCEPTED";
        friend.friends.push({ requester: userId, status: "ACCEPTED" });
        await Promise.all([user.save(), friend.save()]);
        return { message: "Friend request auto-accepted" };
    }

    friend.friends.push({ requester: userId, status: "PENDING" });
    await friend.save();
    return { message: "Friend request sent" };
};

export const receiveFriendRequest = async ({ userId, friendId, action }) => {
    const [user, friend] = await Promise.all([User.findById(userId), User.findById(friendId)]);
    if (!user || !friend) throw Object.assign(new Error("User not found"), { status: 404 });

    if (action === "ACCEPTED") {
        const entry = user.friends.find((f) => String(f.requester) === String(friendId));
        if (entry) entry.status = "ACCEPTED";
        const alreadyIn = friend.friends.find((f) => String(f.requester) === String(userId));
        if (!alreadyIn) friend.friends.push({ requester: userId, status: "ACCEPTED" });
        else alreadyIn.status = "ACCEPTED";
        await Promise.all([user.save(), friend.save()]);
        return { message: "Friend request accepted" };
    }

    if (action === "REJECTED") {
        const entry = user.friends.find((f) => String(f.requester) === String(friendId));
        if (entry) entry.status = "REJECTED";
        friend.friends = friend.friends.filter((f) => String(f.requester) !== String(userId));
        await Promise.all([user.save(), friend.save()]);
        return { message: "Friend request rejected" };
    }

    if (action === "DELETE") {
        const sharedGroup = await Group.exists({
            members: { $all: [userId, friendId] },
            name: { $ne: "ISOLATED_GROUP" },
        });
        if (sharedGroup)
            throw Object.assign(new Error("Remove friend from shared groups before unfriending"), { status: 400 });
        user.friends = user.friends.filter((f) => String(f.requester) !== String(friendId));
        friend.friends = friend.friends.filter((f) => String(f.requester) !== String(userId));
        await Promise.all([user.save(), friend.save()]);
        return { message: "Friend removed" };
    }

    throw Object.assign(new Error("Invalid action"), { status: 400 });
};
