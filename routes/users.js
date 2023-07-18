const mongoose = require("mongoose");
var passportLocalMongoose = require('passport-local-mongoose')
mongoose.connect("mongodb://localhost/dyn1")
    .then(function() {
        console.log("CONNECTION SUCCESSFULL!")
    })
var userSchema = mongoose.Schema({
    name: String,
    username: String,
    password: String,
    email: String
})
userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("user", userSchema);