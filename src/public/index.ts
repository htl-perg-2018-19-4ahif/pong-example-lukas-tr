declare const io: any;
const socket: SocketIO.Server = io();

let username = "";
let allUsers = [];

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
    console.log("ball changed position or direction", direction, position);
  });
});
