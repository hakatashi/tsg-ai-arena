const Turn = require('../models/Turn');
const Battle = require('../models/Battle');

module.exports.getBattle = async (req, res) => {
	const _id = req.params.battle;

	const battle = await Battle.findOne({_id})
		.populate({
			path: 'players',
			populate: {path: 'user'},
		})
		.populate('contest')
		.populate({
			path: 'winner',
			populate: {path: 'user'},
		})
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
			path: 'submission',
			populate: {path: 'user'},
		})
		.exec();

	res.render('battle', {
		contest: req.contest,
		battle,
		turns,
	});
};
