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
				じゃんけんを5回行います。
				グー、チョキ、パーのいずれかを出してください。

				## 入力

				\`\`\`
				N
				a_1 b_1
				a_2 b=2
				...
				a_N-1 b_N-1
				\`\`\`

				* 1行目は、このじゃんけんが何回目かを表す整数Nが与えられる。
				* 2～N行目は、自分と相手がこれまでに出した手が空白区切りで与えられる。

				## 出力

				* グーならば0を、チョキならば1を、パーならば2を出力してください。
				* 不正な出力をした場合、必ず負けます。
			`,
			en: stripIndent`
			`,
		},
	});

	await contest3.save();

	const preset = new Submission({
		isPreset: true,
		name: 'random',
		user: null,
		contest: contest3,
		language: null,
		code: null,
		size: null,
	});

	await preset.save();

	mongoose.connection.close();
})();
