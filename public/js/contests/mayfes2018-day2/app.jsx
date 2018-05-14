/* eslint array-plural/array-plural: off */

const React = require('react');
const cloneDeep = require('lodash/cloneDeep');
const pick = require('lodash/pick');
const maxBy = require('lodash/maxBy');
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
			longestPathsList: [],
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
				this.setState(({points}) => ({
					winner: points[0] > points[1] ? 1 : 2,
				}));
			}
			return;
		}

		const newState = this.frames[this.frame];

		const longestPathsList = [0, 1].map((playerIndex) => {
			let longestPathLength = 0;
			let longestPaths = [];

			for (const [rowsIndex, rows] of [newState.field, transpose(newState.field)].entries()) {
				for (const [rowIndex, values] of rows.entries()) {
					const row = values.map((value) => {
						if (playerIndex === 0) {
							return value > 0;
						}

						return value < 0;
					});

					const chunks = [];
					let start = 0;
					for (const [index, value] of row.entries()) {
						const prevValue = index - 1 < 0 ? false : row[index - 1];
						const nextValue = index + 1 >= row.length ? false : row[index + 1];

						if (value === true && prevValue === false) {
							start = index;
						}

						if (value === true && nextValue === false) {
							chunks.push({

								start: rowsIndex === 0 ? {
									x: rowIndex,
									y: start,
								} : {
									x: start,
									y: rowIndex,
								},
								end: rowsIndex === 0 ? {
									x: rowIndex,
									y: index,
								} : {
									x: index,
									y: rowIndex,
								},
								length: index - start + 1,
							});
						}
					}

					const longestRowPath = maxBy(chunks, 'length');
					const longestRowPathLength = longestRowPath ? longestRowPath.length : 0;
					const longestRowChunks = chunks.filter(({length}) => length === longestRowPathLength);

					if (longestRowPathLength === longestPathLength) {
						longestPaths.push(...longestRowChunks);
					} else if (longestRowPathLength > longestPathLength) {
						longestPaths = longestRowChunks;
						longestPathLength = longestRowPathLength;
					}
				}
			}

			return longestPaths;
		});

		this.setState({
			...newState,
			longestPathsList,
		});
		this.frame++;

		setTimeout(this.handleFrame, 2000);
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
			<svg
				style={{
					width: '500px',
					height: '500px',
					margin: '0 50px',
					border: '1px solid #555',
					boxSizing: 'content-box',
					position: 'relative',
				}}
				viewBox="0 0 500 500"
			>
				{transpose(this.state.field).map((row, y) => (
					<g
						key={y}
					>
						{row.map((value, x) => (
							<rect
								key={x}
								x={x * 50}
								y={y * 50}
								width="50px"
								height="50px"
								fill={getColor(value)}
							/>
						))}
					</g>
				))}
				{this.state.longestPathsList.map((longestPaths, playerIndex) => (
					<g
						key={playerIndex}
					>
						{longestPaths.map((path, pathIndex) => (
							<line
								key={pathIndex}
								x1={path.start.x * 50 + 25}
								y1={path.start.y * 50 + 25}
								x2={path.end.x * 50 + 25}
								y2={path.end.y * 50 + 25}
								stroke={playerIndex === 0 ? 'red' : 'blue'}
								strokeWidth="10"
								strokeLinecap="round"
							/>
						))}
					</g>
				))}
			</svg>
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
