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

interface IUser {
  name: string;
  socket: sio.Socket;
  partnerName?: string;
  requestedPartnerName?: string;
}

// interface IGame {
//   p1: IUser;
//   p2: IUser;
// }

const allUsers: IUser[] = [];

const findUserByName = (name: string): IUser | undefined => {
  return allUsers.find(u => u.name === name);
};

const findUserByPartnerName = (name: string): IUser | undefined => {
  return allUsers.find(u => u.partnerName === name);
};

const emitUserChange = () => {
  io.emit("users changed", {
    allUsers: allUsers.map(u => ({ name: u.name }))
  });
};

io.on("connection", socket => {
  const context = {
    name: "",
    get user() {
      return findUserByName(context.name);
    },
    get partner() {
      return findUserByPartnerName(context.name);
    },
    get userAdded() {
      return !!context.name.length;
    }
  };

  emitUserChange();

  socket.on("join accept", ({ username }) => {
    if (!context.userAdded) return;
    const partner = findUserByName(username);
    if (partner.requestedPartnerName === context.name) {
      partner.partnerName = context.name;
      context.user.partnerName = username;
      context.user.requestedPartnerName = undefined;
      context.partner.requestedPartnerName = undefined;
      socket.emit("join accept", { partner: context.partner.name });
      context.partner.socket.emit("join accept", { partner: context.name });
    }
  });

  socket.on("join request", ({ username: otherUser }) => {
    if (!context.userAdded) return;
    console.log("user", context.name, "wants to play with user", otherUser);
    const otherUserData = findUserByName(otherUser);
    context.user.requestedPartnerName = otherUserData.name;
    otherUserData.socket.emit("join request", { username: context.name });
  });

  socket.on("add user", username => {
    if (context.userAdded) return;
    if (!findUserByName(username)) {
      context.name = username;
      allUsers.push({ name: context.name, socket });

      console.log(`user ${context.name} added`);

      socket.emit("login", { username: context.name });

      socket.broadcast.emit("user joined", {
        username: context.name
      });
      emitUserChange();
    } else {
      socket.emit("user already exists");
    }
  });

  socket.on("disconnect", () => {
    if (context.userAdded) {
      onLeavePartner();

      allUsers.splice(allUsers.findIndex(u => u.name === context.name), 1);
      console.log(`user ${context.name} left`);

      socket.broadcast.emit("user left", {
        username: context.name
      });
      emitUserChange();
    }
  });

  const onLeavePartner = () => {
    if (!context.userAdded || !context.partner) return;

    const partner = context.partner;
    const user = context.user;

    socket.emit("partner left");
    partner.socket.emit("partner left");

    user.partnerName = undefined;
    partner.partnerName = undefined;
  };

  socket.on("leave game", onLeavePartner);
});

enum Directions {
  up,
  down,
  none
}

// [
//   { cur: socket, other: otherUserData.socket },
//   { other: socket, cur: otherUserData.socket }
// ].forEach(({ cur, other }) => {
//   cur.on("paddle change", ({ direction }) => {
//     other.emit("enemy paddle change", {
//       direction
//     });
//   });

//   cur.once("disconnect", () => {
//     other.emit("game ended", { win: true });
//   });
// });

// gameLoopInterval = setInterval(() => {
//   [
//     { cur: socket, other: otherUserData.socket },
//     { other: socket, cur: otherUserData.socket }
//   ].forEach(({ cur, other }) => {
//     cur.emit("ball change", {
//       direction: { x: 0.001, y: 0 },
//       position: { x: 0.5, y: 0.5 }
//     });

//     if (Math.random() < 0.05) {
//       cur.emit("score changed", {
//         you: Math.random(),
//         enemy: Math.random()
//       });
//       other.emit("score changed", {
//         you: Math.random(),
//         enemy: Math.random()
//       });
//     }
//   });
// }, 50);
