const noop = require('lodash/noop');
const minBy = require('lodash/minBy');

const getNewParams = ({x, y, sx, sy, ax, ay}, isBall) => {
	const newParams = {};

	if (isBall) {
		newParams.sx = sx;
		newParams.sy = sy;
		newParams.x = x + sx;
		newParams.y = y + sy;
	} else {
		newParams.ax = ax;
		newParams.ay = ay;
		newParams.sx = sx + ax;
		newParams.sy = sy + ay;
		newParams.x = x + newParams.sx;
		newParams.y = y + newParams.sy;
	}

	if (newParams.x < 0) {
		newParams.x = -newParams.x;
		newParams.sx = -newParams.sx;
	}

	if (newParams.x > 1024) {
		newParams.x = 1024 * 2 - newParams.x;
		newParams.sx = -newParams.sx;
	}

	if (newParams.y < 0) {
		newParams.y = -newParams.y;
		newParams.sy = -newParams.sy;
	}

	if (newParams.y > 1024) {
		newParams.y = 1024 * 2 - newParams.y;
		newParams.sy = -newParams.sy;
	}

	return newParams;
};

const dist = ({x: Ax, y: Ay}, {x: Bx, y: By}) => Math.sqrt((Ax - Bx) ** 2 + (Ay - By) ** 2);

const serialize = (state) => `${[
	state.frames,
	...state.players.map(
		({x, y, sx, sy}) => `${x.toFixed(3)} ${y.toFixed(3)} ${sx.toFixed(3)} ${sy.toFixed(
			3
		)}`
	),
	state.balls.length,
	...state.balls.map(
		({x, y, sx, sy}) => `${x.toFixed(3)} ${y.toFixed(3)} ${sx.toFixed(3)} ${sy.toFixed(
			3
		)}`
	),
].join('\n')}\n`;

module.exports.serialize = serialize;

const deserialize = (stdin) => {
	const lines = stdin.split('\n').filter((line) => line.length > 0);

	return {
		frames: parseInt(lines[0]),
		balls: lines.slice(4).map((line) => {
			const [x, y, sx, sy] = line
				.split(' ')
				.map((token) => parseFloat(token));
			return {x, y, sx, sy};
		}),
		players: lines.slice(1, 3).map((line) => {
			const [x, y, sx, sy] = line
				.split(' ')
				.map((token) => parseFloat(token));
			return {x, y, sx, sy, ax: 0, ay: 0};
		}),
	};
};

module.exports.deserialize = deserialize;

module.exports.presets = {
	dumb: (stdin) => {
		const state = deserialize(stdin);

		if (state.frames === 0) {
			return '30 1';
		}

		return `${(
			180 -
			Math.atan2(state.players[0].sx, state.players[0].sy) / Math.PI * 180
		).toFixed(3)} 1`;
	},
	random: () => `${(Math.random() * 360).toFixed(3)} 1`,
	nearest: (stdin) => {
		const state = deserialize(stdin);

		const target = minBy(state.balls, (ball) => dist(state.players[0], ball));
		return `${(
			180 -
			Math.atan2(
				target.x - state.players[0].x,
				target.y - state.players[0].y
			) /
				Math.PI *
				180
		).toFixed(3)} 1`;
	},
};

module.exports.battler = async (execute, {onFrame = noop, initState} = {}) => {
	const initialState = initState || {
		frames: 0,
		balls: Array(7)
			.fill()
			.map(() => ({
				x: Math.random() * 1024,
				y: Math.random() * 1024,
				sx: (Math.random() * 5 + 5) * (Math.random() < 0.5 ? 1 : -1),
				sy: (Math.random() * 5 + 5) * (Math.random() < 0.5 ? 1 : -1),
			})),
		players: [
			{
				x: 256,
				y: 512,
				sx: 0,
				sy: 0,
			},
			{
				x: 768,
				y: 512,
				sx: 0,
				sy: 0,
			},
		],
	};

	const state = {
		...deserialize(serialize(initialState)),
		points: [0, 0],
	};

	while (state.frames < 1000 && state.balls.length > 0) {
		if (state.frames % 10 === 0) {
			const stdin1 = serialize(state);
			const stdin2 = serialize({
				...state,
				players: state.players.slice().reverse(),
			});

			const {stdout: stdout1} = await execute(stdin1, 0);
			const {stdout: stdout2} = await execute(stdin2, 1);

			for (const [playerIndex, stdout] of [stdout1, stdout2].entries()) {
				const tokens = stdout
					.toString()
					.trim()
					.split(/\s+/);

				if (tokens.length !== 2) {
					continue;
				}

				const [deg, acc] = tokens.map((token) => parseFloat(token));

				if (deg < 0 || deg > 360 || acc < 0 || acc > 1) {
					continue;
				}

				state.players[playerIndex].sx =
					Math.sin(deg / 180 * Math.PI) * acc * 10;
				state.players[playerIndex].sy =
					-Math.cos(deg / 180 * Math.PI) * acc * 10;
			}
		}

		for (const [index, ball] of state.balls.entries()) {
			state.balls[index] = getNewParams(ball, true);
		}

		for (const [index, player] of state.players.entries()) {
			state.players[index] = getNewParams(player, false);
		}

		for (const [index, ball] of state.balls.entries()) {
			const touches = state.players.map(
				(player) => dist(player, ball) < 50
			);

			if (touches[0] && !touches[1]) {
				state.points[0]++;
			}

			if (!touches[0] && touches[1]) {
				state.points[1]++;
			}

			if (touches[0] || touches[1]) {
				state.balls.splice(index, 1);
			}
		}

		state.frames++;
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
