var fs = require('fs');
var moment = require('moment');

module.exports = function(logger) {
	var TIME_BETWEEN_RESTARTS = 60 * 30;

	this.timeLeftForNextRestart = function(callback) {
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

	this.restartServer = function(callback) {
		var exec = require('child_process').exec;
		var child = exec('/usr/local/sbin/restart_mcserver.sh');

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
}