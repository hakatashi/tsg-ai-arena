/* eslint array-plural/array-plural: off, no-nested-ternary: off */

const React = require('react');
const cloneDeep = require('lodash/cloneDeep');
const pick = require('lodash/pick');
const contest = require('../../../../contests/dragon-puzzles.js');

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
			drops: input.state.drops,
			score: contest.calculateScore(input.state.drops, input.params),
			activeDrop: null,
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
				initState: pick(this.state, ['drops']),
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
					drops: frame.drops,
					activeDrop: (frame.y - 1) * this.params.width + frame.x - 1,
					score: contest.calculateScore(frame.drops, this.params),
				},
				resolve
			);
		});

		this.frame++;

		setTimeout(this.handleFrame, 300);
	};

	renderContent = () => (
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
				{this.state.drops.map((drop, i) => {
					const size = 500 / Math.max(this.params.width, this.params.height);
					const x = i % this.params.width;
					const y = Math.floor(i / this.params.height);

					return (
						<circle
							key={i}
							cx={x * size + size / 2}
							cy={y * size + size / 2}
							r={size / 2 - 2}
							fill={['red', 'blue', 'yellow', 'green', 'purple'][drop - 1]}
							opacity={(this.state.activeDrop === null || this.state.activeDrop === i) ? 1 : 0.3}
						/>
					);
				})}
			</svg>
			<div
				style={{
					color: 'red',
					fontSize: '3em',
					fontWeight: 'bold',
					width: '100%',
					textAlign: 'center',
				}}
			>
				{`Score: ${this.state.score.toFixed(3)}`}
			</div>
		</div>
	);

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
