module.exports.presets = {
	random: () => (Math.floor(Math.random() * 5)).toString(),
};

module.exports.battler = async (execute) => {
    const size = 11;

    var field = new Array(size)
    for(var y=0; y<size; y++) {
        field[y] = new Array(size).fill(0);
    }

	const state = {
		turn: 0,
        p1_area: 0,
        p2_area: 0,
	};
	const p1 = {
        x: 0,
        y: 0,
        soup: 0,
	};
	const p2 = {
        x: 10,
        y: 10,
        soup: 0,
	};

    var player = 1;

	while (state.turn <= 100) {
        var input = state.turn.toString() + " " + player.toString() + "\n";
        input += p1.x.toString() + " " + p1.y.toString() + "\n";
        input += p2.x.toString() + " " + p2.y.toString() + "\n";
        for(var y=0; y<size; y++) {
            input += field[y].join(" ");
            input += "\n";
        }
        input += "0\n";

		const {stdout} = await execute(input, state.turn);

        turn += 1;
        player = player === 1 ? 2 : 1;
	}

	return {
		result: 'settled',
		winner: state.turn === 0 ? 1 : 0,
	};
};
