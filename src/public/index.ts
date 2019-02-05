declare const io: any;
const socket: SocketIO.Server = io();

let username = "";
let allUsers = [];

const updateUserList = () => {
  $("#userList").html("");
  allUsers.map(user => {
    const li = `<li>${user.name} <button ${
      user.name === username ? "disabled" : ""
    }>play</button></li>`;
    $("#userList").append(li);
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
