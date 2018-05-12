const React = require('react');
const cloneDeep = require('lodash/cloneDeep');
const pick = require('lodash/pick');
const contest = require('../../../../contests/dragon-ball.js');

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
			initState: pick(this.state, ['frames', 'balls', 'players', 'points']),
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

		setTimeout(this.handleFrame, 50);
	}

	renderContent = () => (
		<div style={{width: '512px'}}>
			{this.state.turn !== 0 && (
				<div style={{textAlign: 'center'}}>Frame: {this.state.frames}</div>
			)}
			<div
				style={{
					width: '512px',
					height: '512px',
					border: '1px solid black',
					position: 'relative',
				}}
			>
				{this.state.balls.map((ball, index) => (
					<div
						key={index}
						style={{
							position: 'absolute',
							width: '25px',
							height: '25px',
							borderRadius: '50%',
							backgroundColor: 'gray',
							transform: 'translate(-50%, -50%)',
							top: `${ball.y / 2}px`,
							left: `${ball.x / 2}px`,
						}}
					/>
				))}
				{this.state.players.map((player, index) => (
					<div
						key={index}
						style={{
							position: 'absolute',
							width: '0',
							height: '0',
							borderLeft: '10px solid transparent',
							borderRight: '10px solid transparent',
							borderBottom: `20px solid ${index === 0 ? 'red' : 'blue'}`,
							transform: `translate(-50%, -50%) rotate(${180 - Math.atan2(player.sx, player.sy) / Math.PI * 180}deg)`,
							top: `${player.y / 2}px`,
							left: `${player.x / 2}px`,
						}}
					/>
				))}
			</div>
			<div style={{color: 'red', textAlign: 'center', fontSize: '3em'}}>▲ {this.data.players[0]}</div>
			<div style={{color: 'blue', textAlign: 'center', fontSize: '3em'}}>▲ {this.data.players[1]}</div>
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
