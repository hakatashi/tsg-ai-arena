const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const User = require('../models/User');
const Battle = require('../models/Battle');
const Submission = require('../models/Submission');
const {stripIndent} = require('common-tags');

mongoose.Promise = global.Promise;

(async () => {
	await mongoose.connect('mongodb://localhost:27017/tsg-ai-arena');

	const contest1 = await Contest.findOne({id: 'mayfes2018-day2'});

	contest1.start = new Date('2018-05-19T14:05:00+0900');
	contest1.end = new Date('2018-05-19T15:05:00+0900');
	contest1.description.ja = stripIndent`
		# ブロック並べ

		フィールド上に3x1のブロックを配置して、自分の陣地に最長の直線を作ろう。

		## 説明

		* 正方形のブロックが10x10個並んだフィールド上で競技を行う。
			* フィールド上のブロックは値を持っており、初期値はすべて0である。
			* 座標系は一番左上のブロックが (0, 0) である。
		* それぞれのプレイヤーは1回のターンで同時に1回ずつ行動することができる。
		* プレイヤーは1回のターンにつき3x1のブロック塊を1個配置することができる。
		* プレイヤーが3x1のブロック塊を配置すると、フィールド上のブロックの値が変化する。
			* 自プレイヤーが3x1のブロック塊を配置した位置のブロックは、値が1増加する。
			* 他プレイヤーが3x1のブロック塊を配置した位置のブロックは、値が1減少する。
			* **ブロックが3より大きい値、もしくは-3より小さい値を持つことはない。**
		* 正の値を持つブロックが自プレイヤーの陣地、負の値を持つブロックが他プレイヤーの陣地となる。
		* それぞれのプレイヤーの得点は**自分の陣地に含まれる最も長い直線の長さ**となる。
		* 20ターンが経過した時点で得点が大きいプレイヤーの勝利となる。

		## 入力

		\`\`\`
		T
		V11 V21 V31 ...
		V12 V22 V32 ...
		...
		\`\`\`

		* 1行目に、ゲーム開始から経過したターン数Fが与えられる。
		* 2～11行目に、フィールド上のそれぞれのブロックの値が与えられる。
			* Vxy: 座標 (x, y) のブロックの値

		## 出力

		\`\`\`
		x y rot
		\`\`\`

		* 3x1のブロック塊を配置する位置を出力せよ。
			* x: 3x1のブロック塊の中心のブロックのx座標
				* 1 <= x <= 10, x ∈ ℕ
			* y: 3x1のブロック塊の中心のブロックのy座標
				* 1 <= y <= 10, y ∈ ℕ
			* rot: 配置するブロック塊の向き
				* 0ならば横向き、1ならば縦向きに配置する。
		* 不正な出力をした場合、\`5 5 0\`を出力したものとみなされる。
	`;

	await contest1.save();

	for (const username of ['kivantium', 'hakatashi', 'kurgm', 'kuromunori', 'progrunner17']) {
		const user = await User.findOne({email: `${username}@twitter.com`});

		if (user !== null) {
			user.admin = true;
			await user.save();
		}
	}

	const contests = await Contest.find();

	for (const contest of contests) {
		const submissions = await Submission.find({contest}).sort({_id: 1}).exec();
		let id = 1;
		for (const submission of submissions) {
			if (submission.isPreset) {
				submission.id = 0;
				await submission.save();
				continue;
			}
			submission.id = id;
			id++;
			await submission.save();
		}
	}

	const battles = await Battle.find();
	const hakatashi = await User.findOne({email: 'hakatashi@twitter.com'});
	for (const battle of battles) {
		battle.user = hakatashi;
	}

	mongoose.connection.close();
})();
