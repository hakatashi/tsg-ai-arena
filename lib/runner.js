const Battle = require('../models/Battle');
const Turn = require('../models/Turn');
const docker = require('../engines/docker');

module.exports.battle = async (players, contest) => {
	const battle = new Battle({
		contest,
		players,
		result: 'pending',
		winner: null,
	});

	await battle.save().catch((e) => console.log(e));

	const state = {
		turns: 0,
		index: 0,
		hands: [],
	};

	while (state.turns < 5) {
		state.turns++;

		const lines = [
			state.turns.toString(),
			...state.hands.map((hands) => hands.map((hand) => hand === null ? '-1' : hand.toString()).join(' ')),
		];

		const stdin = lines.join('\n');

		const {stdout, stderr, duration} = await docker({
			id: 'node',
			code: players[0].code,
			stdin,
		});

		const turn1 = new Turn({
			submission: players[0],
			battle,
			index: state.index++,
			input: stdin,
			stdout,
			stderr,
			duration,
		});

		await turn1.save();

		const answer1 = (() => {
			switch (stdout.toString().trim()) {
				case '0': {
					return 0;
				}
				case '1': {
					return 1;
				}
				case '2': {
					return 2;
				}
				default: {
					return null;
				}
			}
		})();

		const answer2 = Math.floor(Math.random() * 3);

		const turn2 = new Turn({
			submission: players[1],
			battle,
			index: state.index++,
			input: stdin,
			stdout: answer2.toString(),
			stderr: '',
			duration: 0,
		});

		await turn2.save();

		state.hands.push([answer1, answer2]);
	}

	let wins = 0;
	let loses = 0;

	for (const [handA, handB] of state.hands) {
		if (handA === handB) {
			continue;
		}

		if (handA === null) {
			loses++;
			continue;
		}

		if (handB === null) {
			wins++;
			continue;
		}

		if ((handA === 0 && handB === 1) || (handA === 1 && handB === 2) || (handA === 2 && handB === 0)) {
			wins++;
			continue;
		}

		loses++;
	}

	if (wins === loses) {
		battle.result = 'draw';
	} else {
		battle.result = 'settled';
		if (wins > loses) {
			battle.winner = players[0];
		} else {
			battle.winner = players[1];
		}
	}

	await battle.save();
};
