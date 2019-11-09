/* eslint array-plural/array-plural: off */

const noop = require('lodash/noop');
const sumBy = require('lodash/sumBy');
const isEqual = require('lodash/isEqual');
const bigRat = require('big-rational');

module.exports.presets = {};

const initSeqs = (length, upper_bound) => {
	const usedNumbers = new Set();
	const newNumber = (usedNum, upper_bound) => {
		let ret = 0;
		do {
			ret = 1 + Math.floor(Math.random() * upper_bound);
		} while (usedNum.has(ret));
		usedNum.add(ret);
		return ret;
	};
	const sequence = Array(length).fill(0).map((index) => ({
		num: newNumber(usedNumbers, upper_bound),
	}));
	return sequence;
};

module.exports.initSeqs = initSeqs;

const getUsedNum = (stdout) => {
	const usedNum = stdout.toString().trim().split('\n')[0].replace(/[+\-*/ ()]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map((token) => parseInt(token)).sort();
	return usedNum;
};

module.exports.getUsedNum = getUsedNum;

const normalize = (stdout) => {
	const infixFormula = stdout.toString().trim().replace(/\s*([+\-*/()])\s*/g, '$1').replace(/ /g, '^').replace(/[+\-*/^()]/g, ' $& ').replace(/\s+/g, ' ').trim().split(' ');
	return infixFormula;
};

module.exports.normalize = normalize;

const deserialize = (stdin) => {
	const lines = stdin.split('\n').filter((line) => line.length > 0);
	const length = parseInt(lines[0]);
	const sequence = lines[1].split(' ').map((token) => parseInt(token)).sort();

	return {
		state: {
			sequence,
			score: 0,
		},
		params: {
			length,
		},
	};
};

module.exports.deserialize = deserialize;

const serialize = ({state, params}) => `${[
	`${params.length}`,
	state.sequence.map((cell) => cell.num.toString()).join(' '),
].join('\n')}\n`;

module.exports.serialize = serialize;

const evaluation = (infixFormula) => {
	const operatorStack = [];
	const operandStack = [];
	const level0Operator = ['^'];
	const level1Operator = ['*', '/', '^'];
	const level2Operator = ['+', '-', '*', '/', '^'];
	let topRawNumber = 0;
	const operation = () => {
		if (operandStack.length < 2) throw new Error('InvalidFormula');
		const lhs = operandStack.pop();
		const rhs = operandStack.pop();
		const operator = operatorStack.pop();
		if (operator === '+') {
			topRawNumber = 0;
			operandStack.push(rhs.add(lhs));
		} else if (operator === '-') {
			topRawNumber = 0;
			operandStack.push(rhs.subtract(lhs));
		} else if (operator === '*') {
			topRawNumber = 0;
			operandStack.push(rhs.multiply(lhs));
		} else if (operator === '/') {
			if (bigRat(0).compare(lhs) == 0) throw new Error('InvalidFormula');
			topRawNumber = 0;
			operandStack.push(rhs.divide(lhs));
		} else {
			if (topRawNumber < 2) throw new Error('InvalidFormula');
			--topRawNumber;
			operandStack.push(bigRat(rhs.num.toString() + lhs.num.toString()));
		}
	};
	for (const token of infixFormula) {
		if (token === '+' || token === '-') {
			while (operatorStack.length > 0 && level2Operator.includes(operatorStack[operatorStack.length - 1])) {
				operation();
			}
			operatorStack.push(token);
		} else if (token === '*' || token === '/') {
			while (operatorStack.length > 0 && level1Operator.includes(operatorStack[operatorStack.length - 1])) {
				operation();
			}
			operatorStack.push(token);
		} else if (token === '^') {
			while (operatorStack.length > 0 && level0Operator.includes(operatorStack[operatorStack.length - 1])) {
				operation();
			}
			operatorStack.push(token);
		} else if (token === '(') {
			operatorStack.push(token);
		} else if (token === ')') {
			while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
				operation();
			}
			if (operatorStack.length === 0) throw new Error('InvalidFormula');
			operatorStack.pop();
		} else {
			operandStack.push(bigRat(token));
			++topRawNumber;
		}
	}
	while (operatorStack.length > 0) {
		if (!level2Operator.includes(operatorStack[operatorStack.length - 1])) throw new Error('InvalidFormula');
		operation();
	}
	if (operandStack.length !== 1) throw new Error('InvalidFormula');
	return bigRat(100).subtract(operandStack.pop()).abs();
};

const myLog10 = (bigRatio) => {
	const sign = bigRatio.lt(1);
	const intLog = Math.abs(bigRatio.num.toString().length - bigRatio.denom.toString().length);
	if (sign) {
		bigRatio = bigRatio.multiply(bigRat('10').pow(intLog));
	} else {
		bigRatio = bigRatio.multiply(bigRat('1', '10').pow(intLog));
	}
	return Math.log10(bigRatio) - (sign ? intLog : -intLog);
};

module.exports.battler = async (
	execute,
	params,
	{onFrame = noop, initState} = {},
) => {
	const sequence = initSeqs(params.length, params.upper_bound);
	const initialState = initState || {
		score: 0,
		sequence,
	};
	const {state} = deserialize(serialize({params, state: initialState}));
	const {stdout} = await execute(serialize({params, state: initialState}), 0);
	const infixFormula = normalize(stdout, params);
	const usedNumbers = getUsedNum(stdout, params);
	if (isEqual(usedNumbers, state.sequence)) {
		try {
			const error = evaluation(infixFormula);
			state.score = Math.floor(myLog10(error.add(1)) * 100000000);
		} catch (e) {
			state.score = 1e12;
		}
	} else {
		if (usedNumbers.length <= 20) {
			console.log(usedNumbers);
			console.log(state.sequence);
		}
		state.score = 1e12;
	}
	return {
		result: 'settled',
		winner: 0,
		scores: [state.score],
	};
};

module.exports.configs = [
	{
		default: true,
		id: 'baby',
		name: 'komachi baby',
		params: {
			mode: 'one-path',
			length: 9,
			upper_bound: 9,
		},
	},
	{
		id: 'small',
		name: '5 small',
		params: {
			mode: 'random',
			length: 5,
			upper_bound: 9,
		},
	},
	{
		id: 'middle',
		name: '20 middle',
		params: {
			mode: 'random',
			length: 20,
			upper_bound: 99,
		},
	},
	{
		id: 'large',
		name: '1000 large',
		params: {
			mode: 'random',
			length: 1000,
			upper_bound: 99999999,
		},
	},
];


module.exports.matchConfigs = [
	...Array(1)
		.fill()
		.map(() => ({
			config: 'baby',
			players: [0],
		})),
	...Array(3)
		.fill()
		.map(() => ({
			config: 'small',
			players: [0],
		})),
	...Array(3)
		.fill()
		.map(() => ({
			config: 'middle',
			players: [0],
		})),
	...Array(3)
		.fill()
		.map(() => ({
			config: 'large',
			players: [0],
		})),
];

module.exports.judgeMatch = (results) => ({
	result: results[0].result,
	winner: results[0].winner,
	scores: [sumBy(results, ({scores}) => scores[0])],
});
