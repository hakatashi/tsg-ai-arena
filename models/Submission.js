const mongoose = require('mongoose');
const moment = require('moment');

const submissionSchema = new mongoose.Schema(
	{
		user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		contest: {type: mongoose.Schema.Types.ObjectId, ref: 'Contest'},
		language: {type: String, enum: ['node']},
		code: Buffer,
		size: {type: Number, min: 0},
	},
	{timestamps: true}
);

submissionSchema.methods.timeText = function() {
	return moment(this.createdAt)
		.utcOffset(9)
		.format('YYYY/MM/DD HH:mm:ss');
};

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
