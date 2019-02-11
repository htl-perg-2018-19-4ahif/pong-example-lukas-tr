declare const io: any;
const socket: SocketIO.Server = io();

let game;
let username = "";
let allUsers = [];
let canvas: HTMLCanvasElement = document.querySelector("#board");
let scoreCanvas: HTMLCanvasElement = document.querySelector("#score");
let canvasWrap: HTMLElement = document.querySelector("#canvas-wrap");
let leftPaddle = document.getElementById("leftPaddle");
let rightPaddle = document.getElementById("rightPaddle");
let pos;
let dir = { x: 0.001, y: 0 };
let ball = { width: 2, height: 2 };
let curScore = { left: 0, right: 0 };
let ctx = canvas.getContext("2d");
let scoreCtx = scoreCanvas.getContext("2d");

init();

const angle = Math.PI / 8 + (Math.random() * Math.PI) / 8;
let quadrant = Math.floor(Math.random() * 4);
enum DirectionBall {
  top,
  right,
  bottom,
  left
}

const gameLoop = function() {
  drawBall(pos.x, pos.y);
  calculatePosAndDir();
};
function drawBall(x: number, y: number) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(x, y, 5, 5);
}
function init() {
  scoreCanvas.height = document.body.clientHeight / 10;
  scoreCanvas.width = document.body.clientWidth;
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight - scoreCanvas.height;
  canvasWrap.style.top =
    (document.body.clientHeight -
      (document.body.clientHeight - scoreCanvas.height) +
      1) /
      2 +
    "px";
  pos = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
  const scale = 4;
  leftPaddle.style.left = canvas.width / scale + "px";
  leftPaddle.style.height = (canvas.height / 10) + "px";
  leftPaddle.style.width = (canvas.width / 100) + "px";
  rightPaddle.style.left = (canvas.width / scale) * (scale/4)*3 + "px";
  rightPaddle.style.height = (canvas.height / 10) + "px"
  rightPaddle.style.width = (canvas.width / 100) + "px";
  scoreCtx.font = "20px Arial";
  scoreCtx.fillText(
    "" + curScore.left,
    scoreCanvas.width / 4,
    scoreCanvas.height / 2
  );
  scoreCtx.fillText(
    "" + curScore.right,
    (scoreCanvas.width / 4) * 3,
    scoreCanvas.height / 2
  );
}
function calculatePosAndDir() {
  let touchDirection: DirectionBall;
  if (pos.x - ball.width / 2 < 0) {
    touchDirection = DirectionBall.right;
  }
  if (pos.y - ball.height / 2 < 0) {
    touchDirection = DirectionBall.top;
  }
  if (pos.x + ball.width / 2 > canvas.width) {
    touchDirection = DirectionBall.left;
  }
  if (pos.y + ball.height / 2 > canvas.height) {
    touchDirection = DirectionBall.bottom;
  }

  if (
    pos.x - ball.width / 2 <=
      $("#leftPaddle").position().left + $("#leftPaddle").width() / 2 &&
    (pos.y + ball.height / 2 >= $("#leftPaddle").position().top &&
      pos.y + ball.height / 2 <=
        $("#leftPaddle").position().top + $("#leftPaddle").height())
  ) {
    touchDirection = DirectionBall.right;
  } else if (pos.x - ball.width / 2 < $("#leftPaddle").position().left) {
    curScore.right++;
    score();
  }
  /*if (
    pos.x + ball.width / 2 >=
      $("#rightPaddle").position().left + $("#rightPaddle").width() / 2 &&
    (pos.y + ball.height / 2 >= $("#rightPaddle").position().top &&
      pos.y + ball.height / 2 <=
        $("#rightPaddle").position().top + $("#rightPaddle").height())
  ) {
    touchDirection = DirectionBall.left;
  } else if (pos.x + ball.width / 2 > $("#rightPaddle").position().left) {
    curScore.left++;
    score();
  }*/

  if (touchDirection !== undefined) {
    switch (touchDirection) {
      case DirectionBall.left:
        dir.x = -0.001;
        break;

      case DirectionBall.right:
        dir.x = 0.001;
        break;

      case DirectionBall.top:
        dir.y = 0.001;
        break;

      case DirectionBall.bottom:
        dir.y = -0.001;
        break;
    }
  }

  pos.x = pos.x + window.innerWidth * dir.x;
  pos.y = pos.y + window.innerHeight * dir.y;
}
function score() {
  clearInterval(game);
  initBoard();
  game = setInterval(gameLoop, 4);
}
function initBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  scoreCtx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
  pos = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
  dir = { x: 0.001, y: 0 };
  scoreCtx.font = "20px Arial";
  scoreCtx.fillText(
    "" + curScore.left,
    scoreCanvas.width / 4,
    scoreCanvas.height / 2
  );
  scoreCtx.fillText(
    "" + curScore.right,
    (scoreCanvas.width / 4) * 3,
    scoreCanvas.height / 2
  );
}
function resizeBoard() {
  $("#leftPaddle").hide();
  $("#rightPaddle").hide();

  /*ctx.clearRect(0, 0, canvas.width, canvas.height);
  scoreCtx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
  scoreCanvas.height = document.body.clientHeight / 10;
  scoreCanvas.width = document.body.clientWidth;
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight - scoreCanvas.height;
  scoreCtx.fillText(
    "" + curScore.left,
    scoreCanvas.width / 4,
    scoreCanvas.height / 2
  );
  scoreCtx.fillText(
    "" + curScore.right,
    (scoreCanvas.width / 4) * 3,
    scoreCanvas.height / 2
  );
  leftPaddle.style.left = canvas.width / 4 + "px";
  rightPaddle.style.left = (canvas.width / 4) * 3 + "px";*/
  init();
  $("#leftPaddle").show();
  $("#rightPaddle").show();
}

const updateUserList = () => {
  $("#userList").html("");
  allUsers.map(user => {
    const playable = user.name !== username;
    const li = `<li ${playable ? "" : `style="color: gray;"`}>${
      user.name
    }</li>`;
    $(li)
      .appendTo("#userList")
      .click(() => {
        if (!playable) {
          return;
        }
        socket.emit("join request", { username: user.name });
      });
  });
};

$("#submitName").on("click", event => {
  const username = $("#nameInput").val();
  socket.emit("add user", username);
});

socket.on("login", data => {
  $("#loginPage").fadeOut();
  updateUserList();
});

socket.on("login", ({ username: name }) => {
  username = name;
  updateUserList();
});

socket.on("users changed", ({ allUsers: users }) => {
  allUsers = users;
  updateUserList();
});

socket.on("user already exists", data => {
  alert("user already exists");
});

socket.on("join request", ({ username: otherUser }) => {
  const accept = confirm(`User ${otherUser} wants to play with you. Join?`);
  if (accept) {
    socket.emit("join accept", { username: otherUser });
  }
});

enum Directions {
  up,
  down,
  none
}

socket.on("join accept", ({ partner }) => {
  alert("Your partner is " + partner);

  $("#heading").hide();
  $("#partnerChooser").fadeOut();
  $("#game").show();

  $(document).on("keydown", event => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      socket.emit("paddle change", {
        direction: event.key === "ArrowUp" ? Directions.up : Directions.down
      });
      let top;
      if (event.key === "ArrowUp") {
        top = Number(leftPaddle.style.top.split("px")[0]) - canvas.height / 20;
        
        if (top >= 0) {
          leftPaddle.style.top = top + "px";
        }
      } else if (event.key === "ArrowDown") {
        top = Number(leftPaddle.style.top.split("px")[0]) + canvas.height / 20;
        if (top <= canvas.height) {
          leftPaddle.style.top = top + "px";
        }
      }
      socket.emit("paddle change",{paddle: leftPaddle});
    }
  });

  $(document).on("keyup", event => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      socket.emit("paddle change", {
        direction: Directions.none
      });
    }
  });

  socket.on("enemy paddle change", ({ direction }) => {
    rightPaddle.style.top = rightPaddle.style.top + direction + "px";
  });

  socket.on("ball change", ({ direction, position }) => {
    pos.x = position.x;
    pos.y = position.y;
    dir.x = direction.x;
    dir.y = direction.y;
    console.log("ball changed position or direction", direction, position);
  });

  socket.on("game ended", ({ win }) => {
    console.log("game ended, you", win ? "won" : "lost");
    if(win){

    }
  });

  socket.on("score changed", ({ you, enemy }) => {
    curScore.left = you;
    curScore.right = enemy;
    score();
  });
  
  game = setInterval(gameLoop, 4);
});

$(window).on("resize", function() {
  resizeBoard();
  });


  $("#leaveGame").click(() => {
    socket.emit("leave game");
  });

  socket.on("partner left", () => {
    // called for this client and partner client
    alert("Your partner left");
    location.reload();
  });


