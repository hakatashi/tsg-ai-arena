const MarkdownIt = require('markdown-it');
const Contest = require('../models/Contest');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Language = require('../models/Language');
const validation = require('../lib/validation');
const qs = require('querystring');
const {getCodeLimit} = require('../controllers/utils');
const assert = require('assert');
const concatStream = require('concat-stream');

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
	next();
};

/*
 * GET /
 * Home page.
 */
module.exports.index = (req, res) => {
	res.render('contest', {
		title: '',
		contest: req.contest,
	});
};

module.exports.rule = (req, res) => {
	const markdown = new MarkdownIt();
	res.render('rule', {
		contest: req.contest,
		title: 'Rule',
		description: {
			ja: markdown.render(req.contest.description.ja),
			en: markdown.render(req.contest.description.en),
		},
	});
};

module.exports.postSubmission = async (req, res) => {
	try {
		if (!req.contest.isOpen()) {
			throw new Error('Competition has closed');
		}

		let code = null;

		if (req.files && req.files.file && req.files.file.length === 1) {
			assert(
				req.files.file[0].size < getCodeLimit(req.body.language),
				'Code cannot be longer than 10,000 bytes'
			);
			code = await new Promise((resolve) => {
				const stream = concatStream(resolve);
				req.files.file[0].stream.pipe(stream);
			});
		} else {
			code = Buffer.from(req.body.code.replace(/\r\n/g, '\n'), 'utf8');
		}

		assert(code.length >= 1, 'Code cannot be empty');
		assert(
			code.length <= getCodeLimit(req.body.language),
			'Code cannot be longer than 10,000 bytes'
		);

		const latestSubmission = await Submission.findOne({user: req.user})
			.sort({createdAt: -1})
			.exec();
		if (
			latestSubmission !== null &&
			latestSubmission.createdAt > Date.now() - 5 * 1000
		) {
			throw new Error('Submission interval is too short');
		}
		console.log(Submission);
		const submissionRecord = new Submission({
			user: req.user._id,
			contest: req.contest,
			language: 'node',
			code,
			size: code.length,
		});
		console.log('ao');

		const submission = await submissionRecord.save();
		console.log(submission);

		res.redirect(`/contests/${req.contest.id}/submissions/${submission._id}`);
	} catch (error) {
		// eslint-disable-next-line callback-return
		res.status(400).json({error: error.message});
	}
};

/*
 * GET /contest/:contest/admin
 */
module.exports.getAdmin = async (req, res) => {
	if (!req.user.admin) {
		res.sendStatus(403);
		return;
	}

	if (req.query.user && req.query.team) {
		const user = await User.findOne({_id: req.query.user});
		user.setTeam(req.contest, req.query.team);
		await user.save();
		res.redirect(`/contests/${req.params.contest}/admin`);
		return;
	}

	const users = await User.find();

	res.render('admin', {
		contest: req.contest,
		users,
		teams: ['Red', 'Blue', 'Green'],
		colors: ['#ef2011', '#0e30ec', '#167516'],
		qs,
	});
};
