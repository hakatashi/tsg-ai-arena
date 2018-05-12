const MarkdownIt = require('markdown-it');
const Contest = require('../models/Contest');
const User = require('../models/User');
const Submission = require('../models/Submission');
const runner = require('../lib/runner');
const contests = require('../contests');
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
	req.contestData = contests[contest.id];
	next();
};

/*
 * GET /
 * Home page.
 */
module.exports.index = (req, res) => {
	const markdown = new MarkdownIt();
	res.render('contest', {
		title: '',
		contest: req.contest,
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

		if (!['node', 'c-gcc', 'python3'].includes(req.body.language)) {
			throw new Error('language unknown');
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

		const submissionRecord = new Submission({
			isPreset: false,
			name: null,
			user: req.user._id,
			contest: req.contest,
			language: req.body.language,
			code,
			size: code.length,
		});

		const submission = await submissionRecord.save();

		for (const presetName of Object.keys(req.contestData.presets)) {
			const preset = await Submission.findOne({contest: req.contest, name: presetName});
			runner.battle([submission, preset], req.contest).catch((e) => {
				console.error(e);
			});
		}

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
