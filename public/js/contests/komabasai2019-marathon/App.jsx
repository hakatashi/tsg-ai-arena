const React = require('react');
const bigRat = require('big-rational');
const contest = require('../../../../contests/komabasai2019-marathon.js');

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

const evaluateOnce = (syntaxTree) => {
	switch (syntaxTree.type) {
		case 'literal': {
			return syntaxTree;
		}
		case 'operation':
		case 'chain': {
			if (syntaxTree.lhs.type !== 'literal') {
				return {
					...syntaxTree,
					lhs: evaluateOnce(syntaxTree.lhs),
				};
			}
			if (syntaxTree.rhs.type !== 'literal') {
				return {
					...syntaxTree,
					rhs: evaluateOnce(syntaxTree.rhs),
				};
			}
			return {
				type: 'literal',
				value: contest.evaluate(syntaxTree),
			};
		}
		case 'parenthesization': {
			if (syntaxTree.body.type !== 'literal') {
				return {
					...syntaxTree,
					body: evaluateOnce(syntaxTree.body),
				};
			}
			return syntaxTree.body;
		}
	}
};

const evaluateChain = (syntaxTree) => {
	switch (syntaxTree.type) {
		case 'literal': {
			return [false, syntaxTree];
		}
		case 'operation': {
			const [lhsHasChain, lhs] = evaluateChain(syntaxTree.lhs);
			if (lhsHasChain) {
				return [true, {...syntaxTree, lhs}];
			}
			const [rhsHasChain, rhs] = evaluateChain(syntaxTree.rhs);
			if (rhsHasChain) {
				return [true, {...syntaxTree, rhs}];
			}
			return [false, syntaxTree];
		}
		case 'chain': {
			return [true, evaluateOnce(syntaxTree)];
		}
		case 'parenthesization': {
			const [bodyHasChain, body] = evaluateChain(syntaxTree.body);
			if (bodyHasChain) {
				return [true, {...syntaxTree, body}];
			}
			return [false, syntaxTree];
		}
	}
};

class App extends React.Component {
	constructor(props, state) {
		super(props, state);
		const data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));
		const input = data.turns[0].input;
		const output = data.turns[0].stdout;
		const rootTree = contest.parse(contest.normalize(output));
		const syntaxTree = rootTree;
		console.log('Input:');
		console.log(input);
		console.log('Output:');
		console.log(output);
		this.state = {
			status: 'paused',
			syntaxTree,
			hasChain: true,
			intervalId: null,
		};
		this.handleStep = this.handleStep.bind(this);
		this.handlePlay = this.handlePlay.bind(this);
		this.handlePause = this.handlePause.bind(this);
	}

	handleStep() {
		if (this.state.hasChain) {
			const [hasChain, syntaxTree] = evaluateChain(this.state.syntaxTree);
			if (hasChain) {
				this.setState({
					hasChain: true,
					syntaxTree,
				});
				return;
			}
		}
		this.setState({
			hasChain: false,
			syntaxTree: evaluateOnce(this.state.syntaxTree),
		});
	}

	handlePlay() {
		const intervalId = setInterval(() => {
			this.handleStep();
		}, 1000);
		this.setState({
			status: 'playing',
			intervalId,
		});
	}

	handlePause() {
		clearInterval(this.state.intervalId);
		this.setState({
			status: 'paused',
			intervalId: null,
		});
	}

	render() {
		return (
			<div className="wrapper p-3">
				<div className="viewbox">
					<SyntaxTree of={this.state.syntaxTree} />
				</div>
				<div className="toolbar">
					<div className="btn-group">
						{this.state.status === 'paused' ? (
							<button
								type="button"
								className="btn btn-secondary"
								onClick={this.handlePlay}
							>
								Play
							</button>
						) : (
							<button
								type="button"
								className="btn btn-secondary"
								onClick={this.handlePause}
							>
								Pause
							</button>
						)}
						<button
							type="button"
							className="btn btn-secondary"
							onClick={this.handleStep}
							disabled={this.state.status === 'playing'}
						>
							Step
						</button>
					</div>
				</div>
				{/* <h2>Input</h2>
				<pre>{this.input}</pre>
				<h2>Output</h2>
				<pre>{this.output}</pre> */}
			</div>
		);
	}
}

module.exports = App;
