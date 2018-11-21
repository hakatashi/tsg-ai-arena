/* eslint array-plural/array-plural: off, no-nested-ternary: off */

// title: iwashi harvest(iwashi収穫祭)
const noop = require('lodash/noop');
const sumBy = require('lodash/sumBy');
const sample = require('lodash/sample');
const flatten = require('lodash/flatten');
module.exports.presets = {};

// convert player's output from str to obj
// arg: player's output
// return: array of objects which showes how player to move.
const normalize = (stdout, params) => {
	const dx = [0, 1, 0, -1];
	const dy = [1, 0, -1, 0];
	const dir = 'SENW'.split('');
	const line = stdout
		.toString()
		.trim()
		.split('\n')[0]
		.split('');
	const moves = Array(params.turns).fill().map((_, index) => {
		let move = {x: 0, y: 0};
		dir.forEach((str, i) => {
			if (line[index] === str) {
				move = {
					x: dx[i],
					y: dy[i],
				};
			}
		});
		return move;
	});
	return moves;
};

module.exports.normalize = normalize;

// make maps
// arg: height, width and mode
// return: maps
const initMaps = (height, width, mode, wallRatio) => {
	if (mode === 'random') {
		// rate: 25%
		const maps = Array(height)
			.fill()
			.map((_, i) => i === 0 || i === height - 1
				? Array(width).fill('#')
				: ['#'].concat(Array(width - 2).fill('.'), ['#']));
		let count = Math.max(Math.floor((height * width) * wallRatio), 0);
		while (count--) {
			let x = Math.max(
				0,
				Math.min(width - 1, Math.floor(Math.random() * (width - 2)) + 1)
			);
			let y = Math.max(
				0,
				Math.min(height - 1, Math.floor(Math.random() * (height - 2)) + 1)
			);
			while (maps[y][x] === '#') {
				x = Math.max(
					0,
					Math.min(width - 1, Math.floor(Math.random() * (width - 2)) + 1)
				);
				y = Math.max(
					0,
					Math.min(height - 1, Math.floor(Math.random() * (height - 2)) + 1)
				);
			}
			maps[y][x] = '#';
		}
		return maps;
	} else if (mode === 'challenge') {
		// looks like this!
		/*
		#######
		#.....#
		#.#####
		#.....#
		#####.#
		#.....#
		#######
		*/
		return Array(height)
			.fill()
			.map((v, i) => {
				if (i === 0 || i === height - 1) {
					return '#'.repeat(width);
				} else if (i % 2 === 1) {
					return `#${'.'.repeat(width - 2)}#`;
				} else if (i % 4 === 0) {
					return `${'#'.repeat(width - 2)}.#`;
				}
				return `#.${'#'.repeat(width - 2)}`;
			}).map((line) => line.split(''));
	}
};

module.exports.initMaps = initMaps;

// init iwashiがつちからはえてくるんだ
// arg: maps, height, width, turns, and number of iwashi
// ret: iwashi and iwashiMap
const initIwashi = (maps, H, W, T, N) => {
	const iwashi = Array(N)
		.fill()
		.map(() => {
			let x = 0;
			let y = 0;
			while (maps[y][x] === '#') {
				x = Math.max(
					0,
					Math.min(W - 1, Math.floor(Math.random() * (W - 2)) + 1)
				);
				y = Math.max(
					0,
					Math.min(H - 1, Math.floor(Math.random() * (H - 2)) + 1)
				);
			}
			return {x, y, t: Math.max(0, Math.min(T, Math.floor(Math.random() * T)))};
		});
	const iwashiMap = Array(H)
		.fill()
		.map(() => Array(W).fill(0));
	for (const dat of iwashi) {
		if (dat.t === 0) {
			iwashiMap[dat.y][dat.x]++;
		}
	}
	return {iwashi, iwashiMap};
};

module.exports.initIwashi = initIwashi;

// change position of player
// arg: map of TSG, player data and move datum
// return: player's new position
const movePlayer = (maps, player, move) => {
	const x = player.x + move.x;
	const y = player.y + move.y;
	if (maps[y][x] !== '#' && player.paralyzed === 0) {
		return {x, y, paralyzed: player.paralyzed};
	}
	return player;
};

module.exports.movePlayer = movePlayer;

// iwashi moves.
// arg: iwashiMap, map of TSG, player data, H and W.
// ret: new iwashiMap
const iwashiMove = (iwashiMap, maps, player, H, W) => {
	const distanceMap = new Array(H);
	for (let i = 0; i < H; i++) {
		distanceMap[i] = new Array(W).fill(H * W);
	}
	const queue = [];
	const dx = [0, 1, 0, -1, 0];
	const dy = [-1, 0, 1, 0, 0];

	// player
	if (player.paralyzed === 0) {
		distanceMap[player.y][player.x] = 0;
		queue.push({x: player.x, y: player.y});
	}
	// iwashi
	for (let i = 0; i < H; i++) {
		for (let j = 0; j < W; j++) {
			if (iwashiMap[i][j] > 0) {
				distanceMap[i][j] = 0;
				queue.push({x: j, y: i});
			} else if (player.pos === {x: j, y: i}) {
				distanceMap[i][j] = 0;
				queue.push({x: j, y: i});
			}
		}
	}

	while (queue.length > 0) {
		const pos = queue.shift();
		for (let i = 0; i < 4; i++) {
			const nx = pos.x + dx[i];
			const ny = pos.y + dy[i];
			if (maps[ny][nx] === '#') {
				continue;
			}
			if (distanceMap[ny][nx] > distanceMap[pos.y][pos.x] + 1) {
				distanceMap[ny][nx] = distanceMap[pos.y][pos.x] + 1;
				queue.push({x: nx, y: ny});
			}
		}
	}

	const nextIwashiMap = new Array(H);
	for (let i = 0; i < H; i++) {
		nextIwashiMap[i] = new Array(W).fill(0);
	}

	for (let i = 0; i < H; i++) {
		for (let j = 0; j < W; j++) {
			if (iwashiMap[i][j] > 0) {
				if (nextIwashiMap[i][j] > 0) {
					nextIwashiMap[i][j] += iwashiMap[i][j];
				} else {
					for (let k = 0; k < 5; k++) {
						const ni = i + dy[k];
						const nj = j + dx[k];
						if (maps[ni][nj] === '#') {
							continue;
						}
						if (distanceMap[i][j] > distanceMap[ni][nj] || k === 4) {
							nextIwashiMap[ni][nj] += iwashiMap[i][j];
							break;
						}
					}
				}
			}
		}
	}

	return nextIwashiMap;
};

module.exports.iwashiMove = iwashiMove;

// calculate current Score(this is called every turn)
// arg: current iwashi map, player data, ,current score, iwashi data and current turn.
// ret: new score and new player data.
const calculateScore = (iwashiMap, player, score, iwashi, turn) => {
	const newPlayer = Object.assign(player);
	const newIwashi = iwashiMap.map((i) => i.slice());
	const iwashiQueue = iwashi.slice();

	// iwashiがつちからはえてくるんだ
	while (iwashiQueue.length > 0 && iwashiQueue[0].t < turn) {
		iwashiQueue.shift();
	}
	while (iwashiQueue.length > 0 && iwashiQueue[0].t === turn) {
		newIwashi[iwashiQueue[0].y][iwashiQueue[0].x]++;
		iwashiQueue.shift();
	}

	let retScore = score;
	if (newPlayer.paralyzed > 0) {
		newPlayer.paralyzed--;
	} else if (
		0 < newIwashi[newPlayer.y][newPlayer.x] &&
		newIwashi[newPlayer.y][newPlayer.x] <= 5
	) {
		retScore += newIwashi[newPlayer.y][newPlayer.x];
		newIwashi[newPlayer.y][newPlayer.x] = 0;
	} else if (newIwashi[newPlayer.y][newPlayer.x] > 5) {
		newPlayer.paralyzed += 5;
	}
	return {
		score: retScore,
		iwashiMap: newIwashi,
		player: newPlayer,
		iwashi: iwashiQueue,
	};
};

module.exports.calculateScore = calculateScore;

const serialize = ({params, state}) => {
	const head = [
		`${params.height} ${params.width} ${params.turns} ${params.n}`,
		`${state.player.x + 1} ${state.player.y + 1}`,
	];
	const end = state.iwashi.map((dat) => `${dat.x + 1} ${dat.y + 1} ${dat.t}`);
	return `${head.concat(state.maps.map((line) => line.join('')), end).join('\n')}\n`;
};

const deserialize = (stdin) => {
	const lines = stdin
		.trim()
		.split('\n')
		.map((line) => line.split(' '));
	const [height, width, turns, n] = lines[0].map((n) => parseInt(n));
	return {
		params: {
			height,
			width,
			turns,
			n,
		},
		state: {
			player: {
				x: parseInt(lines[1][0]) - 1,
				y: parseInt(lines[1][1]) - 1,
				paralyzed: 0,
			},
			iwashi: lines.slice(2 + height, 2 + height + n).map(([x, y, t]) => ({
				x: parseInt(x) - 1,
				y: parseInt(y) - 1,
				t: parseInt(t),
			})),
			maps: lines.slice(2, 2 + height).map((tokens) => tokens[0].split('')),
		},
	};
};

module.exports.deserialize = deserialize;

module.exports.battler = async (
	execute,
	params,
	{onFrame = noop, initState} = {}
) => {
	const initialState = initState || (() => {
		const maps = initMaps(params.height, params.width, params.mode, params.wallRatio);
		const iwashi = initIwashi(
			maps,
			params.height,
			params.width,
			params.turns,
			params.n
		);
		iwashi.iwashi.sort((a, b) => a.t - b.t);
		const playerIndex = sample(maps.join('').split('').map((cell, i) => ({cell, i})).filter(({cell}) => cell === '.')).i;
		const player = {
			x: playerIndex % params.width,
			y: Math.floor(playerIndex / params.width),
			paralyzed: 0,
		};
		return {
			maps,
			iwashiMap: iwashi.iwashiMap,
			iwashi: iwashi.iwashi,
			player,
		};
	})();
	const {state} = deserialize(serialize({params, state: initialState}));
	const iwashiMap = Array(params.height)
		.fill()
		.map(() => Array(params.width).fill(0));
	for (const dat of state.iwashi) {
		if (dat.t === 0) {
			iwashiMap[dat.y][dat.x]++;
		}
	}
	state.iwashiMap = iwashiMap;
	state.score = 0;
	const {stdout} = await execute(serialize({params, state: initialState}), 0);
	const turns = normalize(stdout, params);

	// doing hogehoge
	let turnCnt = 1;
	for (const turn of turns) {
		if (turnCnt > state.T) {
			break;
		}
		const player = movePlayer(state.maps, state.player, turn);
		const iwashiMap = iwashiMove(
			state.iwashiMap,
			state.maps,
			player,
			params.height,
			params.width
		);
		const result = calculateScore(
			iwashiMap,
			player,
			state.score,
			state.iwashi,
			turnCnt
		);
		state.player = result.player;
		state.iwashiMap = result.iwashiMap;
		state.score = result.score;
		state.iwashi = result.iwashi;
		onFrame({state});
		turnCnt++;
	}

	return {
		result: 'settled',
		winner: 0,
		scores: [state.score / params.n],
	};
};

module.exports.configs = [
	{
		default: true,
		id: 'tiny',
		name: '10 x 10 tiny',
		params: {
			mode: 'random',
			height: 10,
			width: 10,
			turns: 150,
			n: 50,
			wallRatio: 0.15,
		},
	},
	{
		id: 'little',
		name: '20 x 20 little',
		params: {
			mode: 'random',
			height: 20,
			width: 20,
			turns: 1000,
			n: 250,
			wallRatio: 0.25,
		},
	},
	{
		id: 'much',
		name: '20 x 20 much',
		params: {
			mode: 'random',
			height: 20,
			width: 20,
			turns: 1000,
			n: 3000,
			wallRatio: 0.25,
		},
	},
	{
		id: 'challenge',
		name: 'challenge',
		params: {
			mode: 'challenge',
			height: 20,
			width: 20,
			turns: 1000,
			n: 1000,
			wallRatio: null,
		},
	},
];

module.exports.matchConfigs = [
	...Array(1)
		.fill()
		.map(() => ({
			config: 'tiny',
			players: [0],
		})),
	...Array(6)
		.fill()
		.map(() => ({
			config: 'little',
			players: [0],
		})),
	...Array(6)
		.fill()
		.map(() => ({
			config: 'much',
			players: [0],
		})),
	...Array(3)
		.fill()
		.map(() => ({
			config: 'challenge',
			players: [0],
		})),
];

module.exports.judgeMatch = (results) => ({
	result: results[0].result,
	winner: results[0].winner,
	scores: [sumBy(results, ({scores}) => scores[0])],
});
