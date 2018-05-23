const winston = require('winston');

module.exports = winston.createLogger({
	level: 'info',
	transports: [
		new winston.transports.Console({
			format: winston.format.simple(),
		}),
	],
});
