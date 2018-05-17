const mongoose = require('mongoose');
const moment = require('moment');

const submissionSchema = new mongoose.Schema(
	{
		isPreset: Boolean,
		name: String,
		user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		contest: {type: mongoose.Schema.Types.ObjectId, ref: 'Contest'},
		language: {type: String, enum: [null, 'node', 'c-gcc', 'python3', 'cpp-clang', 'ruby']},
		code: Buffer,
		size: {type: Number, min: 0},
		id: {type: Number, min: 0},
	},
	{timestamps: true}
);

submissionSchema.methods.timeText = function() {
	return moment(this.createdAt)
		.utcOffset(9)
		.format('YYYY/MM/DD HH:mm:ss');
};

submissionSchema.methods.userText = function() {
	if (this.isPreset) {
		return `BOT (${this.name})`;
	}

	return `${this.user.name()} (#${this.id})`;
};

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
