const d3 = require('d3');
const bigRat = require('big-rational');
const uniqueId = require('lodash/uniqueId');
const contest = require('../../../../contests/komabasai2019-marathon.js');

const render = () => {
	const data = JSON.parse(document.querySelector('meta[name="data"]').getAttribute('content'));
	const input = data.turns[0].input;
	const output = data.turns[0].stdout;
	const rootTree = contest.parse(contest.normalize(output));

	const $app = document.querySelector('#app');

	if (data.config.params.length > 20) {
		$app.append('Dataset is too large!');
		return;
	}

	const radiusOf = (value) => {
		return 15 + Math.log10(1 + value) * 15;
	};

	const nodes = [];
	const links = [];
	const appendData = (syntaxTree) => {
		switch (syntaxTree.type) {
			case 'literal': {
				const id = nodes.length;
				const value = syntaxTree.value.valueOf();
				nodes.push({
					id,
					type: 'literal',
					value,
					radius: radiusOf(value),
				});
				return id;
			}
			case 'operation':
			case 'chain': {
				const id = nodes.length;
				nodes.push({ id, type: syntaxTree.type });
				links.push({
					source: appendData(syntaxTree.lhs),
					target: id,
				});
				links.push({
					source: appendData(syntaxTree.rhs),
					target: id,
				});
				return id;
			}
			case 'parenthesization': {
				return appendData(syntaxTree.body);
			}
		}
	};

	appendData(rootTree);

	const width = $app.getBoundingClientRect().width;
	const height = $app.getBoundingClientRect().height;

	const svg = d3.select('#app').append('svg');

	svg.attr('width', width);
	svg.attr('height', height);

	const link = svg
		.selectAll('line')
		.data(links)
		.enter()
		.append('line')
		.attr('stroke-width', 1)
		.attr('stroke', 'black');

	const node = svg
		.selectAll('g')
		.data(nodes)
		.join('g')
		.attr('cursor', 'pointer');

	node
		.append('circle')
		.attr('r', (d) => d.radius)
		.attr('fill', 'LightSalmon');

	node
		.append('text')
		.attr('text-anchor', 'middle')
		.attr('dominant-baseline', 'central')
		.attr('fill', 'white')
		.attr('font-size', (d) => d.radius)
		.text((d) => d.value);

	const simulation = d3.forceSimulation()
		.force('link', d3.forceLink())
		.force('collide', d3.forceCollide().radius((d) => d.radius + 10))
		.force('charge', d3.forceManyBody())
		.force('center', d3.forceCenter(width / 2, height / 2));

	simulation
		.nodes(nodes)
		.on('tick', () => {
			link
				.attr('x1', (d) => d.source.x)
				.attr('y1', (d) => d.source.y)
				.attr('x2', (d) => d.target.x)
				.attr('y2', (d) => d.target.y);
			node
				.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
		});

	simulation
		.force('link')
		.links(links);

	node
		.call(d3.drag()
			.on('start', (d) => {
				if (!d3.event.active) simulation.alphaTarget(0.3).restart();
				d.fx = d.x;
				d.fy = d.y;
			})
			.on('drag', (d) => {
				d.fx = d3.event.x;
				d.fy = d3.event.y;
			})
			.on('end', (d) => {
				if (!d3.event.active) simulation.alphaTarget(0);
				d.fx = null;
				d.fy = null;
			}));
};

module.exports = render;
