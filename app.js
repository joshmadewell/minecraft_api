var express = require('express');
var fs = require('fs');
var moment = require('moment');

var app = express();
var crossOrigin = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
};
app.use(crossOrigin);

var TIME_BETWEEN_RESTARTS = 60 * 30;

var timeLeftForNextRestart = function(callback) {
	fs.stat('/usr/local/mincraft_api/last_restart', function(err, stats) {
		var then = null;
		var now = moment();

		fs.stat('/usr/local/minecraft_api/last_restart', function(error, stats) {
			then = moment(stats.mtime);
			var timeSinceLastRestart = moment.duration(now.diff(then)).asSeconds();
			var timeLeft = TIME_BETWEEN_RESTARTS - timeSinceLastRestart;
			callback(null, timeLeft);
		});
	}); 
};

var restartServer = function(callback) {
	var exec = require('child_process').exec;
   	var child = null;
	child = exec('/usr/local/sbin/restart_mcserver.sh', function (error, stdout, stderr) {
    		if (error !== null) {
      			console.log('exec error: ' + error);
    		} else {
			callback(null);
		}
	});
}

app.post('/getcrankywitit', function(req, res) {
	timeLeftForNextRestart(function(error, timeLeft) {
		if (timeLeft <= 0) {
			restartServer(function(error) {
				if (error) res.send({restarted: null});
				else res.send({restarted: true});
			});
		} else {
			res.send({restarted: false, timeLeft: timeLeft});
		}
	});
});

app.listen(8080);
