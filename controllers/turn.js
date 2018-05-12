const Turn = require('../models/Turn');

module.exports.getTurn = async (req, res) => {
	const _id = req.params.turn;

	const turn = await Turn.findOne({_id})
		.populate({
			path: 'submission',
			populate: {path: 'user'},
		})
		.populate({
			path: 'battle',
			populate: {path: 'contest'},
		})
		.exec();

	if (turn === null) {
		res.sendStatus(404);
		return;
	}

	if (turn.battle.contest.id !== req.params.contest) {
		res.redirect(
			`/contests/${turn.battle.contest.id}/turns/${turn._id}`
		);
		return;
	}

	res.render('turn', {
		contest: req.contest,
		turn,
	});
};
