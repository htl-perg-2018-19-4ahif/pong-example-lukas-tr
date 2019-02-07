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

const allUsers: { name: string; socket: sio.Socket }[] = [];

const emitUserChange = () => {
  io.emit("users changed", {
    allUsers: allUsers.map(u => ({ name: u.name }))
  });
};

io.on("connection", socket => {
  let addedUser = false; // user already added
  let name = "";

  let gameLoopInterval: NodeJS.Timeout;

  emitUserChange();

  socket.on("join request", ({ username: otherUser }) => {
    console.log("user", name, "wants to play with user", otherUser);
    const otherUserData = allUsers.find(u => u.name === otherUser);
    otherUserData.socket.emit("join request", { username: name });
    otherUserData.socket.once("join accept", ({ username }) => {
      if (username === name) {
        console.log("user", otherUser, "accepted", name, "s request");

        socket.emit("join accept", { partner: otherUser });
        otherUserData.socket.emit("join accept", { partner: name });

        [
          { cur: socket, other: otherUserData.socket },
          { other: socket, cur: otherUserData.socket }
        ].forEach(({ cur, other }) => {
          cur.on("paddle change", ({ direction }) => {
            other.emit("enemy paddle change", {
              direction
            });
          });
        });

        gameLoopInterval = setInterval(() => {
          [
            { cur: socket, other: otherUserData.socket },
            { other: socket, cur: otherUserData.socket }
          ].forEach(({ cur, other }) => {
            cur.emit("ball change", {
              direction: { x: 0.001, y: 0 },
              position: { x: 0.5, y: 0.5 }
            });
          });
        }, 50);
      }
    });
  });

  socket.on("add user", username => {
    if (addedUser) return;
    if (allUsers.findIndex(u => u.name === username) === -1) {
      name = username;
      addedUser = true;
      allUsers.push({ name, socket });
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
    clearInterval(gameLoopInterval);
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

enum Directions {
  up,
  down,
  none
}
