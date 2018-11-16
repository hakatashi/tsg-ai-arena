const mongoose = require('mongoose');
const moment = require('moment');
const contests = require('../contests');

const battleSchema = new mongoose.Schema(
	{
		contest: {type: mongoose.Schema.Types.ObjectId, ref: 'Contest'},
		players: [{type: mongoose.Schema.Types.ObjectId, ref: 'Submission'}],
		result: {type: String, enum: ['pending', 'running', 'draw', 'settled']},
		winner: Number,
		scores: [Number],
		user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		executedAt: Date,
		config: String,
		match: {type: mongoose.Schema.Types.ObjectId, ref: 'Match'},
	},
	{timestamps: true}
);

battleSchema.methods.versusText = function() {
	return this.players.map((submission) => submission.userText()).join(' vs ');
};

battleSchema.methods.timeText = function() {
	return moment(this.createdAt)
		.utcOffset(9)
		.format('YYYY/MM/DD HH:mm:ss');
};

battleSchema.methods.configText = function(contest) {
	const config = contests[contest.id].configs.find(({id}) => this.config === id);
	return config === undefined ? '' : config.name;
};

battleSchema.methods.getOpponents = function(submission) {
	return this.players.length === 1 ? null : this.players.filter(({_id}) => !_id.equals(submission._id));
};

battleSchema.methods.getWinner = function() {
	return this.players[this.winner];
};

battleSchema.methods.isViewableBy = function(user) {
	if (this.players.every((player) => player.isPreset)) {
		return true;
	}

	if (!user) {
		return false;
	}

	if (user.admin) {
		return true;
	}

	return this.players.some(
		(player) => !player.isPreset && player.user._id.equals(user._id)
	);
};

module.exports = mongoose.model('Battle', battleSchema);
