#!/usr/bin/env node

let ws = require("ws");
let express = require("express");

// setup express
let app = express();
app.use(express.static("static"));
app.get("/", (req, res) => res.sendFile("./index.html"));
app.listen(7777, () => console.log("listening on localhost:7777"));

// setup websocket server
let WebSocketServer = require("ws").Server;
let wss = new WebSocketServer({port: 8888});

// setup serial port
var SerialPort = require("serialport");
var port = new SerialPort("/dev/ttyUSB0", {baudRate: 9600});
port.is_open = false;
port.on("data",  d => console.log("serial_port  data: ", d.toString("utf-8").trim()));
port.on("error", e => console.log("serial_port error: ", e.message));
port.on("open", function() {
    port.is_open = true;
    console.log("serial_port opened...");
});

wss.on("connection", function(ws) {
    console.log("new connection...");

    ws.on("message", function(msg) {
        let data = JSON.parse(msg);
        console.log(data);

        set_pan(data.orientation.pan);
    });

    ws.on("disconnect", function() {
        console.log("disconnect...");
    });
});

Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

function send_toggle_cmd(degrees) {
    let buf = new Buffer(1);
    buf[0] = Math.floor(degrees).clamp(0, 180);

    if (port.is_open)
        port.write(buf);
}

function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
}
