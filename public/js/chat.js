const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $shareLocationButton = document.querySelector("#share_loc");
const $messages = document.querySelector("#messages");
//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//templates
const $messageTemplate = document.querySelector("#message-template").innerHTML;
const $locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
const autoScroll = () => {
  const $newMessage = $messages.lastElementChild;
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  const visibleHeight = $messages.offsetHeight;
  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight;
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};
socket.on("message", (message) => {
  const html = Mustache.render($messageTemplate, {
    username: message.username,
    message: message.message,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  console.log(message);
  autoScroll();
});
socket.on("roomData", (message) => {
  const html = Mustache.render($sidebarTemplate, {
    room: message.room,
    users: message.users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});
socket.on("locationMessage", (url) => {
  const html = Mustache.render($locationMessageTemplate, {
    username: url.username,
    url: url.message,
    createdAt: moment(url.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");

  //disable
  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (err) => {
    //enable
    $messageFormButton.removeAttribute("disabled");
    if (err) {
      return console.log(err);
    }
    console.log("Message Delivered");
    $messageFormInput.value = "";
    $messageFormInput.focus();
  });
});
$shareLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  $shareLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;
    socket.emit(
      "sendLocation",
      {
        lat,
        long,
      },
      () => {
        console.log("Location Shared");
        $shareLocationButton.removeAttribute("disabled");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
