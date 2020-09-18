const mongoose = require('mongoose');
const {stripIndent} = require('common-tags');
const Contest = require('../models/Contest');
const User = require('../models/User');
const Battle = require('../models/Battle');
const Match = require('../models/Match');
const Submission = require('../models/Submission');
const Turn = require('../models/Turn');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

	await User.updateMany({}, {$set: {admin: false}});
	for (const id of ['hakatashi', 'azaika_', 'coil_kpc', 'platypus999', 'Hoget157', 'hideo54']) {
		const user = await User.findOne({email: `${id}@twitter.com`});
		if (user) {
			user.admin = true;
			await user.save();
		}
	}

	const contest = await Contest.findOne({id: 'mayfes2020-marathon'});
	if (contest) {
		const battles = await Battle.find({contest});
		for (const battle of battles) {
			await Turn.deleteMany({battle});
		}
		await Battle.deleteMany({contest});
		await Match.deleteMany({contest});
		await Submission.deleteMany({contest});
	}

	await Contest.updateOne({id: 'mayfes2020-marathon'}, {
		name: '五月祭2020 Live Programming Contest Marathon Match',
		id: 'mayfes2020-marathon',
		start: new Date('2020-08-20T16:03:00+0900'),
		end: new Date('2020-09-20T17:18:00+0900'),
		type: 'score',
		description: {
			ja: stripIndent`
			# 電波塔
			##### 各テストケース 実行時間制限: 3 sec / メモリ制限: 256 MB

			## 背景
			TSG LIVE! もとうとう 5 回目！そして 5 と言えば思い浮かぶのが、次世代通信技術 5G です！

			というわけで、プレイヤーの皆様には通信技師になってもらい、電波を世界中に届けるお手伝いをしてもらいましょう！
			## 問題
			* 電波塔 $1$ から電波塔 $N$ までの $N$ 個の電波塔があります。
			* 電波塔 $i$ は二次元平面上の座標 $(X_i, Y_i)$ にあり、その稼働コストは $C_i$ です。
			* すべての電波塔にはそれぞれ一本のアンテナが付いており、最初すべての電波塔のアンテナの長さは $0$ です。
			* また、時刻 0 では電波塔 $1$ だけが起動していて、他の電波塔は起動していません。

			* 通信技師であるあなたは一回の操作で以下のことができます。


			---

			### 操作
			1. 起動している電波塔を一つ選ぶ。(これを電波塔 $w$ とする)
			1. 時間を $t$ だけ使って、電波塔 $w$ のアンテナの長さを $t/C_w$ 伸ばす。 
			1. 伸ばした後の電波塔 $w$ のアンテナの長さを $l_w$ として、電波塔 $w$ を中心とする面積 $\\pi l_w$ の円の内部もしくは周上に存在する電波塔をすべて起動させる。(まだ起動されていない電波塔は起動させ、すでに起動している電波塔に対しては何もしない) 


			---

			* あなたは以上の操作を好きなだけ、すべての電波塔が起動するまで行います。
			* すべての電波塔を起動させるまでにかかった操作の合計時間 $T$ をできる限り小さくして下さい。

			## 制約
			* 入力は全て整数
			* $N = 20$ または $N = 200$ または $N = 2000$
			* $|X_i|, |Y_i| \\leq 2000$
			* $i \\neq j$ ならば $X_i \\neq X_j$ または $Y_i \\neq Y_j$
			* $1 \\leq C_i \\leq 1000$

			(以上の制約は全テストケースを通じての制約である。各テストケースの詳細の仕様は以下「テストケース生成方法」を参照すること)

			## 入出力
			### 入力
			以下の形式に従って標準入力で与えられます。
			\`\`\`
			N
			X_1 Y_1 C_1
			...
			X_N Y_N C_N
			\`\`\`
			### 出力
			全体の操作回数を $M$、$j$ 回目の動作で操作する電波塔を電波塔 $w_j$、操作する時間を $t_j$ として、以下のフォーマットに従って標準出力に出力してください。
			\`\`\`
			M
			w_1 t_1
			...
			w_M t_M
			\`\`\`
			なお、 $M$, $w_j$, $t_j$ は以下の条件を満たしている必要があります。(条件を満たしていない提出は受理されません。)
			* 出力はすべて整数
			* $1 \\leq M \\leq 200000$
			* $1 \\leq w_j \\leq N$ ($1 \\leq j \\leq M$)
			* $1 \\leq t_j \\leq 10^{12}$ ($1 \\leq j \\leq M$)
			* $j$ 回目の操作の時点で、電波塔 $w_j$ は起動状態にある
			* $M$ 回目の操作の終了後、起動されていない電波塔は存在しない

			受理された提出は、$T=\\Sigma_{j=1}^M\\ t_j$ がスコアとして付与されます。**スコアが小さい方が最終得点が高い**ことに注意して下さい。最終得点の詳細は「スコア評価」を参照して下さい。

			## 入出力例
			### 入力例1
			\`\`\`
			4
			3 0 6
			0 0 7
			0 -4 1
			-3 -1 3
			\`\`\`
			### 出力例1
			\`\`\`
			2
			1 150
			3 18
			\`\`\`
			* 初めに電波塔 $1$ を $150$ 秒動かす。これにより電波塔 $1$ のアンテナの長さは $150\\div 6 = 25$ になり、電波塔 $1$ を中心とする面積 $25 \\pi$ の円の内部に存在する電波塔 $2$ および周上に存在する電波塔 $3$ が起動する。
			* 次に電波塔 $3$ を $18$ 秒動かす。これにより電波塔 $3$ のアンテナの長さは $18 \\div 1 = 25$ になり、電波塔 $3$ を中心とする面積 $18\\pi$ の円の周上に存在する電波塔 $4$ が起動する。 
			* これで合計時間 $T = 168$ で全ての電波塔が起動するため、この提出のスコアは $168$ となる。

			(この入力例の $N=4$ は制約を満たしていないことに注意)


			## テストケース生成方法
			テストケースは全部で**16個**ある。すべてのテストケースにおいて、電波塔の座標は $[-2000, 2000] \\times [-2000,2000]$ の範囲から無作為に選ばれた整数のペア $(X,Y)$ である。
			電波塔の個数 $N$ およびコスト $C_i$ の条件は各テストケースによって異なり、以下のような内訳となっている。

			### small (2個)
			- $N=20$
			- それぞれの電波塔のコストは $[1,1000]$ の範囲から無作為に選ばれた整数である。

			### medium-a (4個)
			- $N=200$
			- それぞれの電波塔のコストは $[1,1000]$ の範囲から無作為に選ばれた整数である。

			### medium-b (4個)
			- $N=200$
			- それぞれの電波塔のコストは $[490,510]$ の範囲から無作為に選ばれた整数である。

			### large-a (3個)
			- $N=2000$
			- それぞれの電波塔のコストは $[1,1000]$ の範囲から無作為に選ばれた整数である。

			### large-b (3個)
			- $N=2000$
			- それぞれの電波塔のコストは $[490,510]$ の範囲から無作為に選ばれた整数である。


			## スコア評価
			この問題の最終点数 $S$ は、各テストケースにおけるスコアを $T_i\ (1 \\leq i \\leq 16)$ とし、また入力の制約から導出される最悪のスコア $WORST=3.2\\times10^{10}$ を用いて以下の式によって計算される。

			$S = \\displaystyle\\sum_{i=1}^{16}round\\left(10000\\times\\left(1-\\left(\\frac{T_i}{WORST}\\right)^{1/4}\\right)\\right)$

			ただし提出が受理されなかった場合や $T_i > WORST$ である場合、$T_i = WORST$であるものとして計算されます。上の式から分かる通り、この場合そのテストケースによる最終得点 $S$ への寄与は $0$ となります。
			`,
			en: '',
		},
	}, {upsert: true}, (err) => {
		if (err) {
			throw err;
		}
		console.log('inserting succeeded');
	});

	mongoose.connection.close();
})();
