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
		id: 'default',
		name: 'Default',
		params: {
			stones: 24,
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
