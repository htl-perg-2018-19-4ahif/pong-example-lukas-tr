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
  if (
    document.body.clientHeight - scoreCanvas.height >=
    document.body.clientWidth
  ) {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientWidth - scoreCanvas.height;
  } else {
    canvas.width = document.body.clientHeight - scoreCanvas.height;
    canvas.height = document.body.clientHeight - scoreCanvas.height;
  }
  scoreCanvas.width = canvas.width;
  canvas.style.left = canvas.width / 2 + "px";
  canvas.style.right = canvas.width / 2 + "px";
  scoreCanvas.style.left = canvas.width / 2 + "px";
  scoreCanvas.style.right = canvas.width / 2 + "px";

  canvasWrap.style.top =
    (document.body.clientHeight -
      (document.body.clientHeight - scoreCanvas.height) +
      1) /
      2 +
    "px";
  pos = { x: canvas.width * 0.5, y: canvas.height * 0.5 };

  leftPaddle.style.height = canvas.height / 10 + "px";
  leftPaddle.style.width = canvas.width / 100 + "px";
  leftPaddle.style.left = canvas.style.left ;


  rightPaddle.style.height = canvas.height / 10 + "px";
  rightPaddle.style.width = canvas.width / 100 + "px";
  rightPaddle.style.left = (((Number(canvas.style.left.split("px")[0])) * 3)  - Number(rightPaddle.style.width.split("px")[0])/2) + "px";
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
     0 + $("#leftPaddle").width() &&
    (pos.y + ball.height / 2 >= $("#leftPaddle").position().top &&
      pos.y + ball.height / 2 <=
        $("#leftPaddle").position().top + $("#leftPaddle").height())
  ) {
    touchDirection = DirectionBall.right;
    /*} else if (pos.x - ball.width / 2 < $("#leftPaddle").position().left) {
    curScore.right++;
    score();*/
  }
  if (
    pos.x + ball.width / 2 >=
      canvas.width - $("#rightPaddle").width() &&
    (pos.y + ball.height / 2 >= $("#rightPaddle").position().top &&
      pos.y + ball.height / 2 <=
        $("#rightPaddle").position().top + $("#rightPaddle").height())
  ) {
    // touchDirection = DirectionBall.left;
    /*} else if (pos.x + ball.width / 2 > $("#rightPaddle").position().left) {
    curScore.left++;
    score();*/
  }

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

  pos.x = pos.x + canvas.width * dir.x;
  pos.y = pos.y + canvas.height * dir.y;
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
  $("#leaveGame").show();

  $(document).on("keydown", event => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      let top;
      if (event.key === "ArrowUp") {
        top = Number(leftPaddle.style.top.split("px")[0]) - canvas.height / 20;
        if (top >= Number(canvas.style.top.split("px")[0])) {
          leftPaddle.style.top = top + "px";
        }else{
          leftPaddle.style.top = 0+"px";
        }
      } else if (event.key === "ArrowDown") {
        top = Number(leftPaddle.style.top.split("px")[0]) + canvas.height / 20;
        if (top + $("#leftPaddle").height() <= canvas.height) {
          leftPaddle.style.top = top + "px";
        }else{
          leftPaddle.style.top = (Number(canvas.style.top.split("px")[0]) + Number(canvas.height) - Number($("#leftPaddle").height()) + Number(canvas.height * 0.005))+"px";
        }
      }
      socket.emit("paddle change", {
        direction: canvas.height / 20,
        position:  $("#leftPaddle").position().top /canvas.height 
      });
    }
  });

  socket.on("enemy paddle change", ({ direction, position }) => {
    rightPaddle.style.top = canvas.height * position.y + "px";
  });

  socket.on("points change", ({ you, enemy }) => {
    curScore.left = you;
    curScore.right = enemy;

    score();
  });

  socket.on("ball change", ({ direction, position }) => {
    pos.x = position.x * canvas.width;
    pos.y = position.y * canvas.height;
    dir.x = direction.x;
    dir.y = direction.y;
  });

  socket.on("game ended", ({ you, enemy }) => {
    $("#game").hide();
    $("#finishedPage").show();
    if (you > enemy) {
      $("#finishedPage").append("<h3>YOU WON THE GAME</h3>");
    } else {
      $("#finishedPage").append("<h3>YOU LOST THE GAME</h3>");
    }
  });

  socket.on("score changed", ({ you, enemy }) => {
    curScore.left = you;
    curScore.right = enemy;
    score();
  });

  game = setInterval(gameLoop, 4);

  const hammertime = new Hammer(leftPaddle);
  hammertime
    .get("pan")
    .set({ direction: Hammer.DIRECTION_DOWN | Hammer.DIRECTION_UP });
  hammertime.on("pan", ev =>
    // Put center of paddle to the center of the user's finger
    {
      leftPaddle.style.top =
        ev.center.y - Number($("#leftPaddle").height()) + "px";
        socket.emit("paddle change", {
          direction: canvas.height / 20,
          position: canvas.height / $("#leftPaddle").position().top
        });
    }
  );
});

$(window).on("resize", function() {
  resizeBoard();
});

$("#leaveGame").click(() => {
  socket.emit("leave game");
  $("#game").hide();
  $("#partnerChooser").fadeIn();
  //$("#loginPage").fadeIn();
  $("#leaveGame").hide();
  $("#finishedPage").hide();
  $("#heading").show();
});

$("#backToLobby").click(() => {
  $("#game").hide();
  $("#partnerChooser").fadeIn();
  //$("#loginPage").fadeIn();
  $("#backToLobby").hide();
  $("#finishedPage").hide();
  $("#heading").show();
});

socket.on("partner left", ({ you, enemy }) => {
  // called for this client and partner client
  alert("Your partner left");
  $("#game").hide();
  $("#finishedPage").show();
  $("#backToLobby").show();
  $("#leaveGame").hide();
  if (you > enemy) {
    $("#finishedPage").append("<h3>YOU WON THE GAME</h3>");
  } else {
    $("#finishedPage").append("<h3>YOU LOST THE GAME</h3>");
  }
});
