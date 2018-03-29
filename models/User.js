var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var userSchema = mongoose.Schema({
    username: {type: String, sparse: true, uniqe: false},
    password: String,
    email: {type: String, sparse: true, unique: false},
    lineup: {type: [String], sparse: true, unique: false},
    group: {type: String, sparse: true, unique: false}
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);