const Promise = require('bluebird');
const stream = require('stream');
const Battle = require('../models/Battle');
const Turn = require('../models/Turn');
const docker = require('../engines/docker');
const contests = require('../contests');
const {createLineDrainer} = require('../lib/utils.js');

class ProgramAlreadyExitedError extends Error {
	constructor(...args) {
		super(...args);
		this.name = 'ProgramAlreadyExitedError';
	}
}

module.exports.battle = (players, contest, user) => {
	const battle = new Battle({
		contest,
		players,
		result: 'pending',
		winner: null,
		user,
	});

	const battleSavePromise = battle.save();
	const {battler, presets} = contests[contest.id];

	(async () => {
		const playerFunctions = await Promise.mapSeries(
			players,
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
					console.log('stderr:', stderr.toString());
				});

				const drain = createLineDrainer(stdoutStream);

				const execute = (stdin) => {
					const inputStart = Date.now();
					stdinStream.write(stdin);

					return Promise.race([
						(async () => {
							console.log('input:', stdin);
							const stdout = await drain();
							console.log('stdout:', stdout);

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
							await deferred.promise;
							throw new ProgramAlreadyExitedError(
								stderrBuffer.toString()
							);
						})(),
					]);
				};

				return execute;
			}
		);

		await battleSavePromise;
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

		await battle.save();
	})().catch((error) => {
		console.error(error);
	});

	return battleSavePromise;
};
