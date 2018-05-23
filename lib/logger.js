const winston = require('winston');

module.exports = winston.createLogger({
	level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
	transports: [
		new winston.transports.Console({
			format: winston.format.simple(),
		}),
	],
});
