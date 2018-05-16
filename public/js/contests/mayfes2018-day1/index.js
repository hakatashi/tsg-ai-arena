const SIZE = 9;

const flatten = (arrays) => arrays.reduce((a, b) => a.concat(b), []);

const data = JSON.parse(
	document.querySelector('meta[name="data"]').getAttribute('content')
);
console.log(data);

const app = document.querySelector('#app');
Object.assign(app.style, {
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	alignItems: 'center',
});

let turn = 0;

setInterval(() => {
	const lines = data.turns[turn].input.split('\n');
	const [T, P] = lines[0].split(' ').map((token) => parseInt(token));
	const [x1, y1] = lines[1].split(' ').map((token) => parseInt(token));
	const [x2, y2] = lines[2].split(' ').map((token) => parseInt(token));
	const field = new Array(SIZE);
	for (var y = 0; y < SIZE; y++) {
		field[y] = lines[y + 3].split(' ').map((token) => parseInt(token));
	}
	const [N] = lines[SIZE + 3].split(' ').map((token) => parseInt(token));
	const soup = new Array(N);
	for (var i = 0; i < N; i++) {
		const [x, y] = lines[SIZE + 4 + i]
			.split(' ')
			.map((token) => parseInt(token));
		soup[i] = {x, y};
	}
	let output = '<table style="border-collapse: collapse">';
	for (var y = 0; y < SIZE; y++) {
		output += '<tr>';
		for (let x = 0; x < SIZE; x++) {
			let color = '';
			if (field[y][x] == 0) {
				color = '#eee';
			} else if (field[y][x] == 1) {
				color = 'deepskyblue';
			} else {
				color = 'gold';
			}
			let text = '';
			const isSoup = false;
			for (var i = 0; i < soup.length; i++) {
				if (soup[i].x == x && soup[i].y == y) {
					text = '<span style="color: red; font-SIZE: 30px">★</span>';
				}
			}

			if (x1 == x && y1 == y) {
				text = '<span style="color: royalblue; font-SIZE: 30px">●</span>';
			}
			if (x2 == x && y2 == y) {
				text = '<span style="color: darkorange; font-SIZE: 30px">●</span>';
			}
			output +=
				`<th style="text-align: center; border: 1px black solid; width: 40px; height: 40px; background-color:${
					color
				};">${
					text
				}</th>`;
		}
		output += '</tr>';
	}
	output += '</table>';

	const turnEl = document.createElement('div');
	turnEl.textContent = `Turn: ${turn}`;
	Object.assign(turnEl.style, {
		fontSize: '2em',
		fontWeight: 'bold',
	});
	output += turnEl.outerHTML;

	const points = [];

	for (const player of [1, 2]) {
		const point = flatten(field).filter((cell) => cell === player).length;
		points.push(point);

		const playerEl = document.createElement('div');
		playerEl.textContent = `Player${player}: ${point}`;
		Object.assign(playerEl.style, {
			fontSize: '3em',
			fontWeight: 'bold',
			color: player === 1 ? 'royalblue' : 'darkorange',
		});
		output += playerEl.outerHTML;
	}

	if (turn + 2 < data.turns.length) {
		turn += 2;
	} else {
		const winner = (() => {
			if (points[0] === points[1]) {
				return 0;
			}

			return points[0] > points[1] ? 1 : 2;
		})();

		const resultEl = document.createElement('div');
		resultEl.textContent = winner === 0
			? 'Draw'
			: `Winner: ${data.players[winner - 1]}`;
		Object.assign(resultEl.style, {
			position: 'absolute',
			top: '50%',
			left: '50%',
			transform: 'translate(-50%, -50%)',
			color: ['gray', 'royalblue', 'darkorange'][winner],
			fontSize: '6em',
			fontWeight: 'bold',
			textShadow:
				'-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white',
			width: '100%',
			textAlign: 'center',
		});
		output += resultEl.outerHTML;
	}

	document.querySelector('#app').innerHTML = output;
}, 500);
