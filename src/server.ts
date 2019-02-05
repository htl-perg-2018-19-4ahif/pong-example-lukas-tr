import * as express from "express";
import * as http from "http";
import * as sio from "socket.io";
import * as path from "path";

const app = express();
const server = http.createServer(app);
const io = sio(server);

app.use(express.static(path.join(__dirname, "/public")));

const port = 8087;

server.listen(port, () => {
  console.log(`Server live on port ${port}`);
});

const allUsers = [];

const emitUserChange = () => {
  io.emit("users changed", {
    allUsers
  });
};

io.on("connection", socket => {
  let addedUser = false; // user already added
  let name = "";

  emitUserChange();

  socket.on("add user", username => {
    if (addedUser) return;
    if (allUsers.findIndex(u => u.name === username) === -1) {
      name = username;
      addedUser = true;
      allUsers.push({ name });
      console.log(`user ${name} added`);

      socket.emit("login", { username: name });

      socket.broadcast.emit("user joined", {
        username: name
      });
      emitUserChange();
    } else {
      socket.emit("user already exists");
    }
  });

  socket.on("disconnect", () => {
    if (addedUser) {
      allUsers.splice(allUsers.findIndex(u => u.name === name), 1);
      console.log(`user ${name} left`);

      socket.broadcast.emit("user left", {
        username: name
      });
      emitUserChange();
    }
  });
});
