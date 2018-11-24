/* eslint array-plural/array-plural: off, no-nested-ternary: off */

const React = require('react');
const cloneDeep = require('lodash/cloneDeep');
const pick = require('lodash/pick');
const contest = require('../../../../contests/komabasai2018-ai.js');

class App extends React.Component {
	constructor(props, state) {
		super(props, state);

		this.data = JSON.parse(
			document.querySelector('meta[name="data"]').getAttribute('content')
		);

		const input = contest.deserialize(this.data.turns[0].input);

		this.state = {
			isReady: false,
			isCollated: false,
			field: input.state.field,
			turn: input.state.turn,
			targets: input.state.targets,
			pawns: input.state.pawns,
			beams: input.state.beams,
			turns: 0,
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
				initState: pick(this.state, [
					'turn',
					'field',
					'targets',
					'pawns',
					'beams',
				]),
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
			this.setState({
				activeDrop: null,
			});
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
					field: frame.state.field,
					beams: frame.state.beams,
					pawns: frame.state.pawns,
					targets: frame.state.targets,
					turn: frame.state.turn,
					turns: frame.state.turns,
				},
				resolve
			);
		});

		this.frame++;

		setTimeout(this.handleFrame, Math.min(10000 / this.frames.length, 500));
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
					{this.state.field.map((field, i) => {
						const x = i % this.params.width;
						const y = Math.floor(i / this.params.height);

						return (
							<rect
								key={i}
								x={x * size}
								y={y * size}
								width={size}
								height={size}
								fill={{block: 'black', beam: '#FAA', empty: 'white'}[field]}
							/>
						);
					})}
					{this.state.beams.map((beam) => {
						const x = beam.position % this.params.width;
						const y = Math.floor(beam.position / this.params.height);
						return (
							<circle
								key={beam.id}
								cx={x * size + size / 2}
								cy={y * size + size / 2}
								r={size / 2 - 5}
								fill="red"
								style={{
									transition: 'all 0.1s',
								}}
							/>
						);
					})}
					{this.state.pawns.map((pawn) => {
						const x = pawn.position % this.params.width;
						const y = Math.floor(pawn.position / this.params.height);
						return (
							<circle
								key={pawn.id}
								cx={x * size + size / 2}
								cy={y * size + size / 2}
								r={size / 2 - 5}
								stroke="red"
								strokeWidth="2"
								fill="transparent"
								style={{
									transition: 'all 0.1s',
								}}
							/>
						);
					})}
					{this.state.targets.map((target) => {
						const x = target.position % this.params.width;
						const y = Math.floor(target.position / this.params.height);
						return (
							<circle
								key={target.id}
								cx={x * size + size / 2}
								cy={y * size + size / 2}
								r={size / 2 - 5}
								stroke="blue"
								strokeWidth="2"
								fill="transparent"
								style={{
									transition: 'all 0.1s',
								}}
							/>
						);
					})}
				</svg>
				<div
					style={{
						fontSize: '2em',
						fontWeight: 'bold',
						width: '100%',
						textAlign: 'center',
					}}
				>
					<span style={{color: 'red'}}>{this.data.players[0]}</span> vs{' '}
					<span style={{color: 'blue'}}>{this.data.players[1]}</span>
				</div>
				<div
					style={{
						color:
							this.state.turns === this.frames.length - 1 ? 'red' : 'dimgrey',
						fontSize: '3em',
						lineHeight: '1em',
						fontWeight: 'bold',
						width: '100%',
						textAlign: 'center',
					}}
				>
					{`Turn: ${this.state.turns + 1}`}
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
					<h1>Battle is Pending...</h1>
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
