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
  paddle: {
    direction: Directions;
    position: {
      y: number;
    };
  };
}

interface IGame {
  p1: IUser;
  p2: IUser;
  ball: {
    position: {
      x: number;
      y: number;
    };
    direction: {
      x: number;
      y: number;
    };
  };
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
    calculateBallPositionAndDirection(game);
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
        p2: context.partner,
        ball: getRandomBallData()
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
      allUsers.push({
        name: context.name,
        socket,
        points: 0,
        paddle: {
          position: {
            y: 0
          },
          direction: Directions.none
        }
      });

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

    // socket.emit("partner left", {
    //   you: context.user.points,
    //   enemy: context.partner.points
    // });
    partner.socket.emit("partner left", {
      you: context.partner.points,
      enemy: context.user.points
    });

    console.log("player", user.name, "left");

    partner.points = 0;
    user.points = 0;

    user.partnerName = undefined;
    partner.partnerName = undefined;
  };

  socket.on("leave game", onLeavePartner);

  socket.on("paddle change", ({ direction, position = 0 }) => {
    if (!context.partner) return;
    context.user.paddle.position.y = position || 0;
    context.partner.socket.emit("enemy paddle change", {
      direction,
      position: {
        y: context.user.paddle.position.y
      }
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

const ballWidth = 0.01;
const ballHeight = ballWidth;
const paddleWidth = 0.01;
const paddleHeight = 0.1;
const canvasWidth = 1;
const canvasHeight = 1;

const getRandomBallData = () => ({
  position: {
    x: 0.5,
    y: 0.1 + Math.random() * 0.8 // between .1 and .9
  },
  direction: {
    x: Math.random() < 0.5 ? -0.001 : 0.001,
    y: Math.random() < 0.5 ? -0.001 : 0.001
  }
});

const calculateBallPositionAndDirection = (game: IGame) => {
  // left ... p1
  // right ... p2

  const onPlayerScores = () => {
    game.p1.socket.emit("score changed", {
      you: game.p1.points,
      enemy: game.p2.points
    });
    game.p2.socket.emit("score changed", {
      you: game.p2.points,
      enemy: game.p1.points
    });
    game.ball = getRandomBallData();
  };

  let touchDirection: DirectionBall;

  for (let i = 0; i < 10; i++) {
    touchDirection = undefined;
    if (game.ball.position.x - ballWidth / 2 < 0) {
      touchDirection = DirectionBall.right;
    }
    if (game.ball.position.y - ballHeight / 2 < 0) {
      touchDirection = DirectionBall.top;
    }
    if (game.ball.position.x + ballWidth / 2 > canvasWidth) {
      touchDirection = DirectionBall.left;
    }
    if (game.ball.position.y + ballHeight / 2 > canvasHeight) {
      touchDirection = DirectionBall.bottom;
    }
    if (
      game.ball.position.x - ballWidth / 2 <= paddleWidth / 2 &&
      (game.ball.position.y + ballHeight / 2 >= game.p1.paddle.position.y &&
        game.ball.position.y + ballHeight / 2 <=
          game.p1.paddle.position.y + paddleHeight)
    ) {
      touchDirection = DirectionBall.right;
    } else if (game.ball.position.x - ballWidth / 2 < 0) {
      game.p2.points++;
      onPlayerScores();
    }
    if (
      game.ball.position.x + ballWidth / 2 >=
        1 - paddleWidth + paddleWidth / 2 &&
      (game.ball.position.y + ballHeight / 2 >= game.p2.paddle.position.y &&
        game.ball.position.y + ballHeight / 2 <=
          game.p2.paddle.position.y + paddleHeight)
    ) {
      touchDirection = DirectionBall.left;
    } else if (game.ball.position.x + ballWidth / 2 > 1 - paddleWidth) {
      game.p1.points++;
      onPlayerScores();
    }
    console.log("p1",game.p1.paddle.position.y);
    console.log("p2",game.p2.paddle.position.y);
    if (touchDirection !== undefined) {
      switch (touchDirection) {
        case DirectionBall.left:
          game.ball.direction.x = -0.001;
          break;
        case DirectionBall.right:
          game.ball.direction.x = 0.001;
          break;
        case DirectionBall.top:
          game.ball.direction.y = 0.001;
          break;
        case DirectionBall.bottom:
          game.ball.direction.y = -0.001;
          break;
      }
    }
    game.ball.position.x += game.ball.direction.x;
    game.ball.position.y += game.ball.direction.y;
  }

  game.p1.socket.emit("ball change", game.ball);
  game.p2.socket.emit("ball change", {
    direction: {
      x: -game.ball.direction.x,
      y: game.ball.direction.y
    },
    position: {
      x: 1 - game.ball.position.x,
      y: game.ball.position.y
    }
  });

  if (
    (game.p1.points >= 11 || game.p2.points >= 11) &&
    game.p1.points - game.p2.points >= 2
  ) {
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
};

let gameLoopInterval;
const addGameToLoop = (game: IGame) => {
  games.push(game);
  if (!gameLoopInterval) {
    gameLoopInterval = setInterval(gameLoop, 40);
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
