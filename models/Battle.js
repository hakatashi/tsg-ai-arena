const mongoose = require('mongoose');
const moment = require('moment');

const battleSchema = new mongoose.Schema(
	{
		contest: {type: mongoose.Schema.Types.ObjectId, ref: 'Contest'},
		players: [{type: mongoose.Schema.Types.ObjectId, ref: 'Submission'}],
		result: {type: String, enum: ['pending', 'draw', 'settled']},
		winner: {type: mongoose.Schema.Types.ObjectId, ref: 'Submission'},
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

module.exports = mongoose.model('Battle', battleSchema);
