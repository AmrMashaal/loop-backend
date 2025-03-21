import Badge from "../models/Badge.js";

export const getBadges = async (req, res) => {
  const { userId } = req.params;

  try {
    const badges = await Badge.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(badges);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
