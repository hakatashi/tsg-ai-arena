const assert = require('assert');
const countBy = require('lodash/countBy');

module.exports.presets = {
	random: () => (Math.floor(Math.random() * 3) + 1).toString(),
	clever: (stdin) => {
		const stones = parseInt(stdin);

		if ((stones - 1) % 4 === 0) {
			return (Math.floor(Math.random() * 3) + 1).toString();
		}

		return ((stones - 1) % 4).toString();
	},
};

const normalize = (stdout) => {
	const rawAnswer = parseInt(stdout.toString().trim());
	const answer = [1, 2, 3].includes(rawAnswer) ? rawAnswer : 3;
	return answer;
};

module.exports.normalize = normalize;

module.exports.battler = async (execute, params) => {
	const state = {
		stones: params.stones,
		turn: 0,
	};

	while (state.stones >= 1) {
		const {stdout} = await execute(`${state.stones.toString()}\n`, state.turn);

		const answer = normalize(stdout);

		state.stones -= answer;
		if (state.stones >= 1) {
			state.turn = state.turn === 0 ? 1 : 0;
		}
	}

	return {
		result: 'settled',
		winner: state.turn === 0 ? 1 : 0,
	};
};

module.exports.configs = [
	{
		default: true,
		id: 'small',
		name: '24 Stones',
		params: {
			stones: 24,
		},
	},
	{
		id: 'medium',
		name: '50 stones',
		params: {
			stones: 50,
		},
	},
	{
		id: 'big',
		name: '100 stones',
		params: {
			stones: 100,
		},
	},
];

module.exports.matchConfigs = [
	{
		config: 'small',
		players: [0, 1],
	},
	{
		config: 'medium',
		players: [0, 1],
	},
	{
		config: 'big',
		players: [0, 1],
	},
];

module.exports.judgeMatch = (results) => {
	const wins = [0, 1].map((player) => countBy(results, (result) => result.winner === player));
	assert(wins[0] !== wins[1]);

	return {
		result: 'settled',
		winner: wins[0] > wins[1] ? 0 : 1,
	};
};
