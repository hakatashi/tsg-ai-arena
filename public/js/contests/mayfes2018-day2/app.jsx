/* eslint array-plural/array-plural: off, no-nested-ternary: off */

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
		return `rgb(255, ${Math.floor(255 - value / 3 * 200)}, ${Math.floor(255 - value / 3 * 200)})`;
	}

	return `rgb(${Math.floor(255 + value / 3 * 200)}, ${Math.floor(255 + value / 3 * 200)}, 255)`;
};

class App extends React.Component {
	constructor(props, state) {
		super(props, state);

		this.data = JSON.parse(
			document.querySelector('meta[name="data"]').getAttribute('content')
		);

		this.state = {
			isReady: false,
			isCollated: false,
			...contest.deserialize(this.data.turns[0].input),
			points: [0, 0],
			winner: null,
			longestPathsList: [],
			tempBlocks: null,
		};
		this.frame = 0;

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
			{
				onFrame: (state) => frames.push(cloneDeep(state)),
				initState: pick(this.state, ['turns', 'field']),
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
			if (this.state.points[0] === this.state.points[1]) {
				this.setState({winner: 0});
			} else {
				this.setState(({points}) => ({
					winner: points[0] > points[1] ? 1 : 2,
				}));
			}
			if (this.data.id === 'latest') {
				setTimeout(() => {
					location.reload();
				}, 10000);
			}
			return;
		}

		const newState = this.frames[this.frame].state;

		const longestPathsList = [0, 1].map((playerIndex) => {
			let longestPathLength = 0;
			let longestPaths = [];

			for (const [rowsIndex, rows] of [
				newState.field,
				transpose(newState.field),
			].entries()) {
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
								start:
									rowsIndex === 0
										? {
											x: rowIndex,
											y: start,
										  }
										: {
											x: start,
											y: rowIndex,
										  },
								end:
									rowsIndex === 0
										? {
											x: rowIndex,
											y: index,
										  }
										: {
											x: index,
											y: rowIndex,
										  },
								length: index - start + 1,
							});
						}
					}

					const longestRowPath = maxBy(chunks, 'length');
					const longestRowPathLength = longestRowPath
						? longestRowPath.length
						: 0;
					const longestRowChunks = chunks.filter(
						({length}) => length === longestRowPathLength
					);

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

		await new Promise((resolve) => {
			this.setState(
				{
					tempBlocks: [
						{x: -1.7, y: 3.3, rot: 0, opacity: 0.3, scale: 0.3},
						{x: 12.7, y: 3.3, rot: 0, opacity: 0.3, scale: 0.3},
					],
				},
				resolve
			);
		});

		await new Promise((resolve) => {
			setTimeout(resolve, 0);
		});

		await new Promise((resolve) => {
			this.setState(
				{
					tempBlocks: this.frames[this.frame].outputs.map((block) => ({
						...block,
						opacity: 1,
						scale: 1,
					})),
					turns: newState.turns,
				},
				resolve
			);
		});

		await new Promise((resolve) => {
			setTimeout(resolve, 1000);
		});

		await new Promise((resolve) => {
			this.setState(
				{
					...newState,
					longestPathsList,
					tempBlocks: null,
				},
				resolve
			);
		});
		this.frame++;

		setTimeout(this.handleFrame, 2000);
	};

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
				<div>{this.data.players[0]}</div>
				<div
					style={{
						fontSize: '5em',
						fontWeight: 'bold',
					}}
				>
					{this.state.points[0]}
				</div>
				{Array(20)
					.fill()
					.map((_, index) => (
						<div
							key={index}
							style={{
								width: '45px',
								height: '15px',
								background:
									index < 19 - this.state.turns ? 'red' : 'transparent',
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
					overflow: 'visible',
				}}
				viewBox="0 0 500 500"
			>
				{transpose(this.state.field).map((row, y) => (
					<g key={y}>
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
					<g key={playerIndex}>
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
				{this.state.tempBlocks &&
					this.state.tempBlocks.map((block, playerIndex) => (
						<rect
							key={playerIndex}
							width="150"
							height="50"
							transform={`translate(${block.x * 50 - 25}, ${block.y * 50 -
								25}) ${
								block.rot === 1 ? 'rotate(90)' : ''
							} scale(${block.scale}) translate(-75, -25)`}
							opacity={block.opacity}
							fill={playerIndex === 0 ? 'red' : 'blue'}
							style={{
								transition: 'all 0.5s',
							}}
						/>
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
				<div>{this.data.players[1]}</div>
				<div
					style={{
						fontSize: '5em',
						fontWeight: 'bold',
					}}
				>
					{this.state.points[1]}
				</div>
				{Array(20)
					.fill()
					.map((_, index) => (
						<div
							key={index}
							style={{
								width: '45px',
								height: '15px',
								background:
									index < 19 - this.state.turns ? 'blue' : 'transparent',
								marginTop: '5px',
							}}
						/>
					))}
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
				) : (
					this.data.result === 'pending' ? (
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
					)
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
							textShadow:
								'-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white',
							width: '100%',
							textAlign: 'center',
						}}
					>
						{this.state.winner === 0
							? 'Draw'
							: `Winner: ${this.data.players[this.state.winner - 1]}`}
					</div>
				)}
			</div>
		);
	}
}

module.exports = App;
