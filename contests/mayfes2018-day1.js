module.exports.presets = {
	random: () => Math.floor(Math.random() * 5).toString(),
};

module.exports.battler = async (execute) => {
	const size = 11;

	const field = new Array(size);
	for (var y = 0; y < size; y++) {
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
		soup: 0, // remaining soup
	};
	const p2 = {
		x: 10,
		y: 10,
		soup: 0,
	};

	const p = [p1, p2];

	let player = 0;
	field[p1.y][p1.x] = 1;
	field[p2.y][p2.x] = 2;

	let soup = [];

	while (state.turn <= 100) {
		// generate input
		let input = `${state.turn.toString()} ${(player + 1).toString()}\n`;
		input += `${p[0].x.toString()} ${p[0].y.toString()}\n`;
		input += `${p[1].x.toString()} ${p[1].y.toString()}\n`;
		for (var y = 0; y < size; y++) {
			input += field[y].join(' ');
			input += '\n';
		}
		input += `${soup.length.toString()}\n`;
		for (var i = 0; i < soup.length; i++) {
			var s = soup[i];
			console.log(s);
			input += `${s.x.toString()} ${s.y.toString()}\n`;
		}

		const {stdout} = await execute(input, player);
		const rawAnswer = parseInt(stdout.toString().trim());
		// move player
		switch (rawAnswer) {
			case 0:
				break;
			case 1:
				if (p[player].y - 1 > 0) {
					p[player].y -= 1;
				}
				break;
			case 2:
				if (p[player].x + 1 < size) {
					p[player].x += 1;
				}
				break;
			case 3:
				if (p[player].y + 1 < size) {
					p[player].y += 1;
				}
				break;
			case 4:
				if (p[player].x - 1 > 0) {
					p[player].x -= 1;
				}
				break;
		}

		// colorize the moved place
		const c = player + 1; // color
		const px = p[player].x; // x position of the player
		const py = p[player].y;
		if (p[player].soup > 0) {
			// if player has soup no moto
			if (px - 1 > 0) {
				field[py][px - 1] = c;
				if (py - 1 > 0) {
					field[py - 1][px - 1] = c;
				}
				if (py + 1 < size) {
					field[py + 1][px - 1] = c;
				}
			}
			if (px + 1 < size) {
				field[py][px + 1] = c;
				if (py - 1 > 0) {
					field[py - 1][px + 1] = c;
				}
				if (py + 1 < size) {
					field[py + 1][px + 1] = c;
				}
			}
			if (py - 1 > 0) {
				field[py - 1][px] = c;
			}
			if (py + 1 < size) {
				field[py + 1][px] = c;
			}
			p[player].soup -= 1;
		}
		field[py][px] = c;

		// check if soup is picked
		for (var i = 0; i < soup.length; i++) {
			var s = soup[i];
			if (p[player].x == s.x && p[player].y == s.y) {
				p[player].soup += 10;
				// remove soup
				soup = soup.filter((x) => x.x != s.x || x.y != s.y);
			}
		}

		// count each player's area
		let p1_cnt = 0;
		let p2_cnt = 0;
		for (var y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				p1_cnt += field[y][x] === 1 ? 1 : 0;
				p2_cnt += field[y][x] === 2 ? 1 : 0;
			}
		}
		state.p1_area = p1_cnt;
		state.p2_area = p2_cnt;

		// add soup to somewhere
		if (state.turn % 30 == 0) {
			const sx = Math.floor(Math.random() * size);
			const sy = Math.floor(Math.random() * size);
			soup.push({x: sx, y: sy});
		}

		// update turn and player
		state.turn += 1;
		player = player === 0 ? 1 : 0;
	}

	return {
		result: 'settled',
		winner: state.p1_area > state.p2_area ? 0 : 1,
	};
};
