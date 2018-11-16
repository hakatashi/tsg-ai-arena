const Battle = require('../models/Battle');
const Match = require('../models/Match');
const Submission = require('../models/Submission');
const runner = require('../lib/runner');

module.exports.getMatch = async (req, res) => {
	const _id = req.params.match;

	const match = await Match.findOne({_id})
		.populate({
			path: 'players',
			populate: {path: 'user'},
		})
		.populate('contest')
		.exec();

	if (match === null) {
		res.sendStatus(404);
		return;
	}

	if (match.contest.id !== req.params.contest) {
		res.redirect(`/contests/${match.contest.id}/matches/${match._id}`);
		return;
	}

	const battles = await Battle.find({match})
		.sort({_id: 1})
		.populate({
			path: 'players',
			populate: {path: 'user'},
		})
		.exec();

	res.render('match', {
		contest: req.contest,
		match,
		battles,
	});
};

module.exports.postMatch = async (req, res) => {
	try {
		if (!req.contest.isOpen() && !req.user.admin) {
			throw new Error('Competition has closed');
		}

		const latestMatch = await Match.findOne({user: req.user})
			.sort({createdAt: -1})
			.exec();
		if (
			latestMatch !== null &&
			latestMatch.createdAt > Date.now() - 20 * 1000
		) {
			throw new Error('Submission interval is too short');
		}

		const player1 = await Submission.findOne({_id: req.body.player1});
		if (player1 === null) {
			res.sendStatus(404);
			return;
		}

		const player2 = await Submission.findOne({_id: req.body.player2});
		if (player2 === null) {
			res.sendStatus(404);
			return;
		}

		const match = new Match({
			contest: req.contest,
			players: [player1, player2],
			result: 'pending',
			winner: null,
			scores: [0, 0],
			user: req.user,
		});
		await match.save();

		for (const [index, matchConfig] of req.contestData.matchConfigs.entries()) {
			const config = req.contestData.configs.find(({id}) => matchConfig.config === id);

			await runner.enqueue({
				players: matchConfig.players.map((index) => [player1, player2][index]),
				contest: req.contest,
				user: req.user,
				config: config.id,
				configIndex: index,
				match,
			});
		}

		res.redirect(`/contests/${req.contest.id}/matches/${match._id}`);
	} catch (error) {
		// eslint-disable-next-line callback-return
		res.status(400).json({error: error.message});
	}
};

module.exports.getMatches = async (req, res) => {
	const matches = await Match.find({
		contest: req.contest,
	})
		.sort({_id: -1})
		.populate({
			path: 'players',
			populate: {path: 'user'},
		})
		.limit(500)
		.exec();

	const presets =
		req.user &&
		(await Submission.find({
			contest: req.contest,
			isPreset: true,
		})
			.populate('user')
			.sort({id: -1})
			.exec());

	const mySubmissions =
		req.user &&
		(await Submission.find({
			contest: req.contest,
			user: req.user,
			isPreset: false,
		})
			.populate('user')
			.sort({id: -1})
			.limit(15)
			.exec());

	const allSubmissions =
		req.user &&
		req.user.admin &&
		(await Submission.find({contest: req.contest})
			.populate('user')
			.sort({id: -1})
			.exec());

	res.render('matches', {
		contest: req.contest,
		matches,
		submissions:
			req.user &&
			(req.user.admin ? allSubmissions : presets.concat(mySubmissions)),
	});
};
