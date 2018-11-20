/* eslint array-plural/array-plural: off, no-nested-ternary: off */

const seedrandom = require('seedrandom');
const assert = require('assert');
const range = require('lodash/range');
const noop = require('lodash/noop');

const deserialize = (stdin) => {
	const lines = stdin.split('\n').filter((line) => line.length > 0);
	const beams = [];
	const pawns = [];
	const targets = [];
	const field = [];

	lines.slice(2).forEach((l, y) => {
		const cells = l.split(' ');
		cells.forEach((cell, x) => {
			if (cell[0] === 'beam') {
				const beam = {position: {x, y}, type: 'beam', id: parseInt(cell.slice(1))};
				beams.push(beam);
				field.push('beam');
			} else if (cell[0] === 'pawn') {
				const pawn = {position: {x, y}, type: 'pawn', id: parseInt(cell.slice(1))};
				pawns.push(pawn);
				field.push('space');
			} else if (cell[0] === 'target') {
				const target = {position: {x, y}, type: 'target', id: parseInt(cell.slice(1))};
				targets.push(target);
				field.push('space');
			} else if (cell[0] === '#') {
				field.push('block');
			} else if (cell[0] === '*') {
				field.push('beam');
			} else {
				assert(cell[0] === '.');
				field.push('space');
			}
		});
	});

	const [width, height] = lines[0].split(' ');

	return {
		turn: lines[1][0],
		width: parseInt(width),
		height: parseInt(height),
		beams,
		pawns,
		targets,
		field,
	};
};

module.exports.deserialize = deserialize;

module.exports.presets = {
	random: (stdin) => {
		const state = deserialize(stdin);
		let r = Math.floor(Math.random() * 4);
		const direction = r === 0 ? 'u'
			: r === 1 ? 'l'
				: r === 2 ? 'd'
					: 'r';
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

module.exports.battler = async (execute, params, {onFrame = noop, initState} = {}) => {
	const random = seedrandom(params.seed || 'hoge');
	const getXY = (index) => ({
		x: index % params.width,
		y: Math.floor(index / params.width),
	});
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

	const initialState = initState || (() => {
		const field = Array(params.width * params.height).fill().map(() => (
			random() < 0.1 ? 'block' : 'space'
		));
		const targets = sampleSize(range(params.width * params.height).filter((position) => (
			field[position] === 'space'
		)), params.targets).map((position, index) => ({
			position,
			id: index,
		}));
		const pawns = sampleSize(range(params.width * params.height).filter((position) => (
			field[position] === 'space' &&
			targets.every((target) => target.position !== position)
		)), params.pawns).map((position, index) => ({
			position,
			id: index,
		}));
		const beams = sampleSize(range(params.width * params.height).filter((position) => (
			field[position] === 'space' &&
			targets.every((target) => target.position !== position) &&
			pawns.every((target) => target.position !== position)
		)), params.pawns).map((position, index) => ({
			position,
			id: index,
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
			width: params.width,
			height: params.height,
		};
	})();
	console.log(initialState);
};
module.exports.battler(noop, {
	width: 10,
	height: 10,
	beams: 1,
	targets: 1,
	pawns: 1,
});

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

module.exports.matchConfigs = [
	{
		config: 'default',
		players: [0, 1],
	},
];

module.exports.judgeMatch = (results) => results[0];
