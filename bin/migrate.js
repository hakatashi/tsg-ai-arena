const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const Battle = require('../models/Battle');
const User = require('../models/User');
const {stripIndent} = require('common-tags');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

	await Contest.updateOne({id: 'mayfes2019-procon'}, {
		name: '五月祭2019 Live Programming Contest',
		id: 'mayfes2019-procon',
		start: new Date('2019-05-19T10:03:00+0900'),
		end: new Date('2019-05-19T11:18:00+0900'),
		type: 'score',
		description: {
			ja: stripIndent`
				# 零和への道(Zero-Sum-Path)

				## 背景（プレイヤーは読まなくていい）
				今度は数え上げお姉さんが、「左上から右下への移動方法のうち、最短コストとなるルートを探そうとしていました」（それは数え上げではない）

				## 問題

				* H×Wの盤面があります。各マスには整数が書かれています。
				* 盤面上隣接しているマス同士を移動することが出来ます。
				* お姉さんは今一番左上(北東)のマスにいます。一番右下(南西)へ隣接しているマスを介して移動しようとしています。数え上げお姉さんのプライドで同じマスを訪れるのはダメなようです。
				* 各マスを訪れる度に、書かれている整数をメモしていきます。
				* 一番右下のマスについたとき、メモしてきた整数の合計を求めて、その絶対値が一番小さいルートがどんなルートなのか調べてみることにしました。
				* ただし、お姉さんは当然のごとく全ルート探索しようとするので、それっぽい解を出してお姉さんを満足させてあげてください。

				## 入出力

				### 入力
				以下のフォーマットに従って与えられます。

				\`\`\`
				W H
				n11 n12 n13 ... n1W
				n21 n22 n23 ... n2W
				.
				.
				.
				nH1 nH2 nH3 ... nHW
				\`\`\`

				* 1行目に盤面の幅W(10 <= W <= 30)と高さH(10 <= W <= 30)が与えられる。
				* 続くH行にW個の数字が空白区切りで与えられる。nijは北からi番目、東からj番目の区画に書かれている整数(-100 <= nij <= 100)である。

				### 出力

				\`\`\`
				s
				\`\`\`

				* s: お姉さんに動いてほしい方角('NEWS'のどれか)の組み合わせからなる文字列

				### 入出力例
				#### 入力
				\`\`\`
				3 3
				-2 1 2
				1 2 4
				-2 -2 2
				\`\`\`
				#### 出力
				\`\`\`
				WSESWW
				\`\`\`
				-2 + 1 + 2 + 1 + -2 + -2 + 2 = 0です。これならお姉さんも大満足。

				## テストケース・スコア評価について
				* 3×3(tiny)…3ケース
				* 5×5(small)…3ケース
				* 10×10(middle)…1ケース
				* 30×30(large)…1ケース

				を使用し、各ケースにおける「整数の合計の絶対値」の合計を競います。各マスの数字はランダムで生成されるため、零和解が存在する保証はありません。
				より小さいスコアを目指してください。
			`,
			en: '',
		},
	}, {upsert: true}, (err) => {
		if (err) {
			throw err;
		}
		console.log('inserting succeeded');
	});


	const contestAi = await Contest.findOne({id: 'mayfes2019-procon'});

	for (const presetName of ['random', 'cat']) {
		await Submission.updateOne({
			name: presetName,
			contest: contestAi,
		}, {
			isPreset: true,
			name: presetName,
			user: null,
			contest: contestAi,
			language: null,
			code: null,
			size: null,
		}, {upsert: true});
	}

	const kuromunori = await User.findOne({email: 'kuromunori@twitter.com'});
	kuromunori.admin = false;
	await kuromunori.save();

	const moratorium = await User.findOne({email: 'moratorium08@twitter.com'});
	moratorium.admin = true;
	await moratorium.save();

	mongoose.connection.close();
})();
