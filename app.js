// dependencies
var express = require('express');
var app = express();
var server = require("http").createServer(app);
var stats = require("./lib/stats");
var cache = require("./lib/cache");

// configuration
app.use(express.static(__dirname + "/public"));
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

// keep the frequency data always in memory
var opendata = {};

// create stats data and files
var createStats = function(cb) {
  stats.init(function(data) {
    stats.parse(data, function(incidents) {
      category = stats.categoryFrequencies(incidents);
      location = stats.locationFrequencies(incidents);
      date = stats.dateFrequencies(incidents);
      stats.updateOutputs();

      opendata = {
        category: category,
        location: location,
        date: date
      }

      cb();

      cache.set({
        category: category,
        location: location,
        date: date
      });
    });
  });
}

// route
app.get('/', function(req, res){
  res.render('index', {
    message: null,
    data: JSON.stringify(opendata)
  });
});

// update data (SLOW)
app.get('/update', function(req, res){
  cache.clean();
  stats.clean(function() {
    createStats(function() {
      res.render('index', {
        message: "Data has been updated",
        data: JSON.stringify(opendata)
      });
    });
  });
});

// start the http server
var startServer = function() {
  server.listen(process.env.PORT || 3000);
  server.on("listening", function() {
    console.log("Application started on %s @ %s:%s", process.env.NODE_ENV, server.address().address, server.address().port);
  });
}

// init the data (check first from cache)
cache.get(function(frequencies) {
  if(frequencies) {
    opendata = frequencies;
    stats.setFrequencies(frequencies);
    stats.updateOutputs();
    startServer();
  } else {
    createStats(function() {
      startServer();
    });
  }
});
