const WebSocket = require("ws");
const ws = new WebSocket("ws:/localhost:4000/wsserver");

ws.on("open", () => {
  ws.on("message", message => {    
    console.log(`Message from server: ${message}`);
  });
});