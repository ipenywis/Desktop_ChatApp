let mongoose = require("mongoose");

let User = mongoose.model("User");

let bcrypt = require("bcrypt-nodejs");

let jwt = require("jsonwebtoken");

exports.registerController = (req, res) => {
    let newUser = new User(req.body);
    console.log(req.body.password);
    newUser.hash_password = bcrypt.hashSync(req.body.password);
    User.findOne({
            email: req.body.email
        },
        (err, users) => {
            if (err) {
                return res.status(401).json({
                    status: "error",
                    message: err
                });
            } else {
                if (!users) {
                    newUser.hash_password = bcrypt.hashSync(req.body.password);
                    newUser.save((err, user) => {
                        if (err)
                            return res.json({
                                status: "error",
                                message: err
                            });
                        user.hash_password = undefined;
                        return res.json({
                            status: "success",
                            user: user,
                            message: "User Registered Successfully!"
                        });
                    });
                } else {
                    return res.json({
                        status: "error",
                        message: "User Already Exists, Please Login!"
                    });
                }
            }
        }
    );
};

exports.loginController = (req, res) => {
    User.findOne({
            email: req.body.email
        },
        (err, user) => {
            if (err) {
                return res.status(401).json({
                    status: "error",
                    message: err
                });
            } else if (user) {
                if (user.comparePasswords(req.body.password)) {
                    return res.json({
                        status: "success",
                        user: user,
                        token: jwt.sign({
                                email: user.email,
                                password: req.body.password
                            },
                            "CHATAPPTKAPI123"
                        )
                    });
                }
            }
            return res.json({
                status: "error",
                message: "User Credentials Are Wrong!"
            });
        }
    );
};

exports.loginRequired = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        console.log("Regected Request ");
        return res.status(401).json({
            status: "error",
            message: "You do not have permissions to access this Server Resource!"
        });
    }
};

let users = require("../users");

//list of Currently Connected users to the Chat Server
exports.connectedUsers = (req, res, next) => {
    if (users.getConnectedUsers().length > 0) {
        return res.json({
            status: "success",
            connectedUsers: users.getConnectedUsers()
        });
    } else {
        return res.json({
            status: "success",
            connectedUsers: [],
            message: "No Currently Connected Users!"
        });
    }
};

//Update User
exports.updateUserDetails = (req, res, next) => {
    User.findOne({ email: req.body.oldUsername }, (err, user) => {
        if (err) {
            return res.json({
                status: "error",
                message: "Error Finding User, " + err.message
            });
        } else if (!user) {
            return res.json({
                status: "error",
                message: "No User Found With Username: " + req.body.oldUsername
            });
        }

        let data = {
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password)
        };
        user.set(data);

        //Save Instance
        user.save(err => {
            if (err) {
                return res.json({
                    status: "error",
                    message: "Cannot Update User's Data"
                });
            }

            return res.json({
                status: "success",
                message: "Data has been changed Successfully"
            });
        });
    });
};