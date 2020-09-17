const React = require('react');
const bigRat = require('big-rational');
const contest = require('../../../../contests/komabasai2019-marathon.js');
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
} = require('@fortawesome/free-solid-svg-icons');

const sizeOfLiteralBar = (value, maxValue) => {
	return 60 + (contest.myLog10(value.abs().add(bigRat.one)) / contest.myLog10(maxValue.add(bigRat.one))) * 300;
};

const sizeOfOperationBar = (value, maxValue) => {
	return value / maxValue * 600;
};

const TRANSITION_DURATION = 250;

const evaluateChain = (syntaxTree) => {
	switch (syntaxTree.type) {
		case 'literal': {
			return [false, syntaxTree];
		}
		case 'operation': {
			const [lhsChanged, lhs] = evaluateChain(syntaxTree.lhs);
			if (lhsChanged) {
				return [true, {...syntaxTree, lhs}];
			}
			const [rhsChanged, rhs] = evaluateChain(syntaxTree.rhs);
			if (rhsChanged) {
				return [true, {...syntaxTree, rhs}];
			}
			return [false, syntaxTree];
		}
		case 'chain': {
			return evaluateOnce(syntaxTree);
		}
		case 'parenthesization': {
			const [bodyChanged, body] = evaluateChain(syntaxTree.body);
			if (bodyChanged) {
				return [true, {...syntaxTree, body}];
			}
			return [false, syntaxTree];
		}
	}
};

const evaluateOnce = (syntaxTree) => {
	switch (syntaxTree.type) {
		case 'literal': {
			return [null, syntaxTree];
		}
		case 'operation':
		case 'chain': {
			const [lhsChanged, lhs] = evaluateOnce(syntaxTree.lhs);
			if (lhsChanged) {
				return [lhsChanged, {...syntaxTree, lhs}];
			}
			const [rhsChanged, rhs] = evaluateOnce(syntaxTree.rhs);
			if (rhsChanged) {
				return [rhsChanged, {...syntaxTree, rhs}];
			}
			return [
				syntaxTree.type === 'operation' ? syntaxTree.operator : '^',
				{
					type: 'literal',
					value: contest.evaluate(syntaxTree),
					id: uniqueId(),
				},
			];
		}
		case 'parenthesization': {
			const [bodyChanged, body] = evaluateOnce(syntaxTree.body);
			if (bodyChanged) {
				return [bodyChanged, {...syntaxTree, body}];
			}
			return ['()', syntaxTree.body];
		}
	}
};

const giveId = (syntaxTree) => {
	const id = uniqueId();
	switch (syntaxTree.type) {
		case 'literal': {
			return {...syntaxTree, id};
		}
		case 'operation':
		case 'chain': {
			return {...syntaxTree, id, lhs: giveId(syntaxTree.lhs), rhs: giveId(syntaxTree.rhs)};
		}
		case 'parenthesization': {
			return {...syntaxTree, id, body: giveId(syntaxTree.body)};
		}
	}
};

const generateHistory = (rootTree) => {
	let changed = false;
	let syntaxTree = rootTree;
	let statistics = {'+': 0, '-': 0, '*': 0, '/': 0};
	const history = [{statistics, syntaxTree}];
	while (true) {
		[changed, syntaxTree] = evaluateChain(syntaxTree);
		if (changed) {
			history.push({statistics, syntaxTree});
		} else {
			break;
		}
	}
	while (true) {
		try {
			[changed, syntaxTree] = evaluateOnce(syntaxTree);
			if (changed) {
				if (changed in statistics) {
					statistics = {...statistics, [changed]: statistics[changed] + 1};
				}
				history.push({statistics, syntaxTree});
			} else {
				break;
			}
		} catch (err) {
			console.log(err);
			break;
		}
	}
	return history;
};

const getMax = (syntaxTree) => {
	switch (syntaxTree.type) {
		case 'literal': {
			return {...syntaxTree, value: syntaxTree.value.abs()};
		}
		case 'operation':
		case 'chain': {
			const lhs = getMax(syntaxTree.lhs);
			const rhs = getMax(syntaxTree.rhs);
			const self = {type: 'literal', value: contest.evaluate({...syntaxTree, lhs, rhs})};
			return [lhs, rhs, self].reduce((a, b) => a.value.geq(b.value) ? a : b);
		}
		case 'parenthesization': {
			return getMax(syntaxTree.body);
		}
	}
};

const SyntaxTree = ({of: syntaxTree, maxValue}) => {
	switch (syntaxTree.type) {
		case 'literal': {
			const {value} = syntaxTree;
			const size = sizeOfLiteralBar(value, maxValue);
			return (
				<SwitchTransition>
					<CSSTransition key={syntaxTree.id} timeout={TRANSITION_DURATION} classNames="tree">
						<span
							className={
								value.geq(bigRat.zero) ? 'literal literal-positive' : 'literal literal-negative'
							}
							style={{
								height: size,
							}}
						>
							{value.toDecimal(1)}
						</span>
					</CSSTransition>
				</SwitchTransition>
			);
		}
		case 'operation': {
			const operator = {
				'+': '+',
				'-': '-',
				'*': '×',
				'/': '÷',
			}[syntaxTree.operator];
			return (
				<SwitchTransition>
					<CSSTransition key={syntaxTree.id} timeout={TRANSITION_DURATION} classNames="tree">
						<div className="tree operation">
							<SyntaxTree of={syntaxTree.lhs} maxValue={maxValue} />
							<span className="operator">{operator}</span>
							<SyntaxTree of={syntaxTree.rhs} maxValue={maxValue} />
						</div>
					</CSSTransition>
				</SwitchTransition>
			);
		}
		case 'chain': {
			return (
				<SwitchTransition>
					<CSSTransition key={syntaxTree.id} timeout={TRANSITION_DURATION} classNames="tree">
						<div className="tree chain">
							<SyntaxTree of={syntaxTree.lhs} maxValue={maxValue} />
							<SyntaxTree of={syntaxTree.rhs} maxValue={maxValue} />
						</div>
					</CSSTransition>
				</SwitchTransition>
			);
		}
		case 'parenthesization': {
			return (
				<SwitchTransition>
					<CSSTransition key={syntaxTree.id} timeout={TRANSITION_DURATION} classNames="tree">
						<div className="tree parenthesization">
							<span className="parenthesis">(</span>
							<SyntaxTree of={syntaxTree.body} maxValue={maxValue} />
							<span className="parenthesis">)</span>
						</div>
					</CSSTransition>
				</SwitchTransition>
			);
		}
	}
};

const SyntaxTreeWithoutTransition = ({of: syntaxTree, maxValue}) => {
	switch (syntaxTree.type) {
		case 'literal': {
			const {value} = syntaxTree;
			const size = sizeOfLiteralBar(value, maxValue);
			return (
				<>
					<span
						className={
							value.geq(bigRat.zero) ? 'literal literal-positive' : 'literal literal-negative'
						}
						style={{
							height: size,
						}}
					>
						{value.toDecimal(1)}
					</span>
				</>
			);
		}
		case 'operation': {
			const operator = {
				'+': '+',
				'-': '-',
				'*': '×',
				'/': '÷',
			}[syntaxTree.operator];
			return (
				<>
					<SyntaxTreeWithoutTransition of={syntaxTree.lhs} maxValue={maxValue} />
					<span className="operator">{operator}</span>
					<SyntaxTreeWithoutTransition of={syntaxTree.rhs} maxValue={maxValue} />
				</>
			);
		}
		case 'chain': {
			return (
				<>
					<SyntaxTreeWithoutTransition of={syntaxTree.lhs} maxValue={maxValue} />
					<SyntaxTreeWithoutTransition of={syntaxTree.rhs} maxValue={maxValue} />
				</>
			);
		}
		case 'parenthesization': {
			return (
				<>
					<span className="parenthesis">(</span>
					<SyntaxTreeWithoutTransition of={syntaxTree.body} maxValue={maxValue} />
					<span className="parenthesis">)</span>
				</>
			);
		}
	}
};

class App extends React.Component {
	constructor(props, state) {
		super(props, state);
		const data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));
		const input = data.turns[0].input;
		const output = data.turns[0].stdout;
		const rootTree = giveId(contest.parse(contest.normalize(output)));
		const history = generateHistory(rootTree);
		const maxValue = getMax(rootTree).value;
		const maxOperation = Math.max(...Object.values(history[history.length - 1].statistics));
		console.log('Input:');
		console.log(input);
		console.log('Output:');
		console.log(output);
		this.state = {
			playing: false,
			history,
			index: 0,
			intervalId: null,
			maxValue,
			maxOperation,
			useTransition: data.config.params.length <= 20,
		};
		this.handleFastBackward = this.handleFastBackward.bind(this);
		this.handleStepBackward = this.handleStepBackward.bind(this);
		this.handlePlay = this.handlePlay.bind(this);
		this.handlePause = this.handlePause.bind(this);
		this.handleStepForward = this.handleStepForward.bind(this);
		this.handleFastForward = this.handleFastForward.bind(this);
	}

	handleFastBackward() {
		this.setState({index: 0});
	}

	handleStepBackward() {
		this.setState((state) => ({index: Math.max(0, state.index - 1)}));
	}

	handlePlay() {
		const interval = this.state.useTransition ? 1000 : 1;
		const intervalId = setInterval(() => {
			if (this.state.index < this.state.history.length - 1) {
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
		this.setState((state) => ({index: Math.min(state.history.length - 1, state.index + 1)}));
	}

	handleFastForward() {
		this.setState((state) => ({index: state.history.length - 1}));
	}

	render() {
		const {playing, history, index, maxValue, maxOperation, useTransition} = this.state;
		return (
			<div className="wrapper">
				<div className={`statistics ${useTransition ? 'use-transition' : ''}`}>
					<div className="statistics-item">
						<span className="statistics-title">+</span>
						<div className="statistics-bar statistics-bar-add" style={{width: sizeOfOperationBar(history[index].statistics['+'], maxOperation)}} />
					</div>
					<div className="statistics-item">
						<span className="statistics-title">-</span>
						<div className="statistics-bar statistics-bar-sub" style={{width: sizeOfOperationBar(history[index].statistics['-'], maxOperation)}} />
					</div>
					<div className="statistics-item">
						<span className="statistics-title">×</span>
						<div className="statistics-bar statistics-bar-mul" style={{width: sizeOfOperationBar(history[index].statistics['*'], maxOperation)}} />
					</div>
					<div className="statistics-item">
						<span className="statistics-title">÷</span>
						<div className="statistics-bar statistics-bar-div" style={{width: sizeOfOperationBar(history[index].statistics['/'], maxOperation)}} />
					</div>
				</div>
				<div className="viewbox">
					<div className="viewbox-inner">
						<div className="tree">
							{
								useTransition
									? <SyntaxTree of={history[index].syntaxTree} maxValue={maxValue} />
									: <SyntaxTreeWithoutTransition of={history[index].syntaxTree} maxValue={maxValue} />
							}
						</div>
					</div>
				</div>
				<div className="toolbar">
					<div className="btn-group">
						<button
							type="button"
							className="btn btn-secondary"
							onClick={this.handleFastBackward}
							disabled={playing || index === 0}
							title="Fast Backward"
						>
							<FontAwesomeIcon icon={faFastBackward} fixedWidth />
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							onClick={this.handleStepBackward}
							disabled={playing || index === 0}
							title="Step Backward"
						>
							<FontAwesomeIcon icon={faStepBackward} fixedWidth />
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
							disabled={playing || index === history.length - 1}
							title="Step Forward"
						>
							<FontAwesomeIcon icon={faStepForward} fixedWidth />
						</button>
						<button
							type="button"
							className="btn btn-secondary"
							onClick={this.handleFastForward}
							disabled={playing || index === history.length - 1}
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
