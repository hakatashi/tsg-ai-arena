/* eslint array-plural/array-plural: off, no-nested-ternary: off */

const React = require('react');
const cloneDeep = require('lodash/cloneDeep');
const pick = require('lodash/pick');
const contest = require('../../../../contests/komabasai2018-procon.js');

class App extends React.Component {
	constructor(props, state) {
		super(props, state);

		this.data = JSON.parse(
			document.querySelector('meta[name="data"]').getAttribute('content')
		);

		const input = contest.deserialize(this.data.turns[0].input);
		const iwashiMap = Array(input.params.height).fill().map(() => (
			Array(input.params.width).fill(0)
		));
		for (const i of input.state.iwashi) {
			if (i.t === 0) {
				iwashiMap[i.y][i.x]++;
			}
		}
		this.state = {
			isReady: false,
			isCollated: false,
			player: input.state.player,
			iwashi: input.state.iwashi,
			maps: input.state.maps,
			iwashiMap,
			score: 0,
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
				this.setState({
					isCollated: true,
				});
				if (this.data.id === 'latest') {
					this.handleClickStart();
				}
			});
		}
	}

	collateFrames = async () => {
		const frames = [];
		let turnIndex = 0;

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
				initState: pick(this.state, ['iwashi', 'player', 'maps']),
			}
		);

		this.frames = frames;
	};

	handleClickStart = () => {
		this.setState({isReady: true});
		setTimeout(this.handleFrame, 300);
	};

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
					player: frame.state.player,
					iwashiMap: frame.state.iwashiMap,
					iwashi: frame.state.iwashi,
					score: frame.state.score,
					turns: this.frame + 1,
				},
				resolve
			);
		});

		this.frame++;
		setTimeout(this.handleFrame, Math.min(15000 / this.frames.length, 500));
	};

	renderContent = () => {
		const size = 500 / Math.max(this.params.width, this.params.height);
		return (
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
				<div
					style={{
						color: 'grey',
						fontWeight: 'bold',
						width: '100%',
						textAlign: 'center',
					}}
				>
					{`Turns: ${this.state.turns}`}
				</div>
				<svg
					style={{
						width: '500px',
						height: '500px',
						margin: '0 50px',
						border: '1px solid #555',
						boxSizing: 'content-box',
						position: 'relative',
						overflow: 'visible',
					}}
					viewBox="0 0 500 500"
				>
					{this.state.maps.map((row, y) => (
						row.map((cell, x) => (
							<rect
								key={y * this.params.width + x}
								x={x * size}
								y={y * size}
								width={size}
								height={size}
								opacity={0.3}
								fill={cell === '#' ? 'black' : 'white'}
							/>
						))
					))}
					<circle
						cx={this.state.player.x * size + size / 2}
						cy={this.state.player.y * size + size / 2}
						r={size / 2 - 5}
						fill="red"
					/>
					{this.state.iwashiMap.map((row, y) => (
						row.map((cell, x) => (
							cell > 0 && (
								<g key={y * this.params.width + x}>
									<circle
										cx={x * size + size / 2}
										cy={y * size + size / 2}
										r={size / 2 - 5}
										fill={cell < 5 ? 'transparent' : '#3F51B5'}
										stroke="#3F51B5"
										strokeWidth="2"
									/>
									<text
										x={x * size + size / 2}
										y={y * size + size * 0.7}
										fill={cell < 5 ? '#3F51B5' : 'white'}
										fontSize={size / 2}
										textAnchor="middle"
									>
										{cell}
									</text>
								</g>
							)
						))
					))}
				</svg>
				<div
					style={{
						color: this.state.turns === this.frames.length ? 'red' : 'dimgrey',
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
	};

	render() {
		return (
			<div
				style={{
					height: '100%',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				{this.state.isReady ? (
					this.renderContent()
				) : this.data.result === 'pending' ? (
					<h1> Battle is Pending...</h1>
				) : (
					this.state.isCollated && (
						<button
							type="button"
							onClick={this.handleClickStart}
							style={{
								backgroundColor: '#2196f3',
								fontSize: '6em',
								fontWeight: 'bold',
								width: '50%',
								textAlign: 'center',
								border: 'none',
								color: 'white',
								borderRadius: '10px',
								cursor: 'pointer',
							}}
						>
							Start
						</button>
					)
				)}
			</div>
		);
	}
}

module.exports = App;
