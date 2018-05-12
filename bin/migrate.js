const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const {stripIndent} = require('common-tags');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

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
				じゃんけんを100回行います。
				グー、チョキ、パーのいずれかを出してください。

				## 入力

				* 何回目のじゃんけんかが一行で与えられます。

				## 出力

				* グーならば0を、チョキならば1を、パーならば2を出力してください。
				* 不正な出力をした場合、必ず負けます。
			`,
			en: stripIndent`
			`,
		},
	});

	await contest3.save();

	mongoose.connection.close();
})();
