const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
const { generateMessage } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  socket.on("join", (data, callback) => {
    const { error, user } = addUser({ id: socket.id, ...data });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit(
      "message",
      generateMessage("Adamas<Creator>", "Welcome to the chat app")
    );
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    if (user) {
      const filter = new Filter();
      if (filter.isProfane(message)) {
        return callback("Profanity is not allowed");
      }
      io.to(user.room).emit("message", generateMessage(user.username, message));
      callback();
    }
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(user.username, user.username + "has left")
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "locationMessage",
        generateMessage(
          user.username,
          `https://google.com/maps?q=${location.lat},${location.long}`
        )
      );

      callback("Shared Location");
    }
  });
});
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
