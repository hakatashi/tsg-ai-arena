const Promise = require('bluebird');
const stream = require('stream');
const concatStream = require('concat-stream');
const Battle = require('../models/Battle');
const Turn = require('../models/Turn');
const Match = require('../models/Match');
const docker = require('../engines/docker');
const contests = require('../contests');
const logger = require('../lib/logger.js');
const {createLineDrainer, transaction, Deferred} = require('../lib/utils.js');

class ProgramAlreadyExitedError extends Error {
	constructor(...args) {
		super(...args);
		this.name = 'ProgramAlreadyExitedError';
	}
}

const dequeue = async () => {
	const battle = await transaction(async () => {
		const runningBattlesCount = await Battle.count({
			result: 'running',
			executedAt: {$gt: new Date(Date.now() - 60 * 1000)},
		});

		if (runningBattlesCount >= 1) {
			return null;
		}

		const battle = await Battle.findOne({
			result: 'pending',
		})
			.sort({createdAt: 1})
			.populate({
				path: 'players',
				populate: {path: 'user'},
			})
			.populate('contest')
			.populate('user')
			.populate('match')
			.exec();

		if (battle === null) {
			return null;
		}

		battle.result = 'running';
		battle.executedAt = new Date();
		await battle.save();

		return battle;
	});

	if (battle === null) {
		return;
	}

	logger.info(`Starting battle: ${battle._id}`);

	const {battler, presets, configs, matchConfigs, judgeMatch} = contests[battle.contest.id];
	const config = configs.find(({id}) => battle.config === id);

	if (config === undefined) {
		throw new Error('Invalid config');
	}

	const playerFunctions = await Promise.mapSeries(
		battle.players,
		async (player) => {
			if (player.isPreset) {
				return (stdin) => ({
					stdout: presets[player.name](stdin),
					stderr: null,
					duration: null,
				});
			}

			const stdinStream = new stream.PassThrough();

			const {stdoutStream, stderrStream, deferred} = await docker({
				id: player.language,
				code: player.code,
				stdinStream,
			});

			if (battle.contest.type === 'battle') {
				let stderrBuffer = Buffer.from('');
				stderrStream.on('data', (stderr) => {
					stderrBuffer = Buffer.concat([stderrBuffer, stderr]);
				});

				const drain = createLineDrainer(stdoutStream);

				const execute = (stdin) => {
					const inputStart = Date.now();
					stdinStream.write(stdin);

					return Promise.race([
						(async () => {
							const stdout = await drain();

							const inputEnd = Date.now();

							const stderr = stderrBuffer.toString();
							stderrBuffer = Buffer.from('');

							return {
								stdout,
								stderr,
								duration: inputEnd - inputStart,
							};
						})(),
						(async () => {
							const {error} = await deferred.promise;

							if (error) {
								throw error;
							}

							throw new ProgramAlreadyExitedError(stderrBuffer.toString());
						})(),
					]);
				};

				return execute;
			}

			const stdoutDeferred = new Deferred();
			const stderrDeferred = new Deferred();

			stdoutStream.pipe(concatStream((stdout) => {
				stdoutDeferred.resolve(stdout);
			}));
			stderrStream.pipe(concatStream((stderr) => {
				stderrDeferred.resolve(stderr);
			}));

			const execute = async (stdin) => {
				const inputStart = Date.now();
				stdinStream.end(stdin);

				const [stdout, stderr] = await Promise.all([
					stdoutDeferred.promise,
					stderrDeferred.promise,
				]);

				const inputEnd = Date.now();

				return {
					stdout,
					stderr,
					duration: inputEnd - inputStart,
				};
			};

			return execute;
		}
	);

	let turnIndex = 0;
	const seed = Math.floor(Math.random() * 1e16).toString();

	const {result, winner, scores} = await battler(async (stdin, playerIndex) => {
		const {stdout, stderr, duration, error} = await (async () => {
			try {
				const info = await playerFunctions[playerIndex](stdin);
				return info;
			} catch (e) {
				return {
					error: e,
					stdout: null,
					stderr: e.message,
					duration: null,
				};
			}
		})();

		const turn = new Turn({
			player: playerIndex,
			battle,
			index: turnIndex++,
			input: stdin,
			stdout,
			stderr,
			duration,
			...(error
				? {
					error: {
						name: error.name,
						stack: error.stack,
					},
				  }
				: {}),
		});

		await turn.save();

		return {stdout: stdout || ''};
	}, {
		...config.params,
		seed: battle.match === null ? Math.floor(Math.random() * 1e16).toString() : battle.match._id.toString(),
	});

	battle.result = result;
	battle.winner = winner;
	battle.scores = scores;
	logger.info(`Exited battle: ${battle._id}`);

	await battle.save();

	// Check if match is satisfied
	if (battle.match !== null) {
		await transaction(async () => {
			const match = await Match.findOne({_id: battle.match._id});
			if (match.result !== 'pending') {
				return;
			}

			console.log(battle.match, match);
			const battles = await Battle.find({match});
			const results = matchConfigs.map((matchConfig, index) => {
				const battle = battles.find(({configIndex}) => (
					configIndex === index
				));

				if (!battle) {
					console.trace('ERROR: battle not found');
					return {
						result: 'draw',
						winner: null,
						scores: [0, 0],
					};
				}

				return {
					result: battle.result,
					winner: battle.winner === null ? null : matchConfig.players[battle.winner],
					scores: battle.scores,
				};
			});

			if (results.some(({result}) => ['pending', 'running'].includes(result))) {
				return;
			}

			const matchResult = judgeMatch(results);

			match.result = matchResult.result;
			match.winner = matchResult.winner;
			match.scores = matchResult.scores;

			await match.save();
		});
	}

	dequeue();
};

module.exports.dequeue = dequeue;

module.exports.enqueue = async ({players, contest, user, config, configIndex, match = null}) => {
	const battle = new Battle({
		contest,
		players,
		result: 'pending',
		winner: null,
		scores: players.map(() => null),
		user,
		config,
		configIndex,
		match,
	});
	await battle.save();
	dequeue();
	return battle;
};
