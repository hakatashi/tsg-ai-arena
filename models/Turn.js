const mongoose = require('mongoose');
const moment = require('moment');

const turnSchema = new mongoose.Schema(
	{
		player: Number,
		battle: {type: mongoose.Schema.Types.ObjectId, ref: 'Battle'},
		index: Number,
		input: String,
		stdout: String,
		stderr: String,
		duration: Number,
		error: {
			name: String,
			stack: String,
		},
	},
	{timestamps: true}
);

turnSchema.methods.timeText = function() {
	return moment(this.createdAt)
		.utcOffset(9)
		.format('YYYY/MM/DD HH:mm:ss');
};

turnSchema.methods.getSubmission = function () {
	return this.battle.players[this.player];
};

module.exports = mongoose.model('Turn', turnSchema);
