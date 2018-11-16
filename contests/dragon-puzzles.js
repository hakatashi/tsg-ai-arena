const clamp = require('lodash/clamp');
const shuffle = require('lodash/shuffle');
const chunk = require('lodash/chunk');
const meanBy = require('lodash/meanBy');
const noop = require('lodash/noop');
const flatten = require('lodash/flatten');
const sumBy = require('lodash/sumBy');

module.exports.presets = {};

const normalize = (stdout) => {
	const lines = stdout.toString().trim().split('\n');
	const turns = chunk(lines, 2).map(([line1, line2]) => {
		let matches = null;
		if (!(matches = line1.trim().match(/^(\d+)\s+(\d+)$/))) {
			return {x: 1, y: 1, moves: []};
		}

		const x = clamp(parseInt(matches[1]) || 1, 1, Infinity);
		const y = clamp(parseInt(matches[2]) || 1, 1, Infinity);

		const moves = (line2 || '').trim().split(/\s+/).map((token) => parseInt(token)).filter((n) => [1, 2, 3, 4].includes(n));

		return {
			x,
			y,
			moves,
		};
	});
	return turns;
};

module.exports.normalize = normalize;

const moveDrop = (drops, rawX, rawY, move, {width, height}) => {
	let x = rawX - 1;
	let y = rawY - 1;
	const clonedDrops = drops.slice();

	if (move === 1 && y - 1 >= 0) {
		clonedDrops[(y - 1) * width + x] = drops[y * width + x];
		clonedDrops[y * width + x] = drops[(y - 1) * width + x];
		y--;
	} else if (move === 2 && x + 1 < width) {
		clonedDrops[y * width + x + 1] = drops[y * width + x];
		clonedDrops[y * width + x] = drops[y * width + x + 1];
		x++;
	} else if (move === 3 && y + 1 < height) {
		clonedDrops[(y + 1) * width + x] = drops[y * width + x];
		clonedDrops[y * width + x] = drops[(y + 1) * width + x];
		y++;
	} else if (move === 4 && x - 1 >= 0) {
		clonedDrops[y * width + x - 1] = drops[y * width + x];
		clonedDrops[y * width + x] = drops[y * width + x - 1];
		x--;
	}

	return {
		drops: clonedDrops,
		x: x + 1,
		y: y + 1,
	};
};

module.exports.moveDrop = moveDrop;

const calculateScore = (rawDrops, {width, height}) => {
	const chunkSizes = [];
	const drops = rawDrops.slice();

	while (drops.some((drop) => drop !== null)) {
		// BFS
		const start = drops.findIndex((drop) => drop !== null);
		const color = drops[start];
		drops[start] = null;

		// eslint-disable-next-line array-plural/array-plural
		const queue = [start];
		let size = 0;

		while (queue.length > 0) {
			const drop = queue.shift();
			const x = drop % width;
			const y = Math.floor(drop / width);
			if (y - 1 >= 0 && drops[(y - 1) * width + x] === color) {
				queue.push((y - 1) * width + x);
				drops[(y - 1) * width + x] = null;
			}
			if (y + 1 < height && drops[(y + 1) * width + x] === color) {
				queue.push((y + 1) * width + x);
				drops[(y + 1) * width + x] = null;
			}
			if (x - 1 >= 0 && drops[y * width + x - 1] === color) {
				queue.push(y * width + x - 1);
				drops[y * width + x - 1] = null;
			}
			if (x + 1 < width && drops[y * width + x + 1] === color) {
				queue.push(y * width + x + 1);
				drops[y * width + x + 1] = null;
			}
			size++;
		}

		chunkSizes.push(size);
	}

	return Math.sqrt(meanBy(chunkSizes, (n) => n * n));
};

module.exports.calculateScore = calculateScore;

const serialize = ({params, state}) => (
	`${[
		`${params.height} ${params.width} ${params.turns} ${params.moves}`,
		...chunk(state.drops, params.width).map((line) => line.join(' ')),
	].join('\n')}\n`
);

const deserialize = (stdin) => {
	const lines = stdin.trim().split('\n').map((line) => line.split(' '));

	return {
		params: {
			height: parseInt(lines[0][0]),
			width: parseInt(lines[0][1]),
			turns: parseInt(lines[0][2]),
			moves: parseInt(lines[0][3]),
		},
		state: {
			drops: flatten(lines.slice(1)).map((token) => parseInt(token)),
		},
	};
};

module.exports.deserialize = deserialize;

module.exports.battler = async (execute, params, {onFrame = noop, initState} = {}) => {
	const count = params.width * params.height;
	const initialState = initState || {
		drops: shuffle(Array(count).fill().map((_, i) => (
			clamp(Math.floor(i / count * 5) + 1, 1, 5)
		))),
	};

	const {state} = deserialize(serialize({params, state: initialState}));

	const {stdout} = await execute(serialize({params, state}), 0);
	const turns = normalize(stdout);

	for (const turn of turns.slice(0, params.turns)) {
		let x = turn.x;
		let y = turn.y;
		onFrame({...state, x, y});

		for (const move of turn.moves.slice(0, params.moves)) {
			const result = moveDrop(state.drops, x, y, move, params);
			state.drops = result.drops;
			x = result.x;
			y = result.y;
			onFrame({...state, x, y});
		}
	}

	const score = calculateScore(state.drops, params);

	return {
		result: 'settled',
		winner: 0,
		scores: [score],
	};
};

module.exports.configs = [
	{
		default: true,
		id: 'small',
		name: '5 x 5',
		params: {
			height: 5,
			width: 5,
			turns: 3,
			moves: 5,
		},
	},
	{
		id: 'medium',
		name: '10 x 10',
		params: {
			height: 10,
			width: 10,
			turns: 10,
			moves: 10,
		},
	},
	{
		id: 'large',
		name: '20 x 20',
		params: {
			height: 20,
			width: 20,
			turns: 30,
			moves: 15,
		},
	},
];

module.exports.matchConfigs = [
	...Array(5).fill().map(() => ({
		config: 'small',
		players: [0],
	})),
	...Array(5).fill().map(() => ({
		config: 'medium',
		players: [0],
	})),
	...Array(5).fill().map(() => ({
		config: 'large',
		players: [0],
	})),
];

module.exports.judgeMatch = (results) => ({
	result: results[0].result,
	winner: results[0].winner,
	scores: [sumBy(results, ({scores}) => scores[0])],
});
