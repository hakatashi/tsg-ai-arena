const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const {stripIndent} = require('common-tags');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

	await mongoose.connection.db.dropDatabase();

	const contest1 = new Contest({
		name: '五月祭2018 Live AI Contest day1',
		id: 'mayfes2018-day1',
		start: new Date('2018-05-19T14:10:00+0900'),
		end: new Date('2018-05-19T15:10:00+0900'),
		description: {
			ja: stripIndent`
			`,
			en: stripIndent`
			`,
		},
	});

	await contest1.save();

	const contest2 = new Contest({
		name: '五月祭2018 Live AI Contest day2',
		id: 'mayfes2018-day2',
		start: new Date('2018-05-20T14:10:00+0900'),
		end: new Date('2018-05-20T15:10:00+0900'),
		description: {
			ja: stripIndent`
			`,
			en: stripIndent`
			`,
		},
	});

	await contest2.save();

	const contest3 = new Contest({
		name: 'Test Contest',
		id: 'test',
		start: new Date('2018-01-01T00:00:00+0900'),
		end: new Date('2018-12-31T23:59:59+0900'),
		description: {
			ja: stripIndent`
				石取りゲームを行います。

				## 入力

				\`\`\`
				N
				\`\`\`

				* 1行目に、残りの石の数Nが与えられる。

				## 出力

				* 取る石の数を1から3までの整数で出力せよ。
				* 不正な出力をした場合、3個の石を取る。
			`,
			en: stripIndent`
			`,
		},
	});

	await contest3.save();

	for (const presetName of ['random', 'clever']) {
		const preset = new Submission({
			isPreset: true,
			name: presetName,
			user: null,
			contest: contest3,
			language: null,
			code: null,
			size: null,
		});

		await preset.save();
	}

	mongoose.connection.close();
})();
