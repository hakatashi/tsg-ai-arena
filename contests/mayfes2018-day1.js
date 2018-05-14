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
		turn: 1,
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

    var p = [p1, p2];

    var player = 0;
    field[p1.y][p1.x] = 1;
    field[p2.y][p2.x] = 2;

	while (state.turn <= 100) {
        var input = state.turn.toString() + " " + (player+1).toString() + "\n";
        input += p[0].x.toString() + " " + p[0].y.toString() + "\n";
        input += p[1].x.toString() + " " + p[1].y.toString() + "\n";
        for(var y=0; y<size; y++) {
            input += field[y].join(" ");
            input += "\n";
        }
        input += "0\n";

		const {stdout} = await execute(input, player);
        const rawAnswer = parseInt(stdout.toString().trim());
        switch(rawAnswer) {
            case 0:
                break;
            case 1:
                if(p[player].y - 1 > 0) {
                    p[player].y -= 1;
                }
                break;
            case 2:
                if(p[player].x + 1 < size) {
                    p[player].x += 1;
                }
                break;
            case 3:
                if(p[player].y + 1 < size) {
                    p[player].y += 1;
                }
                break;
            case 4:
                if(p[player].x - 1 > 0) {
                    p[player].x -= 1;
                }
                break;
        }
        field[p[player].y][p[player].x] = player+1;

        state.turn += 1;
        player = player === 0 ? 1 : 0;
        var p1_cnt = 0;
        var p2_cnt = 0;
        for(var y=0; y<size; y++) {
            for(var x=0; x<size; x++) {
                p1_cnt += field[y][x] === 1 ? 1 : 0;
                p2_cnt += field[y][x] === 2 ? 1 : 0;
            }
        }
        state.p1_area = p1_cnt;
        state.p2_area = p2_cnt;
	}

	return {
		result: 'settled',
		winner: state.p1_area > state.p2_area ? 0 : 1,
	};
};
