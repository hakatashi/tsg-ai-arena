const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const Battle = require('../models/Battle');
const {stripIndent} = require('common-tags');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

	const battles = await Battle.find({});

	for (const battle of battles) {
		battle.scores = Array(battle.players.length).fill(0);
		await battle.save();
	}

	const contests = await Contest.find({});

	for (const contest of contests) {
		contest.type = 'battle';
		await contest.save();
	}

	const contest1 = new Contest({
		name: 'Rotating Drops',
		id: 'rotating-drops',
		start: new Date('1970-01-01T00:00:00.000Z'),
		end: new Date('2038-01-19T12:14:07.000+0900'),
		description: {
			ja: stripIndent`
				# 回転するドロップ

				* H×Wマスのフィールド上に、1マスにつき1個のドロップが配置されています。
				  * 座標は左上が (1, 1)、右下が (H, W) です。
				* ドロップの色は5種類あり、それぞれ1から5までの番号がついています。
				* プレイヤーは以下の回転操作をN回行うことができます。
				  * 隣接する2x2マスを選び、その上の4つのドロップを時計回りに1つ回転させる。
					* すなわち、2x2マスの中の左上のドロップは右上に、右上のドロップは右下に移動する。
				* 最終的になるべく同じ色のドロップが隣り合うように並び替えてください。

				## 入力

				\`\`\`
				H W N
				d11 d12 d13 ...
				d21 d22 d23 ...
				d31 d32 d33 ...
				...
				\`\`\`

				* 1行目に、H, W, N が空白区切りで与えられる。
				* i + 1 (1 <= i <= H) 行目に、マス (x, i) 上のドロップの色 dix (1 <= dix <= 5) が与えられる。

				## 出力

				\`\`\`
				x1 y1
				x2 y2
				x3 y3
				...
				\`\`\`

				* i (1 <= i <= N) 行目に、i回目の回転操作を行う2x2マスの左上の座標 (xi, yi) を空白区切りで出力してください。

				## スコア

				* **最終的なフィールド上の、同じ色のドロップが隣接する領域の大きさの二乗平均平方根 (RMS) がスコアとなる。**

				## テストケース

				* H = 5, W = 5, N = 20 5ケース
				* H = 10, W = 10, N = 50 5ケース
				* H = 20, W = 20, N = 200 5ケース


				## サンプルコード

				以下は、この問題に対して不正でない出力を行うC++のサンプルコードです。
			`,
			en: stripIndent`
			`,
		},
	});

	await contest1.save();

	const contest2 = new Contest({
		name: '駒場祭2018 Live Programming Contest',
		id: 'komabasai2018-procon',
		start: new Date('2018-11-24T16:10:00+0900'),
		end: new Date('2018-11-24T17:10:00+0900'),
		description: {
			ja: stripIndent`
			`,
			en: stripIndent`
			`,
		},
	});

	await contest2.save();

	const contest3 = new Contest({
		name: '駒場祭2018 Live AI Contest',
		id: 'komabasai2018-ai',
		start: new Date('2018-11-25T16:10:00+0900'),
		end: new Date('2018-11-25T17:10:00+0900'),
		description: {
			ja: stripIndent`
			`,
			en: stripIndent`
			`,
		},
	});

	await contest3.save();

	mongoose.connection.close();
})();
