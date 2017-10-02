#!/usr/bin/env node

// This is basic JavaScript. The keyword `let` or `var` is used to declare a
// variable. A couple of years ago, `var` was used. However, in the latest
// versions of JS, `let` is preferred for scoping reasons. Look it up if you're
// really curious.
//
// Anyways, this is importing our libraries.
let ws = require("ws");
let express = require("express");
let WebSocket = require("ws");
let SerialPort = require("serialport");

// These four lines setup our HTTP server.
// Express serves assets to web clients. We set our listening port to 7777.
// So in your web browser, the link will be 127.0.0.1:7777 or localhost:7777.
// (They're the same.)
let app = express();
app.use(express.static("static"));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(7777, () => console.log("HTTP server listening on localhost:7777"));

// Here we instantiate a WebSocket server on port 8888.
let wss = new WebSocket.Server({port: 8888});
console.log("WebSocket server listening on localhost:8888");

// The following three code blocks create and configure a serial connection to
// the Arduino. On Linux sometimes the device appears as /dev/ttyUSB0, and sometimes
// it appears as /dev/ttyACM0. Try the other if one fails.
let port = new SerialPort("/dev/ttyUSB0", {baudRate: 9600});

// This is a custom variable we create to keep track of our port's status.
// It's not part of the library or anything, so it's not necessary. It's just
// something I added to prevent sending data unless our serial channel is open.
// (Sometimes, if you send data to a closed channel, it'll crash.)
port.is_open = false;

// These are function callbacks. They are a crucial JS concept. Nearly everything
// in JS is event based. Basically, some event occurs... then a function is called.
// Here we are setting up callbacks that are triggered when the port is first opened,
// when data is received, and when errors are received.
port.on("open", function() {
    port.is_open = true;
    console.log("serial_port opened...");
});
port.on("data", function(d) {
    console.log("serial RX: ", d.toString("utf-8").trim());
});
port.on("error", function(e) {
    console.log("serial error: ", e.message);
});

// This is a WebSocket callback that triggers on new connections.
wss.on("connection", function(ws) {
    console.log("WebSocket connection...");

    // Wow, so meta...
    // For each new connection, we setup a callback that triggers
    // on received data. In this function, we process the data and
    // decided how to proceed.
    ws.on("message", function(data) {
        console.log("\n" + "websocket RX: " + data);
        set_led(data);
    });

    // ...callback called on WebSocket disconnect.
    ws.on("disconnect", function() {
        console.log("WebSocket disconnect...");
    });
});

function set_led(state) {
    // JavaScript has weird representations for binary objects because
    // everything is so abstract. This is a one byte array in memory.
    let buf = new Buffer(1);
    buf[0] = state;

    console.log("serial TX: " + buf[0]);

    // Yayy.... if the port is open, (as per set by our flag earlier),
    // then we write our one byte buffer to the serial connection.
    if (port.is_open)
        port.write(buf);
}
