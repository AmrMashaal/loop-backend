import Friend from "../models/Friend.js";

export const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, app } = req.query;

    if (app) {
      const friends = await Friend.find({
        $or: [{ sender: userId }, { receiver: userId }],
        status: "accepted",
      });

      res.status(200).json(friends);
    } else {
      const friends = await Friend.find({
        $or: [{ sender: userId }, { receiver: userId }],
        status: "accepted",
      })
        .populate(
          "sender receiver",
          "firstName lastName username occupation _id picturePath verified"
        )
        .skip((page - 1) * 6)
        .limit(6)
        .sort({ createdAt: -1 });

      if (req.query.isProfile) {
        const friendsCount = await Friend.countDocuments({
          $or: [{ sender: userId }, { receiver: userId }],
          status: "accepted",
        });

        res.status(200).json({ friends, count: friendsCount });
      } else {
        res.status(200).json(friends);
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFriend = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId } = req.params;

  try {
    const newFriend = new Friend({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    await newFriend.save();

    const populatedFriend = await newFriend.populate("sender receiver", "_id");

    res.status(201).json(populatedFriend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptFriend = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user.id;

    const friend = await Friend.findOneAndUpdate(
      { sender: receiverId, receiver: senderId },
      { status: "accepted" },
      { new: true }
    ).populate("sender receiver", "_id");

    res.status(200).json(friend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSpecificFriend = async (req, res) => {
  try {
    const { friendId } = req.params;

    const friend = await Friend.findOne({
      $or: [
        { sender: req.user.id, receiver: friendId },
        { sender: friendId, receiver: req.user.id },
      ],
    }).populate("sender receiver", "firstName lastName username occupation");

    if (!friend) {
      return res.status(404).json({ status: "not a friend" });
    }

    res.status(200).json(friend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFriend = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user.id;

    await Friend.findOneAndDelete({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    res.status(200).json({ status: "not a friend" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFriendRequest = async (req, res) => {
  const { userId } = req.params;

  try {
    const friendRequests = await Friend.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "_id picturePath firstName lastName verified")
      .select("sender")
      .limit(9);

    const transformedRequests = friendRequests.map((ele) => {
      return { ...ele.sender._doc, requestId: ele._id };
    });

    res.status(200).json(transformedRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
