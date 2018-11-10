const mongoose = require('mongoose');
const moment = require('moment');

const matchSchema = new mongoose.Schema(
	{
		contest: {type: mongoose.Schema.Types.ObjectId, ref: 'Contest'},
		players: [{type: mongoose.Schema.Types.ObjectId, ref: 'Submission'}],
		result: {type: String, enum: ['pending', 'running', 'draw', 'settled']},
		winner: Number,
		user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		executedAt: Date,
	},
	{timestamps: true}
);

matchSchema.methods.versusText = function() {
	return this.players.map((submission) => submission.userText()).join(' vs ');
};

matchSchema.methods.timeText = function() {
	return moment(this.createdAt)
		.utcOffset(9)
		.format('YYYY/MM/DD HH:mm:ss');
};

matchSchema.methods.getOpponents = function(submission) {
	return this.players.filter(({_id}) => !_id.equals(submission._id));
};

matchSchema.methods.getWinner = function() {
	return this.players[this.winner];
};

matchSchema.methods.isViewableBy = function(user) {
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

module.exports = mongoose.model('Match', matchSchema);
