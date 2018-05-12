const mongoose = require('mongoose');
const moment = require('moment');

const turnSchema = new mongoose.Schema(
	{
		submission: {type: mongoose.Schema.Types.ObjectId, ref: 'Submission'},
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

module.exports = mongoose.model('Turn', turnSchema);
