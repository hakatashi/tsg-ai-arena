const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const Battle = require('../models/Battle');
const User = require('../models/User');
const {stripIndent} = require('common-tags');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

	await Contest.deleteMany({id: 'rotating-drops'});

	await Contest.updateOne(
		{id: 'dragon-puzzles'},
		{
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
				* H = 10, W = 10, N = 10, M = 10 5ケース
				* H = 20, W = 20, N = 30, M = 15 5ケース

				## サンプルコード

				以下は、この問題に対して不正でない出力を行うC++のサンプルコードである。

				\`\`\`
				#include <bits/stdc++.h>
				using namespace std;

				int **drops;

				int main() {
					cin.tie(0);
					ios::sync_with_stdio(false);

					int H, W, N, M;
					cin >> H >> W >> N >> M;

					drops = (int **)malloc(sizeof(int *) * H);
					for (int y = 0; y < H; y++) {
						drops[y] = (int *)malloc(sizeof(int) * W);
						for (int x = 0; x < W; x++) {
							cin >> drops[y][x];
						}
					}

					for (int i = 0; i < N; i++) {
						cout << 2 << " " << 2 << endl;

						for (int j = 0; j < M; j++) {
							cout << (j % 4) + 1;
							if (j == M - 1) {
								cout << endl;
							} else {
								cout << " ";
							}
						}
					}

					return 0;
				}
				\`\`\`

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
		},
	}, {upsert: true});

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
				en: stripIndent`
			`,
			},
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
