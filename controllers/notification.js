import Notification from "../models/notification.js";

export const getNotification = async (req, res) => {
  const { id } = req.params;
  const { limit = 5, page } = req.query;

  try {
    const notifications = await Notification.find({ receiverId: id })
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate("senderId receiverId", "picturePath");

    if (!notifications) {
      return res.status(404).json({ message: "User is not found" });
    }

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const sendNotification = async (req, res) => {
  try {
    const notifications = new Notification({
      type: req.body.type,
      description: req.body.description,
      linkId: req.body.linkId,
      receiverId: req.body.receiverId,
      senderId: req.body.senderId,
    });

    if (!notifications) {
      return res.status(404).json({ message: "User is not found" });
    }

    const postedNot = await notifications.save();

    const populatedNot = await postedNot.populate(
      "senderId receiverId",
      "picturePath"
    );

    res.status(200).json(populatedNot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const watchAllNotifications = async (req, res) => {
  const { id } = req.params;

  try {
    await Notification.updateMany(
      { receiverId: id, watched: false },
      {
        $set: {
          watched: true,
        },
      }
    );

    res
      .status(200)
      .json({ message: "Notifications have been watched successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

export const deleteAllNotifications = async (req, res) => {
  const { id } = req.params;

  try {
    await Notification.deleteMany({ receiverId: id });

    res
      .status(200)
      .json({ message: "Notifications have been deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};
