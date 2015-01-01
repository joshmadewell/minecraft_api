var express = require('express');
var fs = require('fs');
var moment = require('moment');
var winston = require('winston');
var expressWinston = require('express-winston');
var customLevels = {
	levels: {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3
	},
	colors: {
		debug: 'blue',
		info: 'green',
		warn: 'yellow',
		error: 'red'
	}
}
winston.addColors(customLevels.colors);
var logger = new (winston.Logger)({ 
	levels: customLevels.levels,
	transports: [
		new winston.transports.Console({
			level: 'debug',
			colorize: true
		})
	],
	colors: customLevels.colors
});


var app = express();
var crossOriginMiddleware = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
};

var loggerMiddleware = expressWinston.logger({
	transports: [
		new winston.transports.Console({
			colorize: true
		})
	],
	meta: false,
	msg: 'HTTP: {{req.method}} {{req.url}} - - HTTP/{{req.httpVersion}}'
});

app.use(crossOriginMiddleware);
app.use(loggerMiddleware);
var TIME_BETWEEN_RESTARTS = 60 * 30;

var timeLeftForNextRestart = function(callback) {
	logger.info("Checking time since last restart");
	fs.stat('/usr/local/mincraft_api/last_restart', function(err, stats) {
		var then = null;
		var now = moment();

		logger.info("Current time is: " + now.format('YYYY-MM-DD HH:mm:ss'));

		fs.stat('/usr/local/minecraft_api/last_restart', function(error, stats) {
			then = moment(stats.mtime);
			logger.info("Last restart was: " + then.format('YYYY-MM-DD HH:mm:ss'));
			var timeSinceLastRestart = moment.duration(now.diff(then)).asSeconds();
			logger.info("Seconds since last restart: " + timeSinceLastRestart);
			var timeLeft = TIME_BETWEEN_RESTARTS - timeSinceLastRestart;
			logger.info("Total time remaining: " + timeLeft);
			callback(null, timeLeft);
		});
	}); 
};

var restartServer = function(callback) {
	var exec = require('child_process').exec;
	var child = exec('/usr/local/sbin/restart_mcserver_test.sh');

	child.stdout.on('data', function(data) {
		logger.info("[Child Process] " + data);
	});

	child.stderr.on('data', function(data) {
		logger.warn("[Child Process] " + data);
	});

	child.on('close', function(code) {
		if (code === 0) {
			logger.info("Script closed with exit code ", code);
			callback(null);
		} else {
			logger.error("Something terrible must have happened. Script exit code: ", code);
		}
	});
}

app.post('/getcrankywitit', function(req, res) {
	logger.info("Request for restart received.");
	timeLeftForNextRestart(function(error, timeLeft) {
		logger.info("Got time left: " + timeLeft);
		if (timeLeft <= 0) {
			logger.info("Time <= 0, restarting server.");
			restartServer(function(error) {
				logger.info("Script done.");
				if (error) {
					logger.error("Script error: " + error);
					res.send({restarted: null});
				} else {
					logger.info("Script success.");
					res.send({restarted: true});
				} 
			});
		} else {
			logger.info("Timeleft > 0, not restarting.");
			res.send({restarted: false, timeLeft: timeLeft});
		}
	});
});

app.listen(8080);
