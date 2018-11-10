const Promise = require('bluebird');
const stream = require('stream');
const Battle = require('../models/Battle');
const Turn = require('../models/Turn');
const docker = require('../engines/docker');
const contests = require('../contests');
const logger = require('../lib/logger.js');
const {createLineDrainer} = require('../lib/utils.js');

class ProgramAlreadyExitedError extends Error {
	constructor(...args) {
		super(...args);
		this.name = 'ProgramAlreadyExitedError';
	}
}

const dequeue = async () => {
	const runningBattlesCount = await Battle.count({
		result: 'running',
		executedAt: {$gt: new Date(Date.now() - 60 * 1000)},
	});

	if (runningBattlesCount >= 1) {
		return;
	}

	// FIXME: race condition
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
		.exec();

	if (battle === null) {
		return;
	}

	battle.result = 'running';
	battle.executedAt = new Date();
	await battle.save();

	logger.info(`Starting battle: ${battle._id}`);

	const {battler, presets} = contests[battle.contest.id];

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
	);

	let turnIndex = 0;

	const {result, winner} = await battler(async (stdin, playerIndex) => {
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
	});

	battle.result = result;
	battle.winner = winner;
	logger.info(`Exited battle: ${battle._id}`);

	await battle.save();

	dequeue();
};

module.exports.dequeue = dequeue;

module.exports.enqueue = async (players, contest, user) => {
	const battle = new Battle({
		contest,
		players,
		result: 'pending',
		winner: null,
		user,
	});
	await battle.save();
	dequeue();
	return battle;
};
