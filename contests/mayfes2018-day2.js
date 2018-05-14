/* eslint array-plural/array-plural: off */

const random = require('lodash/random');
const transpose = require('lodash/unzip');
const noop = require('lodash/noop');
const maxBy = require('lodash/maxBy');
const clamp = require('lodash/clamp');

const SIZE = 10;

const serialize = (state) => (
	[
		state.turns,
		...transpose(state.field).map((row) => row.join(' ')),
	].join('\n')
);

module.exports.serialize = serialize;

const deserialize = (stdin) => {
	const lines = stdin.split('\n');

	return {
		turns: parseInt(lines[0]),
		field: transpose(lines.slice(1).map((column) => column.split(' ').map((value) => parseInt(value)))),
	};
};

module.exports.deserialize = deserialize;

module.exports.presets = {
	random: () => `${random(1, SIZE)} ${random(1, SIZE)} ${random(0, 1)}`,
	clever: () => '',
};

module.exports.battler = async (execute, {onFrame = noop, initState} = {}) => {
	const initialState = initState || {
		turns: 0,
		field: Array(SIZE).fill().map(() => Array(SIZE).fill(0)),
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

		for (const [playerIndex, stdout] of [stdout1, stdout2].entries()) {
			const tokens = stdout.toString().trim().split(/\s+/);

			const {x, y, rot} = (() => {
				if (tokens.length !== 3) {
					return {x: 5, y: 5, rot: 0};
				}

				const [nx, ny, nrot] = tokens.map((token) => parseInt(token));

				if (nx < 1 || nx > 10 || ny < 1 || ny > 10 || nrot < 0 || nrot > 1) {
					return {x: 5, y: 5, rot: 0};
				}

				return {x: nx, y: ny, rot: nrot};
			})();

			const increment = playerIndex === 0 ? 1 : -1;

			if (rot === 0) {
				for (const dx of [-1, 0, 1]) {
					if (x + dx >= 1 && x + dx <= 10) {
						state.field[x + dx - 1][y - 1] = clamp(state.field[x + dx - 1][y - 1] + increment, -3, 3);
					}
				}
			} else {
				for (const dy of [-1, 0, 1]) {
					if (y + dy >= 1 && y + dy <= 10) {
						state.field[x - 1][y + dy - 1] = clamp(state.field[x - 1][y + dy - 1] + increment, -3, 3);
					}
				}
			}
		}

		for (const playerIndex of [0, 1]) {
			let longestPath = 0;

			for (const y of Array(10).keys()) {
				const row = state.field[y].map((value) => {
					if (playerIndex === 0) {
						return value > 0 ? '1' : '0';
					}

					return value < 0 ? '1' : '0';
				}).join('');

				const longestRowPath = maxBy(row.split('0'), 'length').length;
				longestPath = Math.max(longestPath, longestRowPath);
			}

			for (const x of Array(10).keys()) {
				const column = transpose(state.field)[x].map((value) => {
					if (playerIndex === 0) {
						return value > 0 ? '1' : '0';
					}

					return value < 0 ? '1' : '0';
				}).join('');

				const longestColumnPath = maxBy(column.split('0'), 'length').length;
				longestPath = Math.max(longestPath, longestColumnPath);
			}

			state.points[playerIndex] = longestPath;
		}

		onFrame(state);
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
