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
  points: number;
}

interface IGame {
  p1: IUser;
  p2: IUser;
}

const allUsers: IUser[] = [];

const games: IGame[] = [];

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

const gameLoop = () => {
  games.forEach(game => {
    if (Math.random() < 0.01) {
      if (Math.random() < 0.5) {
        game.p1.points++;
      } else {
        game.p2.points++;
      }
      game.p1.socket.emit("points change", {
        you: game.p1.points,
        enemy: game.p2.points
      });
      game.p2.socket.emit("points change", {
        you: game.p2.points,
        enemy: game.p1.points
      });
      console.log("score changed", game.p1.points, game.p2.points);
      if (game.p1.points > 10 || game.p2.points > 10) {
        game.p1.socket.emit("game ended", {
          you: game.p1.points,
          enemy: game.p2.points
        });
        game.p2.socket.emit("game ended", {
          you: game.p2.points,
          enemy: game.p1.points
        });

        removeGameFromLoop(game);

        game.p1.points = 0;
        game.p2.points = 0;

        game.p1.partnerName = undefined;
        game.p2.partnerName = undefined;
      }
    }
  });
  console.log("game loop interation");
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
    },
    get game() {
      return games.find(g => g.p1 === context.user || g.p2 === context.user);
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
      addGameToLoop({
        p1: context.user,
        p2: context.partner
      });
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
      allUsers.push({ name: context.name, socket, points: 0 });

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

    removeGameFromLoop(context.game);

    const partner = context.partner;
    const user = context.user;

    socket.emit("partner left", {
      you: context.user.points,
      enemy: context.partner.points
    });
    partner.socket.emit("partner left", {
      you: context.partner.points,
      enemy: context.user.points
    });

    partner.points = 0;
    user.points = 0;

    user.partnerName = undefined;
    partner.partnerName = undefined;
  };

  socket.on("leave game", onLeavePartner);

  socket.on("paddle change", ({ direction }) => {
    context.partner.socket.emit("enemy paddle change", {
      direction
    });
  });
});

enum Directions {
  up,
  down,
  none
}

enum DirectionBall {
  top,
  right,
  bottom,
  left
}

const calculateBallPositionAndDirection = () => {
  // let touchDirection: DirectionBall;
  // if (pos.x - ball.width / 2 < 0) {
  //   touchDirection = DirectionBall.right;
  // }
  // if (pos.y - ball.height / 2 < 0) {
  //   touchDirection = DirectionBall.top;
  // }
  // if (pos.x + ball.width / 2 > canvas.width) {
  //   touchDirection = DirectionBall.left;
  // }
  // if (pos.y + ball.height / 2 > canvas.height) {
  //   touchDirection = DirectionBall.bottom;
  // }
  // if (
  //   pos.x - ball.width / 2 <=
  //     $("#leftPaddle").position().left + $("#leftPaddle").width() / 2 &&
  //   (pos.y + ball.height / 2 >= $("#leftPaddle").position().top &&
  //     pos.y + ball.height / 2 <=
  //       $("#leftPaddle").position().top + $("#leftPaddle").height())
  // ) {
  //   touchDirection = DirectionBall.right;
  //   /*} else if (pos.x - ball.width / 2 < $("#leftPaddle").position().left) {
  //   curScore.right++;
  //   score();*/
  // }
  // if (
  //   pos.x + ball.width / 2 >=
  //     $("#rightPaddle").position().left + $("#rightPaddle").width() / 2 &&
  //   (pos.y + ball.height / 2 >= $("#rightPaddle").position().top &&
  //     pos.y + ball.height / 2 <=
  //       $("#rightPaddle").position().top + $("#rightPaddle").height())
  // ) {
  //   touchDirection = DirectionBall.left;
  //   /*} else if (pos.x + ball.width / 2 > $("#rightPaddle").position().left) {
  //   curScore.left++;
  //   score();*/
  // }
  // if (touchDirection !== undefined) {
  //   switch (touchDirection) {
  //     case DirectionBall.left:
  //       dir.x = -0.001;
  //       break;
  //     case DirectionBall.right:
  //       dir.x = 0.001;
  //       break;
  //     case DirectionBall.top:
  //       dir.y = 0.001;
  //       break;
  //     case DirectionBall.bottom:
  //       dir.y = -0.001;
  //       break;
  //   }
  // }
  // pos.x = pos.x + window.innerWidth * dir.x;
  // pos.y = pos.y + window.innerHeight * dir.y;
};

let gameLoopInterval: any;
const addGameToLoop = (game: IGame) => {
  games.push(game);
  if (!gameLoopInterval) {
    gameLoopInterval = setInterval(gameLoop, 50);
  }
};

const removeGameFromLoop = (game: IGame) => {
  const idx = games.indexOf(game);
  if (idx !== -1) {
    games.splice(idx, 1);
  }
  if (games.length === 0) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = undefined;
  }
};

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
