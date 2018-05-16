/* eslint no-loop-func: "off" */

const SIZE = 9;

module.exports.presets = {
	random: () => Math.floor(Math.random() * 4 + 1).toString(),
};

module.exports.battler = async (execute) => {
	const field = new Array(SIZE).fill().map(() => (
		new Array(SIZE).fill(0)
	));

	const state = {
		turn: 1,
		player: 0,
		p1_area: 0,
		p2_area: 0,
	};
	const player1 = {
		x: 1,
		y: 4,
		soups: 0, // remaining soups
	};
	const player2 = {
		x: 7,
		y: 4,
		soups: 0,
	};

	const players = [player1, player2];

	field[player1.y][player1.x] = 1;
	field[player2.y][player2.x] = 2;

	let soups = [];

	while (state.turn <= 100) {
		const normalizedField = state.player === 0 ? field : field.slice().reverse().map((row) => row.slice().reverse().map((cell) => {
			if (cell === 0) {
				return 0;
			}

			return cell === 1 ? 2 : 1;
		}));

		// generate input
		const input = `${[
			state.turn.toString(),
			...(state.player === 0 ? players : players.slice().reverse()).map((player) => (
				`${player.x.toString()} ${player.y.toString()}`
			)),
			...Array(SIZE).fill().map((_, y) => (
				normalizedField[y].join(' ')
			)),
			soups.length.toString(),
			...soups.map(({x, y}) => (
				`${x} ${y}`
			)),
		].join('\n')}\n`;

		const {stdout} = await execute(input, state.player);
		const rawAnswer = parseInt(stdout.toString().trim());
		const normalizedAnswer = state.player === 0 ? rawAnswer : {
			0: 0,
			1: 3,
			2: 4,
			3: 1,
			4: 2,
		}[rawAnswer];

		// move state.player
		switch (normalizedAnswer) {
			case 0:
				break;
			case 1:
				if (players[state.player].y - 1 >= 0) {
					players[state.player].y -= 1;
				}
				break;
			case 2:
				if (players[state.player].x + 1 < SIZE) {
					players[state.player].x += 1;
				}
				break;
			case 3:
				if (players[state.player].y + 1 < SIZE) {
					players[state.player].y += 1;
				}
				break;
			case 4:
				if (players[state.player].x - 1 >= 0) {
					players[state.player].x -= 1;
				}
				break;
		}

		// colorize the moved place
		const c = state.player + 1; // color

		{
			const {x, y} = players[state.player];
			if (players[state.player].soups > 0) {
				if (x - 1 >= 0) {
					field[y][x - 1] = c;
					if (y - 1 >= 0) {
						field[y - 1][x - 1] = c;
					}
					if (y + 1 < SIZE) {
						field[y + 1][x - 1] = c;
					}
				}
				if (x + 1 < SIZE) {
					field[y][x + 1] = c;
					if (y - 1 >= 0) {
						field[y - 1][x + 1] = c;
					}
					if (y + 1 < SIZE) {
						field[y + 1][x + 1] = c;
					}
				}
				if (y - 1 >= 0) {
					field[y - 1][x] = c;
				}
				if (y + 1 < SIZE) {
					field[y + 1][x] = c;
				}
				players[state.player].soups -= 1;
			}
			field[y][x] = c;
		}

		// check if soups is picked
		for (const soup of soups) {
			if (players[state.player].x === soup.x && players[state.player].y === soup.y) {
				players[state.player].soups += 10;
				// remove soups
				soups = soups.filter(({x, y}) => x !== soup.x || y !== soup.y);
			}
		}

		// count each player's area
		let p1_cnt = 0;
		let p2_cnt = 0;
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) {
				p1_cnt += field[y][x] === 1 ? 1 : 0;
				p2_cnt += field[y][x] === 2 ? 1 : 0;
			}
		}
		state.p1_area = p1_cnt;
		state.p2_area = p2_cnt;

		// add soups to somewhere
		if ([10, 40, 70].includes(state.turn)) {
			const sx = Math.floor(Math.random() * SIZE);
			const sy = Math.floor(Math.random() * SIZE);
			soups.push({x: sx, y: sy});
		}

		// update turn and state.player
		state.turn += 1;
		state.player = state.player === 0 ? 1 : 0;
	}

	if (state.p1_area === state.p2_area) {
		return {
			result: 'draw',
			winner: null,
		};
	}

	return {
		result: 'settled',
		winner: state.p1_area > state.p2_area ? 0 : 1,
	};
};
