var mongoose              = require("mongoose");
// var User                  = require("User.js");
var passportLocalMongoose = require("passport-local-mongoose");


var groupScheme = mongoose.Schema({
    name: {type: String, sparse: true, unique: false},
    members: {type: [String], sparse: true, unique: false},
    code: {type: String, sparse: true, unique: false}
});

groupScheme.plugin(passportLocalMongoose);

module.exports = mongoose.model("Group", groupScheme);

