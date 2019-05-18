/* eslint array-plural/array-plural: off, no-nested-ternary: off */
const React = require('react');
const cloneDeep = require('lodash/cloneDeep');
const pick = require('lodash/pick');
const contest = require('../../../../contests/mayfes2019-procon.js');

const getColor = (value) => {
	if (value <= 0) {
		const R = -70 * Math.abs(value) / 100 + 70;
		const G = -70 * Math.abs(value) / 100 + 70;
		const B = (180 - 70) * Math.abs(value) / 100 + 70;
		return `rgb(${R}, ${G}, ${B})`;
	}

	{
		const R = (233 - 70) * Math.abs(value) / 100 + 70;
		const G = (30 - 70) * Math.abs(value) / 100 + 70;
		const B = (30 - 70) * Math.abs(value) / 100 + 70;
		return `rgb(${R}, ${G}, ${B})`;
	}
};

class App extends React.Component {
	constructor(props, state) {
		super(props, state);
		this.data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));

		const input = contest.deserialize(this.data.turns[0].input);
		const field = input.state.field.slice();
		this.state = {
			isReady: false,
			isCollated: false,
			x: input.state.x,
			y: input.state.y,
			field,
			score: input.state.score,
			frame: 0,
		};
		this.frame = 0;
		this.params = input.params;
		if (this.data.result === 'pending') {
			setTimeout(() => {
				location.reload();
			}, 3000);
		} else {
			this.collateFrames().then(() => {
				console.log(this.frames);
				this.setState({
					isCollated: true,
				});
				this.handleClickStart();
			});
		}
	}

	collateFrames = async () => {
		const frames = [];
		let turnIndex = 0;

		await new Promise((resolve) => setTimeout(resolve, 0));

		await contest.battler(
			() => {
				if (this.data.turns[turnIndex] === undefined) {
					return Promise.resolve({stdout: ''});
				}

				const {stdout} = this.data.turns[turnIndex];
				turnIndex++;
				return Promise.resolve({stdout});
			},
			this.params,
			{
				onFrame: (state) => frames.push(cloneDeep(state)),
				initState: {
					...pick(this.state, ['x', 'y', 'score']),
					field: this.state.field,
				},
			}
		);

		this.frames = frames;
	}

	handleClickStart = () => {
		this.setState({isReady: true});
		setTimeout(this.handleFrame, 300);
	}

	handleFrame = async () => {
		if (this.frame >= this.frames.length) {
			if (this.data.id === 'latest') {
				setTimeout(() => {
					location.reload();
				}, 10000);
			}
			return;
		}

		const frame = this.frames[this.frame];
		await new Promise((resolve) => {
			this.setState(
				{
					x: frame.state.x,
					y: frame.state.y,
					field: frame.state.field,
					score: frame.state.score,
					turns: this.frame + 1,
				},
				resolve,
			);
		});

		this.frame++;
		setTimeout(this.handleFrame, Math.min(15000 / this.frames.length, 500));
	};

	render() {
		const size = 500 / Math.max(this.params.width, this.params.height);
		return (
			<div>
				<div
					style={{
						width: '100%',
						height: '100%',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						flexDirection: 'column',
					}}
				>
					{`Turns ${this.state.turns}`}
				</div>
				<svg
					style={{
						display: 'block',
						width: '500px',
						height: '500px',
						margin: '0 auto',
						border: '1px solid #555',
						boxSizing: 'content-box',
						position: 'relative',
						overflow: 'visible',
					}}
					viewBox="0 0 500 500"
				>
					{this.state.field.map((cell, index) => (
						<g key={index}>
							<rect
								x={(index % this.params.width) * size}
								y={Math.floor(index / this.params.width) * size}
								width={size}
								height={size}
								opacity={cell.visited ? 1 : 0.3}
								fill={getColor(cell.num)}
							/>
							<text
								x={(index % this.params.width) * size + size / 2}
								y={Math.floor(index / this.params.width) * size + size * 0.7}
								fill={cell.visited ? 'white' : '#3F51B5'}
								fontSize={size / 2}
								textAnchor="middle"
							>
								{cell.num}
							</text>
						</g>
					))}
					<circle
						cx={this.state.x * size + size / 2}
						cy={this.state.y * size + size / 2}
						r={size / 2 - 5}
						fill="red"
					/>
				</svg>
				<div
					style={{
						color: (this.frames && this.state.turns === this.frames.length) ? 'red' : 'dimgrey',
						fontSize: '3em',
						fontWeight: 'bold',
						width: '100%',
						textAlign: 'center',
					}}
				>
					{`Score: ${this.state.score}`}
				</div>
			</div>
		);
	}
}

module.exports = App;
