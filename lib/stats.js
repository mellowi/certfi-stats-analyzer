// dependencies
var http = require("http");
var unzip = require("unzip");
var fstream = require("fstream");
var fs = require("fs");
var _ = require('lodash-node');

var config = require("../config");
var cache = require("./cache");

// stored objects
var _categoryFrequencies = {};
var _locationFrequencies = {};
var _dateFrequencies = {};

// setter (cache helper)
var setFrequencies = function(frequencies) {
  _categoryFrequencies = frequencies.category;
  _locationFrequencies = frequencies.location;
  _dateFrequencies = frequencies.date;
}

// store data from files to object
var store = function(files, cb) {
  console.log("storing");
  var stats = [];
  var remaining = files.length;

  files.forEach(function(filename) {
    console.log(remaining + "/" + files.length, filename);
    data = fs.readFileSync(__dirname + "/../" + config.tmpDir + "/" + filename, {encoding: "utf-8"});
    var obj = JSON.parse(data);
    stats = stats.concat(obj.autoreporter.opendata);

    remaining -= 1;
    if(remaining === 0) {
      return cb(stats);
    }
  });
}

// read directory
var readDataDir = function(cb) {
  fs.readdir(__dirname + "/../" + config.tmpDir, function(err, files) {
    if (err) throw err;

    return cb(files);
  });
}

// fetch the file to stream & unzip if not in cache
var init = function(cb) {
  // if we have the files
  readDataDir(function(files) {
    if(files.length) {
      return store(files, cb);
    }

    // no files - fetch
    console.log("downloading");
    var request = http.get(config.url, function(response) {
      var writeStream = fstream.Writer(config.tmpDir);
      writeStream.on("close", function() {
        readDataDir(function(files) {
          store(files, cb);
        });
      });

      response
        .pipe(unzip.Parse())
        .pipe(writeStream);
    });
  });
}

// remove generated files
var clean = function(cb) {
  _categoryFrequencies = {};
  _locationFrequencies = {};
  _dateFrequencies = {};

  // remove output files
  fs.readdir(__dirname + "/../" + config.tmpOutputDir, function(err, files) {
    if (err) throw err;

    if(files.length) {
      var remaining = files.length;
      files.forEach(function(filename) {
        fs.unlink(__dirname + "/../" + config.tmpOutputDir + "/" + filename, function() {})
      });
    }
  });
  // remove data files
  readDataDir(function(files) {
    if(files.length) {
      var remaining = files.length;
      files.forEach(function(filename) {
        fs.unlink(__dirname + "/../" + config.tmpDir + "/" + filename, function() {
          remaining -= 1;
          if(remaining === 0 && cb) {
            return cb();
          }
        })
      });
    }
  });
}

// frequency
var frequencies = function(incidents, unit) {
  return _.reduce(incidents, function(res, incident) {
    var key = incident[unit];
    if(!res[key])
      res[key] = 1;
    else
      res[key]++;
    return res;
  }, {});
}

// category frequency
var categoryFrequencies  = function(incidents) {
  if(_categoryFrequencies.length > 0)
    return _categoryFrequencies;
  return _categoryFrequencies = frequencies(incidents, "category");
}

// date frequency
var dateFrequencies = function(incidents, cb) {
  if(_dateFrequencies.length > 0)
    return _dateFrequencies;
  return _dateFrequencies = frequencies(incidents, "date");
}

// city + ", " + country, frequency
var locationFrequencies = function(incidents) {
  if(_locationFrequencies.length > 0)
    return _locationFrequencies;
  return _locationFrequencies = _.reduce(incidents, function(res, incident) {
    var key = incident.country + ":" + incident.city;
    if(!res[key])
      res[key] = 1;
    else
      res[key]++;
    return res;
  }, {});
}

// writes frequencies to file
var outputFrequencies = function(frequencies, filename, cb) {
  var stream = fs.createWriteStream(__dirname + "/../" + config.tmpOutputDir + "/" + filename, { flags : 'w' });
  Object.keys(frequencies).forEach(function(key) {
    var value = frequencies[key];
    stream.write(key + " " + value + "\n");
  });
  stream.end();
  if(cb) return cb();
}

// writes category frequency to file
var outputCategoryFrequencies = function(cb) {
  if(_categoryFrequencies.length <= 0)
    throw new Error("category frequencies is empty");

  outputFrequencies(_categoryFrequencies, config.tmpOutputCategory, cb);
}

// writes date frequency to file
var outputDateFrequencies = function(cb) {
  if(_dateFrequencies.length <= 0)
    throw new Error("date frequencies is empty");

  outputFrequencies(_dateFrequencies, config.tmpOutputDate, cb);
}

// writes location frequency to file
var outputLocationFrequencies = function(cb) {
  if(_locationFrequencies.length <= 0)
    throw new Error("location frequencies is empty");

  outputFrequencies(_locationFrequencies, config.tmpOutputLocation, cb);
}

var updateOutputs = function() {
  outputCategoryFrequencies();
  outputDateFrequencies();
  outputLocationFrequencies();
}


// analyzer that gets stats data as parameter from initialization
var parse = function(stats, cb) {
  console.log("parsing");

  var incidents = [];

  // flat the structure and pick what is needed
  var remaining = stats.length;
  stats.forEach(function(set) {
    var date = set.date.from.split(" ")[0];
    set.asn.forEach(function(asn){
      asn.ipaddress.forEach(function(ipaddress){
        var country = ipaddress.cc;
        var city = ipaddress.city;
        ipaddress.incident.forEach(function(incident){
          var category = incident.category.main;
          incidents.push({
            date: date,
            country: country,
            city: city,
            category: category
          })
        });
      });
    });

    remaining -= 1;
    if(remaining === 0) {
      cb(incidents);
    }
  })
};

module.exports = {
  init : init,
  parse : parse,
  setFrequencies : setFrequencies,
  categoryFrequencies : categoryFrequencies,
  locationFrequencies : locationFrequencies,
  dateFrequencies : dateFrequencies,
  updateOutputs : updateOutputs,
  clean : clean
}
