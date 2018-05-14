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
				# スープ屋とぅーん
				スープ屋とぅーんで派閥争いが行われている。
				相手チームよりも広い面積をスープで塗って勝利を目指そう。

				## 説明
				* 床は11 x 11 のタイルで構成されている。
					* 座標系は左上が (0, 0) 、右下が(10, 10)である。
				* 各タイルは無色(0)、水色(1)、橙色(2)の3色のいずれかの色に塗られている。
				* プレイヤー1とプレイヤー2は各ターンに1回、前後左右に移動することができる。
				* プレイヤー1が移動した先のタイルは現在の色に関わらず水色(1)に塗られる。
				* プレイヤー2が移動した先のタイルは現在の色に関わらず橙色(2)に塗られる。
				* 強化スープの素が落ちている場所に移動すると強化スープの素を拾うことができ、10ターンの間塗る力が強化される。強化中は移動先のタイルとその周囲1マスの合計9マスが同時に塗られる。
				* 100ターンが経過するとゲーム終了となる。
				* ゲーム終了時に塗った面積の広いプレイヤーの勝利となる。

				## 入力

				\`\`\`
				T P
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

				* 1行目に、現在のターン数T(1<=T<=100)と自プレイヤーの番号P(1<=P<=2)が与えられる
				* 2行目に、プレイヤー1のx座標x1(0<=x1<=10)とy座標y1(0<=y1<=10)が与えられる
				* 3行目に、プレイヤー2のx座標x2(0<=x2<=10)とy座標y2(0<=y2<=10)が与えられる
				* 4〜14行目に、タイル(x, y)の色cyx(0<=cyx<=2)が与えられる
				* 15行目に、現在落ちている強化スープの素の数N(0<=N<=3)が与えられる
				* 16行目以降にn番目の強化スープの素のx座標Sxn(0<=Sxn<=10)とy座標Syn(0<=Syn<=10)が与えられる

				## 出力

				\`\`\`
				Action
				\`\`\`

				* 自プレイヤーPがそのターンに行う行動を出力せよ。
					* Action: プレイヤーPの行動 
						* 移動しない (0)
						* 上(-y方向）に移動 (1)
						* 右(+x方向）に移動 (2)
						* 下(+y方向）に移動 (3)
						* 左(-x方向）に移動 (4)
				* 場外に出る場合や不正な出力をした場合、\`0\`を出力したものとみなされる。
			`,
			en: stripIndent`
			`,
		},
	});

	await contest1.save();

	for (const presetName of ['random']) {
		const preset = new Submission({
			isPreset: true,
			name: presetName,
			user: null,
			contest: contest1,
			language: null,
			code: null,
			size: null,
		});

		await preset.save();
	}

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

	const contest4 = new Contest({
		name: 'Dragon Ball',
		id: 'dragon-ball',
		start: new Date('1970-01-01T00:00:00.000Z'),
		end: new Date('2038-01-19T12:14:07.000+0900'),
		description: {
			ja: stripIndent`
				# ドラゴンボール

				謎の2次元空間上を7つのドラゴンボールが浮遊している。

				プレイヤーを動かして、相手よりも多くのドラゴンボールを集めよう。

				## 説明

				* 1024px x 1024px の2次元空間上を7つのドラゴンボールが等速直線運動で移動している。
					* 座標系は左上が (0, 0) である。
				* ドラゴンボールは空間の壁で反射し、同じ速度で動き続ける。
				* 提出されたプログラムは10フレームに1度呼び出される。
				* プレイヤーがドラゴンボールに50px以上接近した時点でドラゴンボールを取得したものとし、取得されたドラゴンボールは空間上から消滅する。
				* すべてのドラゴンボールが回収される、もしくは1000フレームが経過した時点でゲーム終了とする。
				* ゲーム終了時に取得したドラゴンボールの数が多いプレイヤーの勝利となる。

				## 入力

				\`\`\`
				F
				Ax Ay Asx Asy
				Bx By Bsx Bsy
				N
				D1x D1y D1sx D1sy
				D2x D2y D2sx D2sy
				...
				\`\`\`

				* 1行目に、ゲーム開始から経過したフレーム数Fが与えられる。
				* 2行目に、以下の数値が与えられる。
					* Ax: 自プレイヤーのx座標 (px)
					* Ay: 自プレイヤーのy座標 (px)
					* Asx: 自プレイヤーの速度のxベクトルの大きさ (px/frame)
					* Asy: 自プレイヤーの速度のyベクトルの大きさ (px/frame)
				* 3行目に、以下の数値が与えられる。
					* Bx: 相手プレイヤーのx座標 (px)
					* By: 相手プレイヤーのy座標 (px)
					* Bsx: 相手プレイヤーの速度のxベクトルの大きさ (px/frame)
					* Bsy: 相手プレイヤーの速度のyベクトルの大きさ (px/frame)
				* 4行目に、残りのドラゴンボールの数Nが与えられる。
				* i+4 (1 <= i <= N) 行目に、以下の数値が与えられる。
					* Dix: i個目のドラゴンボールのx座標 (px)
					* Diy: i個目のドラゴンボールのy座標 (px)
					* Disx: i個目のドラゴンボールの速度のxベクトルの大きさ (px/frame)
					* Disy: i個目のドラゴンボールの速度のyベクトルの大きさ (px/frame)

				## 出力

				\`\`\`
				Deg Acc
				\`\`\`

				* プレイヤーは慣性の法則に従い移動する。アクセルをかける方向と大きさを出力せよ。
					* Deg: アクセルをかける方向 (deg)
						* 0 <= Deg <= 360
						* 真上方向から時計回りに数えた角度とする。
					* Acc: アクセルの大きさ (px/frame^2)
						* 0 <= Acc <= 1
				* 不正な出力をした場合、\`0 0\`を出力したものとみなされる。
			`,
			en: stripIndent`
			`,
		},
	});

	await contest4.save();

	for (const presetName of ['dumb', 'random', 'nearest']) {
		const preset = new Submission({
			isPreset: true,
			name: presetName,
			user: null,
			contest: contest4,
			language: null,
			code: null,
			size: null,
		});

		await preset.save();
	}

	const contest3 = new Contest({
		name: 'Test Contest',
		id: 'test',
		start: new Date('1970-01-01T00:00:00.000Z'),
		end: new Date('2038-01-19T12:14:07.000+0900'),
		description: {
			ja: stripIndent`
				# 石取りゲーム

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
