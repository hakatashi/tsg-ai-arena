/* eslint array-plural/array-plural: off */

const random = require('lodash/random');
const transpose = require('lodash/unzip');
const noop = require('lodash/noop');
const maxBy = require('lodash/maxBy');
const clamp = require('lodash/clamp');

const SIZE = 10;

const serialize = (state) => [state.turns, ...transpose(state.field).map((row) => row.join(' '))].join(
	'\n'
);

module.exports.serialize = serialize;

const deserialize = (stdin) => {
	const lines = stdin.split('\n');

	return {
		turns: parseInt(lines[0]),
		field: transpose(
			lines
				.slice(1)
				.map((column) => column.split(' ').map((value) => parseInt(value)))
		),
	};
};

module.exports.deserialize = deserialize;

module.exports.presets = {
	random: () => `${random(1, SIZE)} ${random(1, SIZE)} ${random(0, 1)}`,
	fill: (input) => {
		const state = deserialize(input);

		if (state.turns % 10 === 0) {
			return `1 ${state.turns / 10 * 3 + 2} 1`;
		}

		const index = state.turns % 10 - 1;

		return `${(index % 3) * 3 + 3} ${Math.floor(index / 3) +
			Math.floor(state.turns / 10) * 3 +
			1} 0`;
	},
};

module.exports.battler = async (execute, {onFrame = noop, initState} = {}) => {
	const initialState = initState || {
		turns: 0,
		field: Array(SIZE)
			.fill()
			.map(() => Array(SIZE).fill(0)),
	};

	const state = {
		...deserialize(serialize(initialState)),
		points: [0, 0],
	};

	for (const turns of Array(20).keys()) {
		state.turns = turns;

		const stdin1 = serialize(state);
		const stdin2 = serialize({
			turns: state.turns,
			field: state.field.map((column) => column.map((v) => -v)),
		});

		const {stdout: stdout1} = await execute(stdin1, 0);
		const {stdout: stdout2} = await execute(stdin2, 1);

		const outputs = [];

		const changes = [];

		for (const [playerIndex, stdout] of [stdout1, stdout2].entries()) {
			const tokens = stdout
				.toString()
				.trim()
				.split(/\s+/);

			const {x, y, rot} = (() => {
				if (tokens.length !== 3) {
					return {x: 5, y: 5, rot: 0};
				}

				const [nx, ny, nrot] = tokens.map((token) => parseInt(token));

				if (
					nx < 1 ||
					nx > SIZE ||
					ny < 1 ||
					ny > SIZE ||
					nrot < 0 ||
					nrot > 1
				) {
					return {x: 5, y: 5, rot: 0};
				}

				return {x: nx, y: ny, rot: nrot};
			})();

			outputs.push({x, y, rot});

			if (rot === 0) {
				for (const dx of [-1, 0, 1]) {
					if (x + dx >= 1 && x + dx <= SIZE) {
						changes.push({x: x + dx - 1, y: y - 1, playerIndex});
					}
				}
			} else {
				for (const dy of [-1, 0, 1]) {
					if (y + dy >= 1 && y + dy <= SIZE) {
						changes.push({x: x - 1, y: y + dy - 1, playerIndex});
					}
				}
			}
		}

		const dupCells = new Set();

		for (const {x, y, playerIndex} of changes) {
			if (changes.filter((change) => change.x === x && change.y === y).length > 1) {
				dupCells.add(x * 3 + y);
			}

			if (playerIndex === 0) {
				if (state.field[x][y] >= 0) {
					state.field[x][y]++;
				} else {
					state.field[x][y] = Math.max(0, state.field[x][y] - 2);
				}
			} else {
				if (state.field[x][y] <= 0) {
					state.field[x][y]--;
				} else {
					state.field[x][y] = Math.min(0, state.field[x][y] + 2);
				}
			}
		}

		for (const cell of dupCells) {
			const x = Math.floor(cell / 3);
			const y = cell % 3;
			if (state.field[x][y] > 0) {
				state.field[x][y] = Math.max(0, state.field[x][y] - 1);
			} else if (state.field[x][y] < 0) {
				state.field[x][y] = Math.min(0, state.field[x][y] + 1);
			}
		}

		for (const x of Array(SIZE).keys()) {
			for (const y of Array(SIZE).keys()) {
				state.field[x][y] = clamp(state.field[x][y], -3, 3);
			}
		}

		for (const playerIndex of [0, 1]) {
			let longestPath = 0;

			for (const y of Array(SIZE).keys()) {
				const row = state.field[y]
					.map((value) => {
						if (playerIndex === 0) {
							return value > 0 ? '1' : '0';
						}

						return value < 0 ? '1' : '0';
					})
					.join('');

				const longestRowPath = maxBy(row.split('0'), 'length');
				longestPath = Math.max(
					longestPath,
					longestRowPath ? longestRowPath.length : 0
				);
			}

			for (const x of Array(SIZE).keys()) {
				const column = transpose(state.field)
					[x].map((value) => {
						if (playerIndex === 0) {
							return value > 0 ? '1' : '0';
						}

						return value < 0 ? '1' : '0';
					})
					.join('');

				const longestColumnPath = maxBy(column.split('0'), 'length');
				longestPath = Math.max(
					longestPath,
					longestColumnPath ? longestColumnPath.length : 0
				);
			}

			state.points[playerIndex] = longestPath;
		}

		onFrame({state, outputs});
	}

	if (state.points[0] === state.points[1]) {
		return {
			result: 'draw',
			winner: null,
		};
	}

	return {
		result: 'settled',
		winner: state.points[0] > state.points[1] ? 0 : 1,
	};
};
