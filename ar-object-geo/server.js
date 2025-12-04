var url = require("url"),
	querystring = require("querystring");
var passport = require('passport');
var fs = require('fs');
	//var dbURL = 'mongodb://44.246.204.171:27017/test';
	var dbURL = 'mongodb://127.0.0.1:27017/test';
var path = require('path'),
  express = require('express'),
  db = require('mongoskin').db(dbURL);


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


app.get("/api/dropObject"/*, isLoggedIn*/, function(req,res){
  var query = {};
  if (req.user && req.user._id) {
    query.userId = req.user._id;
  }
  db.collection('drops')
    .find(query)
    .sort({_id: -1})
    .limit(50)
    .toArray(function(err, docs){
    if(err){
      res.status(500).json({ ok: false, error: err.toString() });
      return;
    }
    res.json({ ok: true, items: docs || [] });
    });
})

app.post("/api/dropObject", isLoggedIn, function(req,res){
  try{
    var payload = req.body || {};
    var doc = {
      userId: req.user ? req.user._id : null,
      user: req.user ? ((req.user.local && req.user.local.email) || req.user.username || req.user.email || null) : null,
      modelIndex: payload.modelIndex,
      lat: payload.lat,
      lon: payload.lon,
      alt: payload.alt,
      localPos: payload.localPos,
      quaternion: payload.quaternion,
      hitTestMatrix: payload.hitTestMatrix,
      planeMetadata: payload.planeMetadata,
      cameraSnapshot: payload.cameraSnapshot,
      timestamp: payload.timestamp || Date.now(),
      createdAt: new Date(payload.timestamp || Date.now())
    };

    db.collection('drops').insert(doc, function(err, result){
      if(err){
        res.status(500).json({ ok: false, error: err.toString() });
        return;
      }
      var insertedId = null;
      if (result && result.insertedIds && result.insertedIds.length) {
        insertedId = result.insertedIds[0];
      } else if (result && result.ops && result.ops[0] && result.ops[0]._id) {
        insertedId = result.ops[0]._id;
      }
      res.json({ ok: true, id: insertedId });
    });
  }catch(e){
    res.status(500).json({ ok: false, error: e.toString() });
  }
})

app.get("/getProjects", function(req,res){

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
