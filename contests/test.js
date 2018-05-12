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

module.exports.battler = async (execute) => {
	const state = {
		stones: 24,
		turn: 0,
	};

	while (state.stones >= 1) {
		const {stdout} = await execute(state.stones.toString(), state.turn);

		const rawAnswer = parseInt(stdout.toString().trim());
		const answer = [1, 2, 3].includes(rawAnswer) ? rawAnswer : 3;

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
