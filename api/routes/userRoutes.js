let userController = require("../controllers/userController");

exports.route = app => {
    //User Login Route
    app.route("/user/login").post(userController.loginController);

    app.route("/user/register").post(userController.registerController);

    app
        .route("/user/connected")
        .get(userController.loginRequired, userController.connectedUsers);

    app
        .route("/user/update")
        .post(userController.loginRequired, userController.updateUserDetails);
};