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

	await Contest.deleteMany({id: 'rotating-drops'});

	await Contest.updateOne({id: 'dragon-puzzles'}, {
		name: 'Dragon Puzzles',
		id: 'dragon-puzzles',
		start: new Date('1970-01-01T00:00:00.000Z'),
		end: new Date('2038-01-19T12:14:07.000+0900'),
		type: 'score',
		description: {
			ja: stripIndent`
				# ドラゴンのパズル

				* H×Wマスのフィールド上に、1マスにつき1個のドロップが配置されている。
				  * 座標は左上が (1, 1)、右下が (H, W)。
				* ドロップの色は5種類あり、それぞれ1から5までの番号がついている。
				* プレイヤーは「操作Aを1回行ったあと、操作BをM回以下行う」操作セットをN回以下行うことができる。
				  * 操作A: フィールド上のドロップを1つ選択する。 (**注意: マスではない**)
					* 操作B: 操作Aで選択したドロップを、上下左右いずれかに移動する。移動した先のマス上のドロップは、移動元のマスと交換され移動する。
				* フィールドの外にドロップを移動させることはでき内容を。
				* 最終的になるべく同じ色のドロップが隣り合うように並び替えよ。

				## 入力

				\`\`\`
				H W N M
				d11 d12 d13 ...
				d21 d22 d23 ...
				d31 d32 d33 ...
				...
				\`\`\`

				* 1行目に、H, W, N, M が空白区切りで与えられる。
				* y + 1 (1 <= y <= H) 行目に、マス (x, y) 上のドロップの色 dix (1 <= dyx <= 5) が与えられる。
				* フィールド上のドロップの5つの色はすべて同数含まれることが保証される。

				## 出力

				\`\`\`
				x1 x2
				d11 d12 d13 d14 ...
				x2 y2
				d21 d22 d23 d24 ...
				...
				\`\`\`

				* i * 2 - 1 (1 <= i <= N) 行目に、i回目の操作セットの操作Aで選択するドロップが存在するマスの座標 (xi, yi) を空白区切りで出力せよ。
				* i * 2 (1 <= i <= N) 行目に、i回目の操作セットのj回目の操作Bでドロップを移動させる方向dijを空白区切りで出力せよ。
					* 上 (-y方向) に移動: 1
					* 右 (+x方向) に移動: 2
					* 下 (+y方向) に移動: 3
					* 左 (-x方向) に移動: 4

				## スコア

				* **最終的なフィールド上の、同じ色のドロップが隣接する領域全てについての、領域の大きさの二乗平均平方根 (RMS) がスコアとなる。**

				## テストケース

				* H = 5, W = 5, N = 3, M = 5 5ケース
				* H = 10, W = 10, N = 5, M = 10 5ケース
				* H = 20, W = 20, N = 20, M = 15 5ケース

				## サンプルコード

				以下は、この問題に対して不正でない出力を行うC++のサンプルコードである。

				## 入力例

				\`\`\`
				5 5 1 3
				1 2 3 4 5
				1 2 3 4 5
				1 2 3 3 4
				1 2 5 4 5
				1 2 3 4 5
				\`\`\`

				## 出力例

				\`\`\`
				3 4
				1 2 2
				\`\`\`
			`,
			en: stripIndent`
			`,
		},
	}, {upsert: true});

	await Contest.updateOne({id: 'komabasai2018-procon'}, {
		name: '駒場祭2018 Live Programming Contest',
		id: 'komabasai2018-procon',
		start: new Date('2018-11-24T16:10:00+0900'),
		end: new Date('2018-11-24T17:10:00+0900'),
		type: 'score',
		description: {
			ja: stripIndent`
			`,
			en: stripIndent`
			`,
		},
	}, {upsert: true});

	await Contest.updateOne({id: 'komabasai2018-ai'}, {
		name: '駒場祭2018 Live AI Contest',
		id: 'komabasai2018-ai',
		start: new Date('2018-11-25T16:10:00+0900'),
		end: new Date('2018-11-25T17:10:00+0900'),
		type: 'battle',
		description: {
			ja: stripIndent`
			`,
			en: stripIndent`
			`,
		},
	}, {upsert: true});

	mongoose.connection.close();
})();
