let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let bcrypt = require("bcrypt-nodejs");

//Schema
let User = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    hash_password: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now()
    }
});

//Compare Hash and REAL Password
User.methods.comparePasswords = function(pass) {
    return bcrypt.compareSync(pass, this.hash_password);
};

//Compile and Export
exports = mongoose.model("User", User);