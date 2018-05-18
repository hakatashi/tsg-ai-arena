const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Battle = require('../models/Battle');
const Submission = require('../models/Submission');
const {stripIndent} = require('common-tags');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

	const contest1 = await Contest.findOne({id: 'mayfes2018-day1'});

	contest1.description.ja = stripIndent`
		# スープ屋とぅーん

		スープ屋とぅーんで縄張り争いが行われている。
		相手チームよりも広い面積を塗って勝利を目指そう。

		## 説明
		* 床は 9 x 9 のタイルで構成されている。
			* 座標系は左上が (0, 0) 、右下が(8, 8)である。
		* 各タイルは無色(0)、自プレイヤーの色(1)、他プレイヤーの色(2)の3色のいずれかの色に塗られている。
		* 2人のプレイヤーは各ターンに1回ずつ交互に、何もしない・前後左右に移動する・ハエを投げるのいずれかの行動を取ることができる。
		* 自プレイヤーが移動した先のタイルは現在の色に関わらず自プレイヤーの色(1)に塗られる。
		* 他プレイヤーが移動した先のタイルは現在の色に関わらず敵プレイヤーの色(2)に塗られる。
        * 敵プレイヤーがマンハッタン距離で2以内にいるときにハエを投げた場合、敵プレイヤーは5ターンのあいだ色を塗ることができなくなる。
        * すでに色を塗ることができない状態のプレイヤーにハエを投げつけた場合、何も起こらない。
		* 100ターンが経過するとゲーム終了となる。
		* ゲーム終了時に塗った面積の広いプレイヤーの勝利となる。

		## 入力

		\`\`\`
		T
		x1 y1 t1
		x2 y1 t2
		c11 c12 c13 ...
		c21 c22 c23 ...
		...
		\`\`\`

		* 1行目に、現在のターン数T(1<=T<=100)が与えられる
		* 2行目に、自プレイヤーのx座標x1(0<=x1<=8)とy座標y1(0<=y1<=8)と色を塗ることができない残りターン数t1(0<=t1<=5)が与えられる
		* 3行目に、他プレイヤーのx座標x2(0<=x2<=8)とy座標y2(0<=y2<=8)と色を塗ることができない残りターン数t2(0<=t2<=5)が与えられる
		* 4〜12行目に、タイル(x, y)の色cyx(0<=cyx<=2)が与えられる

		## 出力

		\`\`\`
		Action
		\`\`\`

		* 自プレイヤーPがそのターンに行う行動を出力せよ。
			* Action: プレイヤーPの行動
				* 何もしない (0)
				* 上(-y方向)に移動 (1)
				* 右(+x方向)に移動 (2)
				* 下(+y方向)に移動 (3)
				* 左(-x方向)に移動 (4)
				* ハエを投げる (5)
		* 場外に出る場合や不正な出力をした場合、\`0\`を出力したものとみなされる。

		## 入力例

		\`\`\`
		64
		5 3 4
		7 4 0
		1 1 1 1 1 1 1 1 1
		1 1 1 0 0 0 0 1 1
		1 1 1 0 0 0 0 0 0
		1 1 1 0 0 0 0 0 0
		1 1 1 0 0 0 0 2 0
		1 1 1 0 0 0 0 0 0
		0 0 0 0 0 0 0 0 0
		0 0 0 0 0 0 0 0 0
		0 0 0 0 0 0 0 0 0
		\`\`\`

		## 出力例

		\`\`\`
		3
		\`\`\`
	`;

	await contest1.save();

	await Battle.remove({contest: contest1});
	await Submission.remove({contest: contest1});

	for (const presetName of ['random', 'clever']) {
		const preset = new Submission({
			isPreset: true,
			name: presetName,
			user: null,
			contest: contest1,
			language: null,
			code: null,
			size: null,
			id: 0,
		});

		await preset.save();
	}

	mongoose.connection.close();
})();
