"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var expect = require("chai").expect;
var cors = require("cors");

var apiRoutes = require("./routes/api.js");
var fccTestingRoutes = require("./routes/fcctesting.js");
var runner = require("./test-runner");
var helmet = require("helmet");

var mongoose = require("mongoose");
require("dotenv").config();

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

var app = express();

app.use("/public", express.static(process.cwd() + "/public"));

app.use(cors({ origin: "*" })); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
/*app.use(helmet.contentSecurityPolicy(
  {
    directives: {      
      defaultSrc: ["'self'", 'https://code.jquery.com', 'https://hyperdev.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc:["'self'", 'https://hyperdev.com']
    },
    reportOnly:true
  }
))*/

//Sample front-end
app.route("/:project/").get(function(req, res) {
  res.sendFile(process.cwd() + "/views/issue.html");
});

//Index page (static HTML)
app.route("/").get(function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API
apiRoutes(app);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res
    .status(404)
    .type("text")
    .send("Not Found");
});

//var database;
//Start our server and tests!
app.on("ready", function() {  
  app.listen(process.env.PORT || 3000, function() {
    console.log("Listening on port " + process.env.PORT);
    if (process.env.NODE_ENV === "test") {
      console.log("Running Tests...");
      setTimeout(function() {
        try {
          runner.run();
        } catch (e) {
          var error = e;
          console.log("Tests are not valid:");
          console.log(error);
        }
      }, 3500);
    }
  });
});

mongoose.connect(CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on("error", function(err) {
  console.log(err);
})

mongoose.connection.once("open", function() {
  // All OK - fire (emit) a ready event.
  app.emit("ready");
});

// Close MongoDB connection
process.on('SIGINT', () => {
  db.close(() => {
    console.log(`Closing connection to ${dbName}`)
    process.exit(0)
  })
})

module.exports = app; //for testing
