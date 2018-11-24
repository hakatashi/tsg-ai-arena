const Submission = require('../models/Submission');
const User = require('../models/User');
const Battle = require('../models/Battle');
const Match = require('../models/Match');
const runner = require('../lib/runner');
const {getCodeLimit, transaction} = require('../lib/utils');
const assert = require('assert');
const concatStream = require('concat-stream');
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

module.exports.postSubmission = async (req, res) => {
	try {
		if (!req.contest.isOpen() && !req.user.admin) {
			throw new Error('Competition has closed');
		}

		if (
			!['node', 'c-gcc', 'python3', 'cpp-clang', 'ruby'].includes(
				req.body.language
			)
		) {
			throw new Error('language unknown');
		}

		if (req.contest.type === 'battle' && !req.contestData.configs.some(({id}) => id === req.body.config)) {
			throw new Error('Invalid config');
		}

		const competitor = req.contest.type === 'battle' && await Submission.findOne({
			contest: req.contest,
			isPreset: true,
			name: req.body.competitor,
		});

		if (req.contest.type === 'battle' && !competitor) {
			throw new Error('competitor unknown');
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
			latestSubmission.createdAt > Date.now() - 15 * 1000
		) {
			throw new Error('Submission interval is too short');
		}

		const submission = await transaction(async () => {
			const latestIdSubmission = await Submission.findOne({
				contest: req.contest,
			})
				.sort({id: -1})
				.exec();

			const submissionRecord = new Submission({
				isPreset: false,
				name: null,
				user: req.user._id,
				contest: req.contest,
				language: req.body.language,
				code,
				size: code.length,
				id: (latestIdSubmission ? latestIdSubmission.id || 0 : 0) + 1,
			});

			return submissionRecord.save();
		});

		if (req.contest.type === 'battle') {
			await runner.enqueue({
				players: req.contest.type === 'battle' ? [submission, competitor] : [submission],
				contest: req.contest,
				user: req.user,
				config: req.body.config,
			});

			res.redirect(`/contests/${req.contest.id}/submissions/${submission._id}`);
			return;
		}

		const match = new Match({
			contest: req.contest,
			players: [submission],
			result: 'pending',
			winner: null,
			scores: [null],
			user: req.user,
		});
		await match.save();

		for (const [index, matchConfig] of req.contestData.matchConfigs.entries()) {
			const config = req.contestData.configs.find(({id}) => matchConfig.config === id);

			await runner.enqueue({
				players: [submission],
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
