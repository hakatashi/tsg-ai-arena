const {inspect} = require('util');
const noop = require('lodash/noop');
const sample = require('lodash/sample');
const sumBy = require('lodash/sumBy');

module.exports.presets = {};

const normalize = (stdout) => {
	const line = stdout.toString().trim().split('\n')[0];
	const tokens = line.trim().split(/\s+/);
	const selectedArtifact = parseInt(tokens[0]);
	const usedArtifact = parseInt(tokens[0]);
	return {
		selectedArtifact: Number.isNaN(selectedArtifact) ? 0 : selectedArtifact,
		usedArtifact: Number.isNaN(usedArtifact) ? 0 : usedArtifact,
	};
};

module.exports.normalize = normalize;

const calculateScore = (artifacts) => (
	Math.max(...artifacts.map(({statuses}) => {
		const attack = statuses.find(({status}) => status === 0)?.value ?? 0;
		const criticalRate = statuses.find(({status}) => status === 1)?.value ?? 0;
		const criticalDamage = statuses.find(({status}) => status === 2)?.value ?? 0;
		return attack + criticalDamage + criticalRate * 2;
	}))
);

module.exports.calculateScore = calculateScore;

const serialize = ({params, state}) => {
	const artifactLines = state.artifacts.map(({id, level, excessExperience, statuses}) => {
		const statusValues = Array(10).fill(0);
		for (const status of statuses) {
			statusValues[status.status] = status.value;
		}
		return `${id} ${level} ${excessExperience} ${statuses.length} ${statusValues.join(' ')}`;
	});

	return (
		`${[
			`${state.turns} ${params.artifacts} ${state.artifacts.length} ${state.experience} ${params.experience}`,
			...artifactLines,
		].join('\n')}\n`
	);
};

const deserialize = (stdin) => {
	const lines = stdin.trim().split('\n').map((line) => line.split(' '));

	return {
		params: {
			artifacts: parseInt(lines[0][1]),
			experience: parseInt(lines[0][4]),
		},
		state: {
			turns: parseInt(lines[0][0]),
			experience: parseInt(lines[0][3]),
			artifacts: lines.slice(1).map(([id, level, excessExperience, _statusCount, ...statusValues]) => ({
				id: parseInt(id),
				level: parseInt(level),
				excessExperience: parseInt(excessExperience),
				statuses: statusValues.map((value, index) => ({
					status: index,
					value: parseFloat(value),
				})).filter(({value}) => value > 0),
			})),
		},
	};
};

module.exports.deserialize = deserialize;

const weightedRandom = (weights) => {
	const sum = weights.reduce((a, b) => a + b, 0);
	const r = Math.random() * sum;
	let acc = 0;

	for (const [i, weight] of weights.entries()) {
		acc += weight;
		if (r < acc) {
			return i;
		}
	}

	return weights.length - 1;
};

const selectStatus = (forbiddenStatuses) => {
	const weights = [10, 7.5, 7.5, 15, 10, 15, 10, 15, 10, 10];

	for (const statusIndex of forbiddenStatuses) {
		weights[statusIndex] = 0;
	}

	return weightedRandom(weights);
};

const selectStatusValue = (status) => {
	if (status === 0) {
		return sample([4.1, 4.7, 5.3, 5.8]);
	}
	if (status === 1) {
		return sample([2.7, 3.1, 3.5, 3.9]);
	}
	if (status === 2) {
		return sample([5.4, 6.2, 7.0, 7.8]);
	}
	return 1;
};

const generateArtifacts = (count) => {
	const artifacts = [];

	for (const i of Array(count).keys()) {
		const selectedStatuses = [];
		const statuses = [];
		const statusCount = Math.random() < 0.8 ? 3 : 4;

		for (const _j of Array(statusCount).keys()) {
			const status = selectStatus(selectedStatuses);
			selectedStatuses.push(status);
			statuses.push({
				status,
				value: selectStatusValue(status),
			});
		}

		artifacts.push({
			id: i + 1,
			level: 0,
			excessExperience: 0,
			statuses,
		});
	}

	return artifacts;
};

const requiredExperiences = [
	16300,
	28425,
	42425,
	66150,
	117175,
];

const incrementLevel = (artifact) => {
	if (artifact.level === 0 && artifact.statuses.length === 3) {
		const selectedStatus = selectStatus(artifact.statuses.map(({status}) => status));
		artifact.statuses.push({
			status: selectedStatus,
			value: selectStatusValue(selectStatus),
		});
	} else {
		const selectedStatus = sample(artifact.statuses);
		selectedStatus.value += selectStatusValue(selectedStatus.status);
	}

	artifact.level++;
};

module.exports.battler = async (execute, params, {onFrame = noop, initState} = {}) => {
	const artifacts = generateArtifacts(params.artifacts);
	let state = initState || {
		artifacts,
		turns: 0,
		experience: params.experience,
	};

	while (1) {
		const deserializedData = deserialize(serialize({params, state}));
		state = deserializedData.state;

		const {stdout} = await execute(serialize({params, state}), 0);
		const {selectedArtifact} = normalize(stdout);

		if (selectedArtifact === 0) {
			break;
		}

		const artifact = state.artifacts.find(({id}) => id === selectedArtifact);

		if (artifact === undefined) {
			break;
		}

		if (artifact.level === 5) {
			break;
		}

		const requiredExperience = requiredExperiences[artifact.level];

		if (state.experience < requiredExperience) {
			break;
		}

		incrementLevel(artifact);

		state.experience -= requiredExperience;
		state.turns++;

		console.log(inspect(state, {depth: null}));

		onFrame(state);
	}

	const score = calculateScore(state.artifacts);

	return {
		result: 'settled',
		winner: 0,
		scores: [score],
	};
};

module.exports.configs = [
	{
		default: true,
		id: 'small',
		name: 'small',
		params: {
			artifacts: 10,
			experience: 270475,
		},
	},
	{
		id: 'medium',
		name: 'medium',
		params: {
			artifacts: 100,
			experience: 2704750,
		},
	},
	{
		id: 'large',
		name: 'large',
		params: {
			artifacts: 300,
			experience: 4057125,
		},
	},
];

module.exports.matchConfigs = [
	...Array(3).fill().map(() => ({
		config: 'small',
		players: [0],
	})),
	...Array(30).fill().map(() => ({
		config: 'medium',
		players: [0],
	})),
	...Array(30).fill().map(() => ({
		config: 'large',
		players: [0],
	})),
];

module.exports.judgeMatch = (results) => ({
	result: results[0].result,
	winner: results[0].winner,
	scores: [sumBy(results, ({scores}) => scores[0])],
});

if (require.main === module) {
	const params = {
		artifacts: 100,
		experience: 2704750,
	};
	const artifacts = generateArtifacts(params.artifacts);
	const initialState = {
		artifacts,
		turns: 0,
		experience: params.experience,
	};

	const data = serialize({params, state: initialState});

	console.log(data);
}
