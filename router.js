module.exports = function(router, logger) {
	var Controller = require('./controller');
	var controller = new Controller(logger);
	console.log(controller);

	router.post('/getcrankywitit', function(req, res) {
		logger.info("Request for restart received.");
		controller.timeLeftForNextRestart(function(error, timeLeft) {
			logger.info("Got time left: " + timeLeft);
			if (timeLeft <= 0) {
				logger.info("Time <= 0, restarting server.");
				controller.restartServer(function(error) {
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
}