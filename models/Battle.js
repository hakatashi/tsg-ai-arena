const mongoose = require('mongoose');
const moment = require('moment');

const turnSchema = new mongoose.Schema(
	{
		submission: {type: mongoose.Schema.Types.ObjectId, ref: 'Submission'},
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

const Submission = mongoose.model('Turn', turnSchema);

module.exports = Submission;
