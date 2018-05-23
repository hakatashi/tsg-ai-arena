const MarkdownIt = require('markdown-it');
const Contest = require('../models/Contest');
const User = require('../models/User');
const Submission = require('../models/Submission');
const contests = require('../contests');

/*
 * Middleware for all /contest/:contest routes
 */
module.exports.base = async (req, res, next) => {
	const contest = await Contest.findOne({id: req.params.contest});

	if (!contest) {
		res.sendStatus(404);
		return;
	}

	req.contest = contest;
	req.contestData = contests[contest.id];
	next();
};

/*
 * GET /
 * Home page.
 */
module.exports.index = async (req, res) => {
	const markdown = new MarkdownIt();

	const presets = await Submission.find({
		contest: req.contest,
		isPreset: true,
	});

	res.render('contest', {
		title: '',
		contest: req.contest,
		description: {
			ja: markdown.render(req.contest.description.ja),
			en: markdown.render(req.contest.description.en),
		},
		presets,
	});
};

module.exports.postContest = async (req, res) => {
	if (!req.user.admin) {
		res.sendStatus(403);
		return;
	}

	req.contest.description.ja = req.body.description_ja || '';
	req.contest.description.en = req.body.description_en || '';
	await req.contest.save();

	res.redirect(`/contests/${req.contest.id}/admin`);
};

/*
 * GET /contest/:contest/admin
 */
module.exports.getAdmin = async (req, res) => {
	if (!req.user.admin) {
		res.sendStatus(403);
		return;
	}

	const users = await User.find();

	res.render('admin', {
		contest: req.contest,
		users,
	});
};
