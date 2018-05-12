const Contest = require('../models/Contest');

/*
 * GET /
 * Home page.
 */
module.exports.index = async (req, res) => {
	const contests = await Contest.find()
		.sort({_id: -1})
		.exec();

	res.render('home', {
		title: 'Home',
		contests,
	});
};
