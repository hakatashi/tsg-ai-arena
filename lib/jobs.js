const runner = require('../lib/runner');

module.exports.dequeueBattles = async (job, done) => {
	await runner.dequeue();
	done();
};
