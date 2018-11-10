const mongoose = require('mongoose');
const moment = require('moment');
const Prism = require('prismjs');
require('prismjs/components/')();

const submissionSchema = new mongoose.Schema(
	{
		isPreset: Boolean,
		name: String,
		user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		contest: {type: mongoose.Schema.Types.ObjectId, ref: 'Contest'},
		language: {
			type: String,
			enum: [null, 'node', 'c-gcc', 'python3', 'cpp-clang', 'ruby'],
		},
		code: Buffer,
		size: {type: Number, min: 0},
		id: {type: Number, min: 0},
		config: String,
		match: {type: mongoose.Schema.Types.ObjectId, ref: 'Match'},
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

submissionSchema.methods.isViewableBy = function(user) {
	if (!user) {
		return false;
	}

	if (user.admin) {
		return true;
	}

	if (!this.user) {
		return false;
	}

	return this.user._id.equals(user._id);
};

submissionSchema.methods.getHighlight = function() {
	const grammer = {
		node: Prism.languages.javascript,
		'c-gcc': Prism.languages.clike,
		python3: Prism.languages.python,
		'cpp-clang': Prism.languages.cpp,
		ruby: Prism.languages.ruby,
	}[this.language];

	return Prism.highlight(this.code.toString(), grammer);
};

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
