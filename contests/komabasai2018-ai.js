const deserialize = (stdin) => {
	const lines = stdin.split('\n').filter((line) => line.length > 0);
	const beams = [];
	const pawns = [];
	const targets = [];
	const board = [];

	lines.slice(2).forEach((l, y) => {
		cells = l.split(' ');
		row = [];
		cells.forEach((cell, x) => {
			if (cell[0] == 'b') {
				beam = {pos: {x, y}, type: 'b', id: parseInt(cell.slice(1))};
				beams.push(beam);
				row.push(beam); // copy pointers
			} else if (cell[0] == 'p') {
				pawn = {pos: {x, y}, type: 'p', id: parseInt(cell.slice(1))};
				pawns.push(pawn);
				row.push(pawn);
			} else if (cell[0] == 't') {
				target = {pos: {x, y}, type: 't', id: parseInt(cell.slice(1))};
				targets.push(target);
				row.push(target);
			} else {
				row.push({type: cell[0]});
			}
		});
		board.push(row);
	});

	return {
		turn: lines[1][0],
		beams,
		pawns,
		targets,
		board,
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
		if (state.turn == 'A') {
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

module.exports.configs = [
	{
		default: true,
		id: 'default',
		name: 'Default',
		params: {},
	},
];

module.exports.matchConfigs = [
	{
		config: 'default',
		players: [0, 1],
	},
];

module.exports.judgeMatch = (results) => results[0];
