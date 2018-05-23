const Submission = require('../models/Submission');
const User = require('../models/User');
const Battle = require('../models/Battle');
const qs = require('querystring');

/*
 * GET /submissions
 */
module.exports.getSubmissions = async (req, res) => {
	const query = {
		contest: req.contest,
		isPreset: false,
	};

	if (req.query.author) {
		const author = await User.findOne({
			email: `${req.query.author}@twitter.com`,
		});
		if (author) {
			query.user = author._id;
		}
	}

	const page = parseInt(req.query && req.query.page) || 0;

	if (req.query.status) {
		query.status = req.query.status;
	}

	const submissions = await Submission.find(query)
		.sort({_id: -1})
		.populate('user')
		.skip(500 * page)
		.limit(500)
		.exec();

	const totalSubmissions = await Submission.find(query)
		.count()
		.exec();

	res.render('submissions', {
		contest: req.contest,
		title: 'Submissions',
		submissions,
		page,
		query: req.query || {},
		totalPages: Math.ceil(totalSubmissions / 500),
		encode: qs.encode,
	});
};

/*
 * GET /submissions/:submission
 */
module.exports.getSubmission = async (req, res) => {
	const _id = req.params.submission;

	const submission = await Submission.findOne({_id})
		.populate('user')
		.populate('contest')
		.exec();

	if (submission === null) {
		res.sendStatus(404);
		return;
	}

	if (submission.contest.id !== req.params.contest) {
		res.redirect(
			`/contests/${submission.contest.id}/submissions/${submission._id}`
		);
		return;
	}

	const battles = await Battle.find({players: submission})
		.populate({
			path: 'players',
			populate: {path: 'user'},
		})
		.exec();

	res.render('submission', {
		contest: req.contest,
		title: `Submission by ${submission.user.name()}`,
		submission,
		battles,
	});
};

module.exports.getOldSubmission = async (req, res) => {
	const _id = req.params.submission;

	const submission = await Submission.findOne({_id})
		.populate('contest')
		.exec();

	if (submission === null) {
		res.sendStatus(404);
		return;
	}

	res.redirect(
		`/contests/${submission.contest.id}/submissions/${submission._id}`
	);
};
