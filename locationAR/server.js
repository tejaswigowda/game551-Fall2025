var url = require("url"),
	querystring = require("querystring");
var passport = require('passport');
var fs = require('fs');
	var dbURL = 'mongodb://44.246.204.171:27017/test';
//	var dbURL = 'mongodb://127.0.0.1:27017/test';
var path = require('path'),
  express = require('express'),
  db = require('mongoskin').db(dbURL, {native_parser:true});


var mongoose = require('mongoose');
mongoose.connect(dbURL); // connect to our database

var app = express();
var secret = 'test' + new Date().getTime().toString()

var session = require('express-session');
app.use(require("cookie-parser")(secret));
var MongoStore = require('connect-mongo')(session);
app.use(session( {store: new MongoStore({
   url: dbURL,
   secret: secret
})}));
app.use(passport.initialize());
app.use(passport.session());
var flash = require('express-flash');
app.use( flash() );

var bodyParser = require("body-parser");
var methodOverride = require("method-override");

app.use(methodOverride());
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended:false
}));
require('./passport/config/passport')(passport); // pass passport for configuration
require('./passport/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport


app.get("/setPosition", isLoggedIn, function(req,res){
          res.end("ok");
  var user = "guest";
  if(req.user && req.user.local && req.user.local.email) user = req.user.local.email;
  var arg = req.query;
  arg.userid = user;
  arg.timestamp = new Date().getTime();
  db.collection("positions").findOne({userid:user}, function(err, item){
    if(err) console.log(err);
    if(item){
      // update
      db.collection("positions").updateOne({userid:user}, {$set:arg}, function(err, result){
        if(err) console.log(err);
        res.end("ok");
      });
    }
    else{
      // insert
      db.collection("positions").insertOne(arg, function(err, result){
        if(err) console.log(err);
      });
    }
  });
})

app.get("/getPositions", function(req,res){
  db.collection("positions").find().toArray(function(err, items){
    if(err) console.log(err);
    res.json(items);
  });
})

app.use(express.static(path.join(__dirname, 'public')));
//app.listen(8080);


if (require.main === module) { app.listen(8080); }// Instead do export the app:
else{ module.exports = app; }


console.log("server running at http://localhost:8080")

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.send('noauth');
}
