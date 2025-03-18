import User from "../models/User.js";
import Notification from "../models/notification.js";

const onlineUsers = {};

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("userOnline", async (data) => {
      onlineUsers[data.userId] = socket.id;

      try {
        const user = await User.findById(data.userId);

        user.online = true;

        await user.save();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.log(error.message);
        }
      }
    });

    // --------------------------------------------------------

    socket.on("sendMessage", (data) => {
      socket
        .to(onlineUsers[data.receiverId])
        .emit("receiveMessage", data.message);
    });

    // --------------------------------------------------------

    socket.on("newPost", async (data) => {
      for (const friend in data.friends) {
        socket.to(onlineUsers[data.friends[friend]]).emit("notification", data.post);
      }
    });

    // --------------------------------------------------------

    socket.on("notifications", async (data) => {
      if (data.notification.type !== "newPost") {
        socket
          .to(onlineUsers[data.receiverId])
          .emit("getNotifications", data.notification);
      }
      // ------------------------------------------------------
      else if (data.notification.type === "newPost") {
        for (const friend in data.friends) {
          try {
            const newNotification = new Notification({
              type: "newPost",
              description: `${data.firstName} shared a new post`,
              linkId: data.postId,
              receiverId: data.friends[friend],
              senderId: data._id,
            });

            await newNotification.save();

            await newNotification.populate(
              "senderId receiverId",
              "picturePath"
            );

            socket
              .to(onlineUsers[data.friends[friend]])
              .emit("friendNewPost", newNotification);
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              console.log(error.message);
            }
          }
        }
      }
    });

    // --------------------------------------------------------

    socket.on("disconnect", async () => {
      const userId = Object.keys(onlineUsers).find((key) => {
        return onlineUsers[key] === socket.id;
      });

      if (userId) {
        delete onlineUsers[userId];
      }

      try {
        const user = await User.findById(userId);

        user.online = false;

        await user.save();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.log(error.message);
        }
      }
    });
  });
};
