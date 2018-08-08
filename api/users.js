let _ = require("./utils");

let hash = require("object-hash");

//Holds Currently Connected Users
let connectedUser = [];

exports.getConnectedUsers = () => {
    return connectedUser;
};

exports.addNewUser = username => {
    _.addArrItem(connectedUser, { key: hash(username), username });
};

exports.removeUser = username => {
    _.removeArrItems(arr, username);
};