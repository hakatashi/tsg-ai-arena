const React = require('react');
const bigRat = require('big-rational');
const {stripIndent} = require('common-tags');
const contest = require('../../../../contests/mayfes2020-marathon.js');
const {CSSTransition, TransitionGroup, SwitchTransition} = require('react-transition-group');
const uniqueId = require('lodash/uniqueId');
const {FontAwesomeIcon} = require('@fortawesome/react-fontawesome');
const {
	faFastBackward,
	faStepBackward,
	faPlay,
	faPause,
	faStepForward,
	faFastForward,
	faBroadcastTower
} = require('@fortawesome/free-solid-svg-icons');
const { ConnectionStates } = require('mongoose');

const TRANSITION_DURATION = 250;

const BOARD_SIZE = 600;

const BoardBackground = () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => {
	return (<rect
		key={'bg'+(i*10 + j).toString()}
		x={BOARD_SIZE / 10 * j}
		y={BOARD_SIZE / 10 * i}
		width={BOARD_SIZE / 10}
		height={BOARD_SIZE / 10}
		fill="none"
		stroke="lightgrey"
		strokeWidth={BOARD_SIZE / 300}
	/>);
}));

const LightsWithoutTransition = ({towers}) => {
	return towers.map((tower, idx) => (
		<circle
			key={'light' + idx.toString()}
			cx={(tower.x  * 2 / contest.BOARD_WIDTH + 1) * BOARD_SIZE / 2}
			cy={(tower.y * 2 / contest.BOARD_HEIGHT + 1) * BOARD_SIZE / 2}
			r={Math.sqrt(tower.antenna) / contest.BOARD_WIDTH * BOARD_SIZE}
			fillOpacity="0.5"
			fill="yellow"
			stroke="black"
			strokeWidth="2"
			strokeOpacity="50%"
		/>
	));
};

const LightsWithTransition = ({towers}) => {
	return towers.map((tower, idx) => (
		<SwitchTransition>
			<CSSTransition key={'dynlight-transition-' + idx.toString()} timeout={TRANSITION_DURATION} classNames="light">
				<circle
					key={'dynlight-' + idx.toString()}
					cx={(tower.x * 2 / contest.BOARD_WIDTH + 1) * BOARD_SIZE / 2}
					cy={(tower.y * 2 / contest.BOARD_HEIGHT + 1) * BOARD_SIZE / 2}
					r={Math.sqrt(tower.antenna) / contest.BOARD_WIDTH * BOARD_SIZE}
					fillOpacity="0.5"
					fill="yellow"
					stroke="black"
					strokeWidth="2"
					strokeOpacity="50%"
				/>
			</CSSTransition>
		</SwitchTransition>
	));
};

const Tower = ({tower}, id) => {
	const TOWER_SIZE = BOARD_SIZE/50;
	const tx = (tower.x * 2 / contest.BOARD_WIDTH + 1) * BOARD_SIZE / 2;
	const ty = (tower.y * 2 / contest.BOARD_HEIGHT + 1) * BOARD_SIZE / 2;
	return (
	<g key={'tower'+id.toString()}>
		<line
			x1={tx} y1={ty}
			x2={tx - TOWER_SIZE/2} y2={ty + TOWER_SIZE}
			stroke={tower.activated ? "red" : "black"}
			strokeWidth="2"
		/>
		<line
			x1={tx} y1={ty}
			x2={tx + TOWER_SIZE/2} y2={ty + TOWER_SIZE}
			stroke={tower.activated ? "red" : "black"}
			strokeWidth="2"
		/>
		<line
			x1={tx - TOWER_SIZE / 4} y1={ty + TOWER_SIZE / 1.5}
			x2={tx + TOWER_SIZE / 4} y2={ty + TOWER_SIZE / 1.5}
			stroke={tower.activated ? "red" : "black"}
			strokeWidth="2"
		/>
		<circle
			cx={tx} cy={ty}
			r={TOWER_SIZE/5}
			fill={tower.activated ? "red" : "black"}
		/>
		{tower.activated ? (
			<path
				d={'M ' + (tx + 0.87 * TOWER_SIZE / 3*2).toString() + ' ' + (ty - 0.5 * TOWER_SIZE / 2).toString() + ' a 100 100 -30 0 1 0 ' + (TOWER_SIZE / 2).toString()}
				fill="none"
				stroke="red"
				strokeWidth="2"
			/>) : (<></>)}
		{tower.activated ? (
			<path
				d={'M ' + (tx - 0.87 * TOWER_SIZE / 3*2).toString() + ' ' + (ty - 0.5 * TOWER_SIZE / 2).toString() + ' a 100 100 30 0 1 0 ' + (TOWER_SIZE / 2).toString()}
				fill="none"
				stroke="red"
				strokeWidth="2"
			/>) : (<></>)}
		<text
			x={tx} y={ty - TOWER_SIZE / 4}
			fontSize={TOWER_SIZE}
			textAnchor="middle"
			color="black"
		>
			{Number(tower.cost)}
		</text>
	</g>);
};
const Towers = ({towers}) => {
	return towers.map((tower, idx) => (<Tower tower={tower} id={idx}/>));
};

const calcTotalTime = (towers, operations) => {
	const cur = [].concat(towers);
	let time = 0n;
	operations.forEach((op) => {
		const state = contest.operate(cur, op, time);
		time = state.time;
	});

	return time;
};

const forwardHistory = (towers, operations, history, index) => {
	const tower = towers[operations[index].id - 1];
	tower.pressed += history[index].time - (index == 0 ? 0n : history[index - 1].time);
	tower.antenna = Number(tower.pressed * 100n / tower.cost) / 100;
	history[index].activatedList.forEach(i => {
		towers[i].activated = true;
	});
};

const rewindHistory = (towers, operations, history, index) => {
	const tower = towers[operations[index - 1].id - 1];
	tower.pressed -= history[index - 1].time - (index == 1 ? 0n : history[index - 2].time);
	tower.antenna = Number(tower.pressed * 100n / tower.cost) / 100;
	history[index - 1].activatedList.forEach(i => {
		towers[i].activated = false;
	});
};

const advanceClock = (towers, operations, deltaTime, operatingIndex, operatingTime, totalTime) => {
	totalTime -= operatingTime;
	towers[operations[operatingIndex].id - 1].pressed -= BigInt(operatingTime);
	deltaTime += operatingTime;

	while (deltaTime > 0 && operatingIndex < operations.length) {
		const tower = towers[operations[operatingIndex].id - 1];
		
		totalTime += Math.min(deltaTime, Number(operations[operatingIndex].t));
		tower.pressed += BigInt(Math.min(deltaTime, Number(operations[operatingIndex].t)));
		tower.antenna = Number(tower.pressed * 100n / tower.cost) / 100;
		deltaTime -= Number(operations[operatingIndex].t);

		for (let i = 0; i < towers.length; i++) {
			const tw = towers[i];
			if (contest.normSq(tower, tw) * tower.cost <= tower.pressed)
				towers[i].activated = true;
		}
		
		if (deltaTime >= 0)
			operatingIndex += 1;
	}

	return {
		operatingIndex,
		operatingTime : (operatingIndex >= operations.length ? 0 : Number(operations[operatingIndex].t) + deltaTime),
		totalTime
	};
};

class App extends React.Component {
	constructor(props, state) {
		super(props, state);
		const data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));

		const input = data.turns[0].input;
		const output = data.turns[0].stdout;

		const towers = contest.parseInput(input);
		towers[0].activated = true;
		const operations = contest.parseOutput(output);
		const totalTime = calcTotalTime(_.cloneDeep(towers), operations);

		console.log('Input:');
		console.log(input);
		console.log('Output:');
		console.log(output);

		this.state = {
			playing: false,
			towers,
			operations,
			timeDelta: Number(totalTime / BigInt(300)),
			time: 0,
			originalTowers : _.cloneDeep(towers),
			operatingIndex: 0,
			operatingTime: 0,
			useTransition: data.config.params.length <= 50,
			intervalId: null
		};

		this.handleFastBackward = this.handleFastBackward.bind(this);
		this.handleStepBackward = this.handleStepBackward.bind(this);
		this.handlePlay = this.handlePlay.bind(this);
		this.handlePause = this.handlePause.bind(this);
		this.handleStepForward = this.handleStepForward.bind(this);
		this.handleFastForward = this.handleFastForward.bind(this);
	}

	handleFastBackward() {
		const {originalTowers} = this.state;

		this.setState(() => ({towers: _.cloneDeep(originalTowers), operatingIndex: 0, operatingTime: 0, time: 0}));
	}

	handleStepBackward() {
		const {history, towers, operations, index} = this.state;
		rewindHistory(towers, operations, history, index);
		this.setState((state) => ({index: Math.max(0, state.index - 1)}));
	}

	handlePlay() {
		console.log(this);
		const interval = this.state.useTransition ? 1 : 1;
		const intervalId = setInterval(() => {
			if (this.state.operatingIndex < this.state.operations.length) {
				this.handleStepForward();
			} else {
				this.handlePause();
			}
		}, interval);
		this.setState({
			playing: true,
			intervalId,
		});
	}

	handlePause() {
		clearInterval(this.state.intervalId);
		this.setState({
			playing: false,
			intervalId: null,
		});
	}

	handleStepForward() {
		const {towers, operations, operatingIndex, operatingTime, time, timeDelta} = this.state;
		const ret = advanceClock(towers, operations, timeDelta, operatingIndex, operatingTime, time);
		
		this.setState((state) => ({time: ret.totalTime, operatingIndex: ret.operatingIndex, operatingTime: ret.operatingTime}));
	}

	handleFastForward() {
		const {towers, operations, operatingIndex, operatingTime, time} = this.state;
		const ret = advanceClock(towers, operations, contest.WORST_SCORE, operatingIndex, operatingTime, time);
		
		this.setState((state) => ({time: ret.totalTime, operatingIndex: ret.operatingIndex, operatingTime: ret.operatingTime}));
	}

	render() {
		const {playing, towers, operations, operatingIndex, operatingTime, useTransition, time} = this.state;
		return (
			<div className="wrapper">
				<div className="viewbox">
					<div className="viewbox-inner">
						<svg
						style={{
							display: 'block',
							width: '600px',
							height: '600px',
							margin: '0 auto',
							border: '1px solid #555',
							boxSizing: 'content-box',
							position: 'relative',
						}}
						viewBox="0 0 600 600"
						>
							<BoardBackground/>
							{useTransition ? <LightsWithTransition towers={towers}/> : <LightsWithoutTransition towers={towers}/>}
							<Towers towers={towers}/>
						</svg>
					</div>
				</div>
				<div
					className="score"
					style={{ color : (operatingIndex == operations.length ? 'green' : 'black')}}>
					{`Time: ${time}`}
				</div>
				<div className="toolbar">
					<div className="btn-group">
						<button
							type="button"
							className="btn btn-secondary"
							onClick={this.handleFastBackward}
							disabled={playing || time === 0}
							title="Fast Backward"
						>
							<FontAwesomeIcon icon={faFastBackward} fixedWidth />
						</button>
						{playing
							? (
								<button
									type="button"
									className="btn btn-secondary"
									onClick={this.handlePause}
									title="Pause"
								>
									<FontAwesomeIcon icon={faPause} fixedWidth />
								</button>
							) : (
								<button
									type="button"
									className="btn btn-secondary"
									onClick={this.handlePlay}
									title="Play"
								>
									<FontAwesomeIcon icon={faPlay} fixedWidth />
								</button>
							)}
						<button
							type="button"
							className="btn btn-secondary"
							onClick={this.handleStepForward}
							disabled={playing || operatingIndex == operations.length}
							title="Step Forward"
						>
							<FontAwesomeIcon icon={faStepForward} fixedWidth />
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							onClick={this.handleFastForward}
							disabled={playing || operatingIndex == operations.length}
							title="Fast Forward"
						>
							<FontAwesomeIcon icon={faFastForward} fixedWidth />
						</button>
					</div>
				</div>
			</div>
		);
	}
}

module.exports = App;
