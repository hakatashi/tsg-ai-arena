const React = require('react');

class App extends React.Component {
	constructor(props, state) {
		super(props, state);

		this.data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));
		this.state = {
			stones: Array(24).fill(0),
			turn: 0,
			winner: null,
			isReady: this.data.result === 'settled' || this.data.result === 'draw',
		};
		this.remainingStones = 24;

		setTimeout(this.turn, 1000);
	}

	turn = () => {
		this.setState((prevState) => {
			if (this.remainingStones <= 0) {
				return {
					winner: this.data.winner,
				};
			}

			const turn = this.data.turns[prevState.turn];
			const takenStones = parseInt(turn.stdout.trim()) || 3;

			this.remainingStones -= takenStones;

			for (const index of Array(takenStones).keys()) {
				const stoneIndex = this.remainingStones + index;
				if (prevState.stones[stoneIndex] !== undefined) {
					prevState.stones[stoneIndex] = turn.player + 1;
				}
			}

			setTimeout(this.turn, 1000);

			return {
				stones: prevState.stones,
				turn: prevState.turn + 1,
			};
		});
	}

	renderContent = () => (
		<div style={{width: '480px'}}>
			{this.state.turn !== 0 && (
				<div style={{textAlign: 'center'}}>Turn: {this.state.turn}</div>
			)}
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
				}}
			>
				{this.state.stones.map((stone, index) => (
					<div
						key={index}
						style={{
							width: '60px',
							height: '60px',
							borderRadius: '50%',
							backgroundColor: ['black', 'red', 'blue'][stone],
							margin: '10px',
							transition: 'background-color 0.3s',
						}}
					/>
				))}
			</div>
			<div style={{color: 'red', textAlign: 'center', fontSize: '3em'}}>● {this.data.players[0]}</div>
			<div style={{color: 'blue', textAlign: 'center', fontSize: '3em'}}>● {this.data.players[1]}</div>
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
							color: ['red', 'blue'][this.state.winner],
							fontSize: '6em',
							fontWeight: 'bold',
							textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white',
							width: '100%',
							textAlign: 'center',
						}}
					>
						Winner: {this.data.players[this.state.winner]}
					</div>
				)}
			</div>
		);
	}
}

module.exports = App;
