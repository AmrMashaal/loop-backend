import LastMessage from "../models/LastMessage.js";

export const getLastMessages = async (req, res) => {
  const { page } = req.query;

  try {
    const lastMessages = await LastMessage.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    })
      .populate(
        "senderId receiverId",
        "_id firstName lastName picturePath verified"
      )
      .limit(10)
      .skip((page - 1) * 10)
      .sort({
        updatedAt: -1,
      });

    res.status(200).json(lastMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const postLastMessage = async (req, res) => {
  try {
    await LastMessage.findOneAndUpdate(
      {
        $or: [
          { senderId: req.body.senderId, receiverId: req.body.receiverId },
          { senderId: req.body.receiverId, receiverId: req.body.senderId },
        ],
      },
      {
        message: req.body.message,
        senderId: req.body.senderId,
        receiverId: req.body.receiverId,
        updatedAt: new Date(),
      },
      { new: true, upsert: true, timestamps: false } // upsert ensures document creation if not found
    );

    res.status(200).json({ message: "Done!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
