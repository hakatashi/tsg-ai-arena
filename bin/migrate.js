const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const User = require('../models/User');
const Battle = require('../models/Battle');
const Match = require('../models/Match');
const Submission = require('../models/Submission');
const Turn = require('../models/Turn');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

	await User.updateMany({}, {$set: {admin: false}});
	for (const id of ['hakatashi', 'azaika_', 'platypus999', 'hideo54', 'ishitatsuyuki', 'naan112358', 'noko_ut']) {
		const user = await User.findOne({email: `${id}@twitter.com`});
		if (user) {
			user.admin = true;
			await user.save();
		}
	}

	const contest = await Contest.findOne({id: 'mayfes2021-marathon'});
	if (contest) {
		const battles = await Battle.find({contest});
		for (const battle of battles) {
			await Turn.deleteMany({battle});
		}
		await Battle.deleteMany({contest});
		await Match.deleteMany({contest});
		await Submission.deleteMany({contest});
	}

	await Contest.updateOne({id: 'mayfes2021-marathon'}, {
		name: 'TSG LIVE! 6 Live Programming Contest Marathon Match',
		id: 'mayfes2021-marathon',
		start: new Date('2021-05-15T15:33:00+0900'),
		end: new Date('2021-05-15T17:03:00+0900'),
		type: 'score',
		description: {
			ja: fs.readFileSync(path.resolve(__dirname, "../contests/mayfes2021-marathon.md")),
			en: '',
		},
	}, {upsert: true}, (err) => {
		if (err) {
			throw err;
		}
		console.log('inserting succeeded');
	});

	mongoose.connection.close();
})();
