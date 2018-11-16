const assert = require('assert');
const countBy = require('lodash/countBy');
const clamp = require('lodash/clamp');
const shuffle = require('lodash/shuffle');
const chunk = require('lodash/chunk');

module.exports.presets = {
};

const normalize = (stdout) => {
	const lines = stdout.toString().split('\n');
	const turns = lines.map((line) => {
		let matches = null;
		if (!(matches = line.match(/^(\d+)\s+(\d+)$/))) {
			return {x: 1, y: 1};
		}
		return {
			x: clamp(parseInt(matches[1]) || 1, 1, Infinity),
			y: clamp(parseInt(matches[2]) || 1, 1, Infinity),
		};
	});
	return turns;
};

module.exports.normalize = normalize;

const rotateDrops = (drops, rawX, rawY, {width}) => {
	const x = rawX - 1;
	const y = rawY - 1;
	const clonedDrops = drops.slice();
	clonedDrops[y * width + x] = drops[(y + 1) * width + x];
	clonedDrops[y * width + x + 1] = drops[y * width + x];
	clonedDrops[(y + 1) * width + x + 1] = drops[y * width + x + 1];
	clonedDrops[(y + 1) * width + x] = drops[(y + 1) * width + x];
	return clonedDrops;
};

module.exports.rotateDrops = rotateDrops;

const calculateStore = (rawDrops, {width, height}) => {
	const chunkSizes = [];
	const drops = rawDrops.slice();

	while (drops.some((drop) => drop !== null)) {
		// BFS
		const start = drops.findIndex((drop) => drop !== null);
		const color = drops[start];
		drops[start] = null;

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

	return chunkSizes.reduce((a, b) => a + b, 0);
};

module.exports.battler = async (execute, params) => {
	const count = params.width * params.height;
	const state = {
		drops: shuffle(Array(count).fill().map((_, i) => (
			clamp(Math.floor(i / count * 5) + 1, 1, 5)
		))),
		turn: 0,
	};

	const {stdout} = await execute(`${[
		`${params.height} ${params.width} ${params.turns}`,
		...chunk(state.drops, params.width).map((line) => line.join(' ')),
	].join('\n')}\n`, 0);
	const turns = normalize(stdout);

	for (const turn of turns) {
		state.drops = rotateDrops(state.drops, turn.x, turn.y, params);
	}

	const score = calculateStore(state.drops, params);

	return {
		result: 'settled',
		winner: 0,
		score,
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
			turns: 20,
		},
	},
];

module.exports.matchConfigs = [
	{
		config: 'small',
		players: [0],
	},
];

module.exports.judgeMatch = (results) => {
	const wins = [0, 1].map((player) => countBy(results, (result) => result.winner === player));
	assert(wins[0] !== wins[1]);

	return {
		result: 'settled',
		winner: wins[0] > wins[1] ? 0 : 1,
	};
};
