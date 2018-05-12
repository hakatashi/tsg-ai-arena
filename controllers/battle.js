const Turn = require('../models/Turn');
const Battle = require('../models/Battle');
const Submission = require('../models/Submission');
const runner = require('../lib/runner');

module.exports.getBattle = async (req, res) => {
	const _id = req.params.battle;

	const battle = await Battle.findOne({_id})
		.populate({
			path: 'players',
			populate: {path: 'user'},
		})
		.populate('contest')
		.exec();

	if (battle === null) {
		res.sendStatus(404);
		return;
	}

	if (battle.contest.id !== req.params.contest) {
		res.redirect(
			`/contests/${battle.contest.id}/battles/${battle._id}`
		);
		return;
	}

	const turns = await Turn.find({battle})
		.populate({
			path: 'battle',
			populate: {
				path: 'players',
				populate: {path: 'user'},
			},
		})
		.exec();

	res.render('battle', {
		contest: req.contest,
		battle,
		turns,
	});
};

module.exports.postBattles = async (req, res) => {
	try {
		if (!req.contest.isOpen()) {
			throw new Error('Competition has closed');
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

		const battle = await runner.battle([player1, player2], req.contest).catch((e) => {
			console.error(e);
		});

		res.redirect(`/contests/${req.contest.id}/battles/${battle._id}`);
	} catch (error) {
		// eslint-disable-next-line callback-return
		res.status(400).json({error: error.message});
	}
};

module.exports.getBattleVisualizer = async (req, res) => {
	const _id = req.params.battle;

	const battle = await Battle.findOne({_id})
		.populate('contest')
		.populate({
			path: 'players',
			populate: {path: 'user'},
		})
		.exec();

	if (battle === null) {
		res.sendStatus(404);
		return;
	}

	if (battle.contest.id !== req.params.contest) {
		res.redirect(
			`/contests/${battle.contest.id}/battles/${battle._id}/visualizer`
		);
		return;
	}

	const turns = await Turn.find({battle})
		.populate({
			path: 'battle',
			populate: {
				path: 'players',
				populate: {path: 'user'},
			},
		})
		.exec();

	const data = {
		result: battle.result,
		winner: battle.winner,
		players: battle.players.map((player) => player.userText()),
		turns: turns.map((turn) => ({
			player: turn.player,
			index: turn.index,
			input: turn.input,
			stdout: turn.stdout,
		})),
	};

	res.render('battle-visualizer', {
		contest: req.contest,
		data,
		hideFooter: true,
	});
};

module.exports.getBattles = async (req, res) => {
	const battles = await Battle.find({
		contest: req.contest,
	})
		.sort({_id: -1})
		.populate({
			path: 'players',
			populate: {path: 'user'},
		})
		.limit(500)
		.exec();

	res.render('battles', {
		contest: req.contest,
		battles,
	});
};
