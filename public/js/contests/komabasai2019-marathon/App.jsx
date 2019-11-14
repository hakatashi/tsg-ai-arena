const React = require('react');
const bigRat = require('big-rational');
const contest = require('../../../../contests/komabasai2019-marathon.js');
const {FontAwesomeIcon} = require('@fortawesome/react-fontawesome');
const {
	faFastBackward,
	faStepBackward,
	faPlay,
	faPause,
	faStepForward,
	faFastForward,
} = require('@fortawesome/free-solid-svg-icons');

const SyntaxTree = ({of: syntaxTree}) => {
	switch (syntaxTree.type) {
		case 'literal': {
			const {value} = syntaxTree;
			const size = 60 + contest.myLog10(value.abs().add(bigRat.one)) * 10;
			return (
				<span
					className={
						value.geq(bigRat.zero) ? 'literal literal-positive' : 'literal literal-negative'
					}
					style={{
						width: 30,
						height: size,
					}}
				>
					{value.toDecimal(1)}
				</span>
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
				<span className="operation">
					<SyntaxTree of={syntaxTree.lhs} />
					<span className="operator">{operator}</span>
					<SyntaxTree of={syntaxTree.rhs} />
				</span>
			);
		}
		case 'chain': {
			return (
				<span className="chain">
					<SyntaxTree of={syntaxTree.lhs} />
					<SyntaxTree of={syntaxTree.rhs} />
				</span>
			);
		}
		case 'parenthesization': {
			return (
				<span className="parenthesization">
					<span className="parenthesis">(</span>
					<SyntaxTree of={syntaxTree.body} />
					<span className="parenthesis">)</span>
				</span>
			);
		}
	}
};

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
			return [false, syntaxTree];
		}
		case 'operation':
		case 'chain': {
			const [lhsChanged, lhs] = evaluateOnce(syntaxTree.lhs);
			if (lhsChanged) {
				return [true, {...syntaxTree, lhs}];
			}
			const [rhsChanged, rhs] = evaluateOnce(syntaxTree.rhs);
			if (rhsChanged) {
				return [true, {...syntaxTree, rhs}];
			}
			return [true, {
				type: 'literal',
				value: contest.evaluate(syntaxTree),
			}];
		}
		case 'parenthesization': {
			const [bodyChanged, body] = evaluateOnce(syntaxTree.body);
			if (bodyChanged) {
				return [true, {...syntaxTree, body}];
			}
			return [true, syntaxTree.body];
		}
	}
};

const generateHistory = (rootTree) => {
	let changed = false;
	let syntaxTree = rootTree;
	const history = [syntaxTree];
	while (true) {
		[changed, syntaxTree] = evaluateChain(syntaxTree);
		if (changed) {
			history.push(syntaxTree);
		} else {
			break;
		}
	}
	while (true) {
		try {
			[changed, syntaxTree] = evaluateOnce(syntaxTree);
			if (changed) {
				history.push(syntaxTree);
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

class App extends React.Component {
	constructor(props, state) {
		super(props, state);
		const data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));
		const input = data.turns[0].input;
		const output = data.turns[0].stdout;
		// const output = '1 2 3 + 4 5 6 * 7 8 9 / 0';
		const rootTree = contest.parse(contest.normalize(output));
		const history = generateHistory(rootTree);
		console.log('Input:');
		console.log(input);
		console.log('Output:');
		console.log(output);
		this.state = {
			playing: false,
			history,
			index: 0,
			intervalId: null,
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
		const intervalId = setInterval(() => {
			if (this.state.index < this.state.history.length - 1) {
				this.handleStepForward();
			} else {
				this.handlePause();
			}
		}, 1000);
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
		const {playing, history, index} = this.state;
		return (
			<div className="wrapper p-3">
				<div className="viewbox">
					<SyntaxTree of={history[index]} />
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
