const React = require('react');
const cloneDeep = require('lodash/cloneDeep');
const pick = require('lodash/pick');
const transpose = require('lodash/unzip');
const contest = require('../../../../contests/mayfes2018-day2.js');

const getColor = (value) => {
	if (value === 0) {
		return 'white';
	}

	if (value > 0) {
		return `rgb(255, ${255 - value / 3 * 200}, ${255 - value / 3 * 200})`;
	}

	return `rgb(${255 + value / 3 * 200}, ${255 + value / 3 * 200}, 255)`;
};

class App extends React.Component {
	constructor(props, state) {
		super(props, state);

		this.data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));

		this.state = {
			isReady: false,
			...contest.deserialize(this.data.turns[0].input),
			points: [0, 0],
			winner: null,
		};
		this.frame = 0;

		this.collateFrames().then(() => {
			this.setState({
				isReady: true,
			});
			setTimeout(this.handleFrame, 1000);
		});
	}

	collateFrames = async () => {
		const frames = [];
		let turnIndex = 0;

		await contest.battler(() => {
			if (this.data.turns[turnIndex] === undefined) {
				return Promise.resolve({stdout: ''});
			}

			const {stdout} = this.data.turns[turnIndex];
			turnIndex++;
			return Promise.resolve({stdout});
		}, {
			onFrame: (state) => frames.push(cloneDeep(state)),
			initState: pick(this.state, ['turns', 'field']),
		});

		this.frames = frames;
	}

	handleFrame = () => {
		if (this.frame >= this.frames.length) {
			if (this.state.points[0] === this.state.points[1]) {
				this.setState({winner: 0});
			} else {
				this.setState({winner: this.state.points[0] > this.state.points[1] ? 1 : 2});
			}
			return;
		}

		this.setState(this.frames[this.frame]);
		this.frame++;

		setTimeout(this.handleFrame, 500);
	}

	renderContent = () => (
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div
				style={{
					color: 'red',
					textAlign: 'center',
					fontSize: '1em',
					width: '100px',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<div>
					{this.data.players[0]}
				</div>
				<div
					style={{
						fontSize: '5em',
						fontWeight: 'bold',
					}}
				>
					{this.state.points[0]}
				</div>
				{Array(20).fill().map((_, index) => (
					<div
						key={index}
						style={{
							width: '45px',
							height: '15px',
							background: index < 19 - this.state.turns ? 'red' : 'transparent',
							marginTop: '5px',
						}}
					/>
				))}
			</div>
			<div
				style={{
					width: '500px',
					height: '500px',
					margin: '0 50px',
					border: '1px solid #555',
					boxSizing: 'content-box',
					position: 'relative',
				}}
			>
				{transpose(this.state.field).map((row, index) => (
					<div
						key={index}
						style={{
							width: '100%',
							height: '50px',
							display: 'flex',
						}}
					>
						{row.map((value, valueIndex) => (
							<div
								key={valueIndex}
								style={{
									width: '50px',
									height: '50px',
									background: getColor(value),
								}}
							/>
						))}
					</div>
				))}
			</div>
			<div
				style={{
					color: 'blue',
					textAlign: 'center',
					fontSize: '1em',
					width: '100px',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<div>
					{this.data.players[1]}
				</div>
				<div
					style={{
						fontSize: '5em',
						fontWeight: 'bold',
					}}
				>
					{this.state.points[1]}
				</div>
				{Array(20).fill().map((_, index) => (
					<div
						key={index}
						style={{
							width: '45px',
							height: '15px',
							background: index < 19 - this.state.turns ? 'blue' : 'transparent',
							marginTop: '5px',
						}}
					/>
				))}
			</div>
		</div>
	)

	render() {
		return (
			<div style={{height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
				{this.state.isReady ? (
					this.renderContent()
				) : (
					<h1>
						Battle is Pending...
					</h1>
				)}
				{this.state.winner !== null && (
					<div
						style={{
							position: 'absolute',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
							color: ['gray', 'red', 'blue'][this.state.winner],
							fontSize: '6em',
							fontWeight: 'bold',
							textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white',
							width: '100%',
							textAlign: 'center',
						}}
					>
						{this.state.winner === 0 ? 'Draw' : `Winner: ${this.data.players[this.state.winner - 1]}`}
					</div>
				)}
			</div>
		);
	}
}

module.exports = App;
