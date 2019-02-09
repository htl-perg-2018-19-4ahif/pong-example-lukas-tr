declare const io: any;
const socket: SocketIO.Server = io();

let username = "";
let allUsers = [];
let canvas: HTMLCanvasElement = document.querySelector("#myCanvas");
let pos = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
let dir = { x: 0.001, y: 0.001 };
let ball = { width: 2, height: 2 };

let ctx = canvas.getContext("2d");
const angle = Math.PI / 8 + Math.random() * Math.PI / 8;
let quadrant = Math.floor(Math.random() * 4);
enum DirectionBall { top, right, bottom, left };

function drawBall(x: number, y: number) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(x, y, 5, 5);
}
function calculatePosAndDir() {
  let touchDirection: DirectionBall;
  if ((pos.x - ball.width / 2) < 0) { touchDirection = DirectionBall.right; }
  if ((pos.y - ball.height / 2) < 0) { touchDirection = DirectionBall.top; }
  if ((pos.x + ball.width / 2) > canvas.width) { touchDirection = DirectionBall.left; }
  if ((pos.y + ball.height / 2) > canvas.height) { touchDirection = DirectionBall.bottom; }


  if ((pos.x - ball.width / 2) < ($("#paddle").position().left + $("#paddle").width()/2) && ((pos.y + ball.height / 2) >=  $("#paddle").position().top && (pos.y + ball.height / 2) <=  $("#paddle").position().top + $("#paddle").height())) { touchDirection = DirectionBall.right; }

  
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
  $("#partnerChooser").fadeOut();
  $("#canvas-wrap").show();

  $(document).on("keydown", event => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      socket.emit("paddle change", {
        direction: event.key === "ArrowUp" ? Directions.up : Directions.down
      });

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
    console.log("enemy changed direction", direction);
  });

  socket.on("ball change", ({ direction, position }) => {
  });
  setInterval(function () {
    drawBall(pos.x, pos.y);
    calculatePosAndDir();
    
  }, 4);
});
window.addEventListener("keydown", function(event){
  
  let paddel = document.getElementById("paddle");

  ctx.fillRect($("#paddle").offset().left ,50,1,1);
  let top;
  switch(event.code){
    
    case "ArrowUp":
    top =(Number(paddel.style.top.split("px")[0])) - 10;
    if(top >= 0){
      paddel.style.top = top+"px";
    }
    break;
    case "ArrowDown":
    
    top =(Number(paddel.style.top.split("px")[0])) + 10;
    if(top <= canvas.height){
      paddel.style.top = top+"px";
    }
    break;

  }
});
