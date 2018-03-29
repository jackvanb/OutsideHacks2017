var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var globalSchema = mongoose.Schema({
    members: [String]
});

globalSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("GroupGlobal", globalSchema);