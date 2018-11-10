const Turn = require('../models/Turn');
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

	const turns = await Turn.find({match})
		.populate({
			path: 'match',
			populate: {
				path: 'players',
				populate: {path: 'user'},
			},
		})
		.exec();

	res.render('match', {
		contest: req.contest,
		match,
		turns,
	});
};

module.exports.postMatches = async (req, res) => {
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

		const match = await runner.enqueue({
			players: [player1, player2],
			contest: req.contest,
			contest: req.user,
		});

		res.redirect(
			`/contests/${req.contest.id}/matches/${match._id}/visualizer`
		);
	} catch (error) {
		// eslint-disable-next-line callback-return
		res.status(400).json({error: error.message});
	}
};

const getVisualizer = async (req, res, id) => {
	const match =
		id === 'latest'
			? await Match.findOne({
				contest: req.contest,
				result: {$ne: 'pending'},
			  })
				.sort({createdAt: -1})
				.populate('contest')
				.populate({
					path: 'players',
					populate: {path: 'user'},
				})
				.exec()
			: await Match.findOne({_id: id})
				.populate('contest')
				.populate({
					path: 'players',
					populate: {path: 'user'},
				})
				.exec();

	if (match === null) {
		res.sendStatus(404);
		return;
	}

	if (
		id !== 'latest' &&
		!req.contest.isEnded() &&
		!match.isViewableBy(req.user)
	) {
		res.sendStatus(403);
		return;
	}

	if (match.contest.id !== req.params.contest) {
		res.redirect(`/contests/${match.contest.id}/matches/${id}/visualizer`);
		return;
	}

	const turns = await Turn.find({match})
		.populate({
			path: 'match',
			populate: {
				path: 'players',
				populate: {path: 'user'},
			},
		})
		.sort({index: 1})
		.exec();

	const data = {
		id,
		result: match.result,
		winner: match.winner,
		players: match.players.map((player) => player.userText()),
		turns: turns.map((turn) => ({
			player: turn.player,
			index: turn.index,
			input: turn.input,
			stdout: turn.stdout,
		})),
	};

	res.render('match-visualizer', {
		contest: req.contest,
		data,
		hideFooter: true,
	});
};

module.exports.getMatchVisualizer = (req, res) => getVisualizer(req, res, req.params.match);
module.exports.getLatestVisualizer = (req, res) => getVisualizer(req, res, 'latest');

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
