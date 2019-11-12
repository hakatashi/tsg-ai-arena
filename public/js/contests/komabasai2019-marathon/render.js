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
		$app.style.display = 'flex';
		$app.style.justifyContent = 'center';
		$app.style.alignItems = 'center';
		$app.innerHTML = '<p style="font-size: 2rem;">Dataset is too large!</p>';
		return;
	}

	const radiusOf = (value) => {
		return 15 + Math.log10(1 + value ** 2) * 8;
	};

	const nodes = [];
	const links = [];
	const animations = [];
	const appendData = (syntaxTree) => {
		switch (syntaxTree.type) {
			case 'literal': {
				const id = nodes.length;
				const value = syntaxTree.value.valueOf();
				nodes.push({
					id,
					type: 'literal',
					label: `${value}`,
					scale: 1,
					radius: radiusOf(value),
				});
				return id;
			}
			case 'operation':
			case 'chain': {
				const lhsId = appendData(syntaxTree.lhs);
				const rhsId = appendData(syntaxTree.rhs);
				const id = nodes.length;
				const value = contest.evaluate(syntaxTree).valueOf();
				nodes.push({
					id,
					type: syntaxTree.type,
					label: `${value}`,
					scale: 0,
					radius: radiusOf(value),
				});
				links.push({
					source: lhsId,
					target: id,
					distance: 50,
				});
				links.push({
					source: rhsId,
					target: id,
					distance: 50,
				});
				animations.push({
					parent: id,
					children: [lhsId, rhsId],
					syntaxTree,
				});
				return id;
			}
			case 'parenthesization': {
				return appendData(syntaxTree.body);
			}
		}
	};

	appendData(rootTree);

	const {width, height} = $app.getBoundingClientRect();

	const svg = d3.select('#app').append('svg');

	svg.attr('width', width);
	svg.attr('height', height);

	const link = svg
		.selectAll('line')
		.data(links)
		.enter()
		.append('line')
		.attr('stroke-width', 2)
		.attr('stroke', 'tomato')
		.attr('stroke-linejoin', 'round')
		.attr('stroke-linecap', 'round')
		.attr('opacity', 0);

	const node = svg
		.selectAll('g')
		.data(nodes)
		.enter()
		.append('g')
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
		.text((d) => d.label);

	const simulation = d3.forceSimulation()
		.force('link', d3.forceLink().strength(0).distance((d) => d.distance))
		.force('collide', d3.forceCollide().radius((d) => d.radius * d.scale + 5))
		.force('charge', d3.forceManyBody().strength((0)))
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
				.attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(${d.scale})`);
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

	const animate = (index) => {
		const animation = animations[index];
		const targetLinks = link.filter((d) => d.target.id === animation.parent);
		const parentNode = node.filter((d) => d.id === animation.parent);
		const childNodes = node.filter((d) => animation.children.includes(d.id));
		const parentDatum = nodes.filter((d) => d.id === animation.parent);
		const childData = nodes.filter((d) => animation.children.includes(d.id));
		simulation.force('center', null);
		simulation.force('link').links([
			{
				target: animation.children[0],
				source: animation.children[1],
			},
		]);
		simulation.force('link').distance(0);
		simulation.force('link').strength(1);
		simulation.force('collide').radius((d) => animation.children.includes(d.id) ? d.radius : d.radius * d.scale + 5);
		simulation.alphaTarget(0.1).restart();
		setTimeout(() => {
			simulation.alphaTarget(0);
		}, 1000);
		parentNode
			.selectAll('circle')
			.transition()
			.ease(d3.easePoly)
			.delay(0)
			.duration(400)
			.attr('fill', 'tomato');
		childNodes
			.selectAll('circle')
			.transition()
			.ease(d3.easePoly)
			.delay(0)
			.duration(400)
			.attr('fill', 'tomato');
		parentNode
			.transition()
			.ease(d3.easePoly)
			.delay(1000)
			.duration(400)
			.tween('radius', (d) => {
				return (t) => {
					d.scale = t;
					parentNode
						.attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(${d.scale})`);
					simulation.nodes(nodes);
					simulation.restart();
				};
			});
		childNodes
			.transition()
			.ease(d3.easePoly)
			.delay(1000)
			.duration(400)
			.tween('radius', (d) => {
				return (t) => {
					d.scale = 1 - t;
					childNodes
						.attr('transform', (d) => `translate(${d.x}, ${d.y}) scale(${d.scale})`);
					simulation.nodes(nodes);
					simulation.restart();
				};
			});
		parentNode
			.selectAll('circle')
			.transition()
			.ease(d3.easePoly)
			.delay(1000)
			.duration(400)
			.attr('fill', 'LightSalmon');
		childNodes
			.selectAll('circle')
			.transition()
			.ease(d3.easePoly)
			.delay(1000)
			.duration(400)
			.attr('fill', 'LightSalmon');
	};

	for (let i = 0; i < animations.length; i++) {
		setTimeout(() => {
			animate(i);
		}, 2000 * (i + 1));
	}
};

module.exports = render;
