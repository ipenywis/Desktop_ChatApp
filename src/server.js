const express = require("express");
const app = express();
const port = 3000;
const http = require("http").createServer(app);
const io = require("socket.io")(http);
let mongoos = require("mongoose");

let jwt = require("jsonwebtoken");

let BodyParser = require("body-parser");

app.use(BodyParser.urlencoded({ extended: true }));
app.use(BodyParser.json());

//Connect and Create Database
mongoos.connect("mongodb://localhost/chat_users");

//JWT Middleware
app.use((req, res, next) => {
    if (
        req.headers &&
        req.headers.authentication &&
        req.headers.authentication.split(" ")[0] == "JWT"
    ) {
        jwt.verify(
            req.headers.authentication.split(" ")[1],
            "CHATAPPTKAPI123",
            (err, decode) => {
                if (err) {
                    return (req.user = null);
                }
                req.user = decode;
                next();
            }
        );
    } else {
        req.user = null;
        next();
    }
});

let UserModel = require("../api/models/userModel");

let userRoutes = require("../api/routes/userRoutes");

userRoutes.route(app);

let users = require("../api/users");

//Main Socket Connection
io.on("connection", socket => {
    socket.on("connectedUser", username => {
        users.addNewUser(username);
        console.log("New User ", username);
    });

    socket.on("chat-message", msg => {
        console.log("New Message " + msg.message);
        socket.broadcast.emit("chat-message", msg);
    });

    /* Typing */
    //Started Typing
    socket.on("is-typing", username => {
        //Send Target Username (Started)
        socket.broadcast.emit("is-typing", username);
    });
    //Stopped Typing
    socket.on("stopped-typing", username => {
        //Send Target UserName (Stopped)
        socket.broadcast.emit("stopped-typing", username);
    });
});

//Server Listens On Port
http.listen(port, () => {
    console.log("Server Is Running Port: " + port);
});