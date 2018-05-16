const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Battle = require('../models/Battle');
const Submission = require('../models/Submission');
const {stripIndent} = require('common-tags');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

	const contest1 = await Contest.findOne({id: 'mayfes2018-day1'});

	contest1.start = new Date('2018-05-19T14:05:00+0900');
	contest1.end = new Date('2018-05-19T15:05:00+0900');
	contest1.description.ja = stripIndent`
		# スープ屋とぅーん

		スープ屋とぅーんで派閥争いが行われている。
		相手チームよりも広い面積をスープで塗って勝利を目指そう。

		## 説明
		* 床は 9 x 9 のタイルで構成されている。
			* 座標系は左上が (0, 0) 、右下が(8, 8)である。
		* 各タイルは無色(0)、自プレイヤーの色(1)、他プレイヤーの色(2)の3色のいずれかの色に塗られている。
		* 2人のプレイヤーは各ターンに1回ずつ交互に、前後左右に移動することができる。
		* 自プレイヤーが移動した先のタイルは現在の色に関わらず自プレイヤーの色(1)に塗られる。
		* 他プレイヤーが移動した先のタイルは現在の色に関わらず他プレイヤーの色(2)に塗られる。
		* 10ターン目・40ターン目・70ターン目の3回、床の上の任意の場所に強化スープの素が追加される。
		* 強化スープの素が落ちている場所に移動すると強化スープの素を拾うことができ、10ターンの間塗る力が強化される。強化中は移動先のタイルとその周囲1マスの合計9マスが同時に塗られる。
		* 100ターンが経過するとゲーム終了となる。
		* ゲーム終了時に塗った面積の広いプレイヤーの勝利となる。

		## 入力

		\`\`\`
		T
		x1 y1
		x2 y1
		c11 c12 c13 ...
		c21 c22 c23 ...
		...
		N
		Sx1 Sy1
		Sx2 Sy2
		...
		\`\`\`

		* 1行目に、現在のターン数T(1<=T<=100)が与えられる
		* 2行目に、自プレイヤーのx座標x1(0<=x1<=8)とy座標y1(0<=y1<=8)が与えられる
		* 3行目に、他プレイヤーのx座標x2(0<=x2<=8)とy座標y2(0<=y2<=8)が与えられる
		* 4〜12行目に、タイル(x, y)の色cyx(0<=cyx<=2)が与えられる
		* 13行目に、現在落ちている強化スープの素の数N(0<=N<=3)が与えられる
		* 14行目以降にn番目の強化スープの素のx座標Sxn(0<=Sxn<=8)とy座標Syn(0<=Syn<8)が与えられる

		## 出力

		\`\`\`
		Action
		\`\`\`

		* 自プレイヤーPがそのターンに行う行動を出力せよ。
			* Action: プレイヤーPの行動
				* 移動しない (0)
				* 上(-y方向)に移動 (1)
				* 右(+x方向)に移動 (2)
				* 下(+y方向)に移動 (3)
				* 左(-x方向)に移動 (4)
		* 場外に出る場合や不正な出力をした場合、\`0\`を出力したものとみなされる。
	`;

	await contest1.save();

	await Submission.remove({contest: contest1});
	await Battle.remove({contest: contest1});

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

	const contest2 = await Contest.findOne({id: 'mayfes2018-day2'});

	contest2.start = new Date('2018-05-20T14:05:00+0900');
	contest2.end = new Date('2018-05-20T15:05:00+0900');

	await contest2.save();

	mongoose.connection.close();
})();
