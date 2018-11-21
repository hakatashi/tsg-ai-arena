/* eslint array-plural/array-plural: off, no-nested-ternary: off */

const React = require('react');
const cloneDeep = require('lodash/cloneDeep');
const pick = require('lodash/pick');
const contest = require('../../../../contests/komabasai2018-procon.js');

class App extends React.Component {
	constructor(props, state) {
		super(props, state);

		this.data = JSON.parse(
			document.querySelector('meta[name="data"]').getAttribute('content')
		);

		const input = contest.deserialize(this.data.turns[0].input);
		const iwashiMap = Array(input.params.height).fill.map(
			Array(input.params.width).fill(0)
		);
		for (const i of input.state.iwashi) {
			if (i.t === 0) {
				iwashiMap[i.y][i.x]++;
			}
		}
		this.state = {
			isReady: false,
			isCollated: false,
			player: input.state.player,
			iwashi: input.state.iwashi,
			iwashiMap,
			score: 0,
		};

		this.frame = 0;
		this.params = input.params;

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
			this.params,
			{
				onFrame: (state) => frames.push(cloneDeep(state)),
				initState: pick(this.state, ['iwashiMaps', 'player']),
			}
		);

		this.frames = frames;
	};

	handleClickStart = () => {
		this.setState({isReady: true});
		setTimeout(this.handleFrame, 300);
	};

	handleFrame = async () => {
		if (this.frame >= this.frame.length) {
			this.setState({
				activeIwashi: null,
			});
			if (this.data.id === 'latest') {
				setTimeout(() => {
					location.reload();
				}, 10000);
			}
			return;
		}

		const frame = this.frames[this.frame];
		await new Promise((resolve) => {
			this.setState(
				{
					player: frame.player,
					iwashiMap: frame.iwashiMap,
					iwashi: frame.iwashi,
					score: frame.score,
				},
				resolve
			);
		});

		this.frame++;
		setTimeout(this.handleFrame, 300);
	};

	renderContent = () => {
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				flexDirection: 'column',
			}}
		>
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
				{this.props.maps.map((str, i) => {
					const arr = str.split('');
					const size = 500 / Math.max(this.params.width, this.params.height);
					return (
						<g key={`g_${String(i)}`}>
							{arr.map((c, j) => (
								<rect
									key={`rect_${String(i)} ${String(j)}`}
									width={size / 2}
									height={size / 2}
									opacity={0.3}
									fill={c === '#' ? 'black' : 'white'}
									style={{
										transition: 'all 0.5s',
									}}
								/>
							))}
						</g>
					);
				})}
			</svg>
			<div
				style={{
					color: 'red',
					fontSize: '3em',
					fontWeight: 'bold',
					width: '100%',
					textAlign: 'center',
				}}
			>
				{`Score: ${this.state.score}`}
			</div>
		</div>;
	};

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
				) : this.data.result === 'pending' ? (
					<h1> Battle is Pending...</h1>
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
				)}
			</div>
		);
	}
}

module.exports = App;
