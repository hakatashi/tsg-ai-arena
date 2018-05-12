const Battle = require('../models/Battle');
const Turn = require('../models/Turn');
const docker = require('../engines/docker');
const contests = require('../contests');

module.exports.battle = (players, contest) => {
	const battle = new Battle({
		contest,
		players,
		result: 'pending',
		winner: null,
	});

	const battleSavePromise = battle.save();

	(async () => {
		await battleSavePromise;
		const {battler, presets} = contests[contest.id];
		let turnIndex = 0;

		const {result, winner} = await battler(async (stdin, playerIndex) => {
			const player = players[playerIndex];

			let stdout = null;
			let stderr = null;
			let duration = null;
			let error = null;

			if (player.isPreset) {
				const preset = presets[player.name];
				stdout = preset(stdin);
			} else {
				try {
					const info = await docker({
						id: player.language,
						code: player.code,
						stdin,
					});
					stdout = info.stdout;
					stderr = info.stderr;
					duration = info.duration;
				} catch (e) {
					error = e;
					stdout = '';
					stderr = '';
					duration = '';
				}
			}

			const turn = new Turn({
				player: playerIndex,
				battle,
				index: turnIndex++,
				input: stdin,
				stdout,
				stderr,
				duration,
				...(error ? {
					error: {
						name: error.name,
						stack: error.stack,
					},
				} : {}),
			});

			await turn.save();

			return {stdout};
		});

		battle.result = result;
		battle.winner = winner;

		await battle.save();
	})().catch((error) => {
		console.error(error);
	});

	return battleSavePromise;
};
