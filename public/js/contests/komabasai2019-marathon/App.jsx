const React = require('react');
const bigRat = require('big-rational');
const contest = require('../../../../contests/komabasai2019-marathon.js');

/**
 * @type {Object.<string, React.CSSProperties>}
 */
const style = {
	literal: {
		display: 'flex',
		margin: 5,
		border: 'solid 1px #777',
		borderRadius: '10%',
		backgroundColor: '#ddd',
		color: '#000',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	operation: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
	operator: {
		display: 'flex',
		width: 30,
		height: 30,
		margin: 5,
		border: 'solid 1px #777',
		borderRadius: '50%',
		backgroundColor: '#ddd',
		color: '#000',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	chain: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	parenthesization: {
		display: 'flex',
		margin: 5,
		border: 'solid 1px #777',
		borderRadius: '5px',
		backgroundColor: '#ddd',
		color: '#000',
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	parenthesis: {
		display: 'flex',
		width: 10,
		height: 60,
		margin: 5,
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
};

const SyntaxTree = ({of: syntaxTree}) => {
	switch (syntaxTree.type) {
		case 'literal': {
			return (
				<span
					style={{
						...style.literal,
						width: 60,
						height: 60,
					}}
				>
					{syntaxTree.value.valueOf()}
				</span>
			);
		}
		case 'operation': {
			return (
				<span style={style.operation}>
					<SyntaxTree of={syntaxTree.lhs}/>
					<span style={style.operator}>{syntaxTree.operator}</span>
					<SyntaxTree of={syntaxTree.rhs}/>
				</span>
			);
		}
		case 'chain': {
			return (
				<span style={style.chain}>
					<SyntaxTree of={syntaxTree.lhs}/>
					<SyntaxTree of={syntaxTree.rhs}/>
				</span>
			);
		}
		case 'parenthesization': {
			return (
				<span style={style.parenthesization}>
					<span style={style.parenthesis}>(</span>
					<SyntaxTree of={syntaxTree.body}/>
					<span style={style.parenthesis}>)</span>
				</span>
			);
		}
	}
};

class App extends React.Component {
	constructor(props, state) {
		super(props, state);
		this.data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));
		this.input = this.data.turns[0].input;
		this.output = this.data.turns[0].stdout;
		this.syntaxTree = contest.parse(contest.normalize(this.output));
	}

	render() {
		return (
			<div className="container mt-3 mb-3">
				<div style={{maxWidth: '100%', overflowX: 'auto'}}>
					<SyntaxTree of={this.syntaxTree}/>
				</div>
				<h2>Input</h2>
				<pre>{this.input}</pre>
				<h2>Output</h2>
				<pre>{this.output}</pre>
			</div>
		);
	}
}

module.exports = App;
