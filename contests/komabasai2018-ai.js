/* eslint array-plural/array-plural: off, no-nested-ternary: off */

const seedrandom = require('seedrandom');
const assert = require('assert');
const range = require('lodash/range');
const noop = require('lodash/noop');
const sum = require('lodash/sum');

const deserialize = (stdin) => {
	const lines = stdin.split('\n').filter((line) => line.length > 0);
	const beams = [];
	const pawns = [];
	const targets = [];
	const field = [];

	const [width, height] = lines[0].split(' ').map((token) => parseInt(token));

	lines.slice(2).forEach((l, y) => {
		const cells = l.split(' ');
		cells.forEach((cell, x) => {
			if (cell[0] === 'b') {
				const beam = {
					position: y * width + x,
					type: 'beam',
					id: parseInt(cell.slice(1)),
				};
				beams.push(beam);
				field.push('beam');
			} else if (cell[0] === 'p') {
				const pawn = {
					position: y * width + x,
					type: 'pawn',
					id: parseInt(cell.slice(1)),
				};
				pawns.push(pawn);
				field.push('empty');
			} else if (cell[0] === 't') {
				const target = {
					position: y * width + x,
					type: 'target',
					id: parseInt(cell.slice(1)),
				};
				targets.push(target);
				field.push('empty');
			} else if (cell === '*') {
				field.push('block');
			} else if (cell === 'x') {
				field.push('beam');
			} else {
				assert(cell === '.');
				field.push('empty');
			}
		});
	});

	return {
		state: {
			turn: lines[1][0],
			beams,
			pawns,
			targets,
			field,
		},
		params: {
			width,
			height,
		},
	};
};

module.exports.deserialize = deserialize;

const serialize = ({state, params}) => `${[
	`${params.width} ${params.height}`,
	state.turn,
	...range(params.height).map((y) => range(params.width)
		.map((x) => {
			const position = y * params.width + x;

			const target = state.targets.find((t) => t.position === position);
			if (target) {
				return `t${target.id}`;
			}

			const pawn = state.pawns.find((p) => p.position === position);
			if (pawn) {
				return `p${pawn.id}`;
			}

			const beam = state.beams.find((b) => b.position === position);
			if (beam) {
				return `b${beam.id}`;
			}

			if (state.field[position] === 'block') {
				return '*';
			}

			if (state.field[position] === 'beam') {
				return 'x';
			}

			assert(state.field[position] === 'empty');
			return '.';
		})
		.join(' ')),
].join('\n')}\n`;

module.exports.serialize = serialize;

const deltas = new Map([
	['u', {x: 0, y: -1}],
	['l', {x: -1, y: 0}],
	['d', {x: 0, y: 1}],
	['r', {x: 1, y: 0}],
]);

module.exports.presets = {
	random: (stdin) => {
		const state = deserialize(stdin);
		let r = Math.floor(Math.random() * 4);
		const direction = r === 0 ? 'u' : r === 1 ? 'l' : r === 2 ? 'd' : 'r';
		if (state.turn === 'A') {
			const size = state.beams.length + state.pawns.length;
			const r = Math.floor(Math.random() * size);
			if (r < state.beams.length) {
				return `${state.beams[r].id} ${direction}`;
			}
			return `${state.pawns[r - state.beams.length].id} ${direction}`;
		}
		r = Math.floor(Math.random() * state.targets.length);
		return `${state.targets[r].id} ${direction}`;
	},
};

module.exports.battler = async (
	execute,
	params,
	{onFrame = noop, initState} = {}
) => {
	const random = seedrandom(params.seed || 'hoga');
	const getXY = (index) => ({
		x: index % params.width,
		y: Math.floor(index / params.width),
	});
	const inField = ({x, y}) => x >= 0 && x < params.width && y >= 0 && y < params.height;
	const sampleSize = (items, size) => {
		const clones = items.slice();
		for (const index of Array(size).keys()) {
			const target = Math.floor(random() * (clones.length - index)) + index;
			const temp = clones[target];
			clones[target] = clones[index];
			clones[index] = temp;
		}
		return clones.slice(0, size);
	};

	const initialState =
		initState ||
		(() => {
			const field = Array(params.width * params.height)
				.fill()
				.map(() => (random() < 0.2 ? 'block' : 'empty'));
			const beams = sampleSize(
				range(params.width * params.height).filter(
					(position) => field[position] === 'empty'
				),
				params.beams
			).map((position, index) => ({
				position,
				type: 'beam',
				id: index,
			}));

			const pawns = sampleSize(
				range(params.width * params.height).filter(
					(position) => field[position] === 'empty' &&
						beams.every((beam) => beam.position !== position)
				),
				params.pawns
			).map((position, index) => ({
				position,
				type: 'pawn',
				id: index + params.beams,
			}));

			const targets = sampleSize(
				range(params.width * params.height).filter(
					(position) => field[position] === 'empty' &&
						beams.every((beam) => beam.position !== position) &&
						pawns.every((pawn) => pawn.position !== position)
				),
				params.targets
			).map((position, index) => ({
				position,
				type: 'taget',
				id: index + params.beams + params.pawns,
			}));

			for (const beam of beams) {
				field[beam.position] = 'beam';
			}

			return {
				turn: 'D',
				field,
				targets,
				pawns,
				beams,
			};
		})();

	const state = {
		...deserialize(serialize({state: initialState, params})).state,
		turns: 0,
	};

	while (state.turns < 300) {
		const {stdout} = await execute(
			serialize({state, params}),
			state.turn === 'A' ? 0 : 1
		);
		const tokens = stdout
			.toString()
			.trim()
			.split(/\s+/);
		const id = parseInt(tokens[0]) || 0;
		const direction = deltas.has(tokens[1]) ? tokens[1] : 'u';

		let robot = [...state.beams, ...state.pawns, ...state.targets].find(
			(obj) => obj.id === id
		);

		if (
			state.turn === 'A' &&
			(robot === undefined || !['beam', 'pawn'].includes(robot.type))
		) {
			robot = state.beams[0];
		}

		if (
			state.turn === 'D' &&
			(robot === undefined || robot.type !== 'target')
		) {
			robot = state.targets[0];
		}

		const delta = deltas.get(direction);
		const position = getXY(robot.position);

		while (1) {
			const newX = position.x + delta.x;
			const newY = position.y + delta.y;

			if (!inField({x: newX, y: newY})) {
				break;
			}

			const newIndex = newY * params.width + newX;
			if (state.field[newIndex] === 'block') {
				break;
			}
			if (robot.type === 'target' && state.field[newIndex] === 'beam') {
				break;
			}
			if (
				[
					...state.beams,
					...state.pawns,
					...(robot.type === 'beam' ? [] : state.targets),
				].some((o) => o.position === newIndex)
			) {
				break;
			}

			position.x = newX;
			position.y = newY;

			if (robot.type === 'beam') {
				state.field[newIndex] = 'beam';
				state.targets = state.targets.filter(
					(target) => target.position !== newIndex
				);
			}
		}

		robot.position = position.y * params.width + position.x;

		onFrame({state});

		state.turn = state.turn === 'D' ? 'A' : 'D';
		state.turns++;

		if (state.targets.length === 0) {
			break;
		}
	}

	return {
		result: 'draw',
		winner: null,
		scores: [state.turns, 0],
	};
};

module.exports.configs = [
	{
		default: true,
		id: 'default',
		name: 'Default',
		params: {
			width: 10,
			height: 10,
			beams: 1,
			targets: 1,
			pawns: 1,
		},
	},
];

const matchConfigs = [
	{
		config: 'default',
		players: [0, 1],
	},
	{
		config: 'default',
		players: [1, 0],
	},
];

module.exports.matchConfigs = matchConfigs;

module.exports.judgeMatch = (results) => {
	const score1 = sum(
		results.map(
			(result, index) => result.scores[matchConfigs[index].players[0]]
		)
	);
	const score2 = sum(
		results.map(
			(result, index) => result.scores[matchConfigs[index].players[1]]
		)
	);

	if (score1 === score2) {
		return {
			result: 'draw',
			winner: null,
			scores: [score1, score2],
		};
	}

	return {
		result: 'settled',
		winner: score1 > score2 ? 1 : 0,
		scores: [score1, score2],
	};
};
