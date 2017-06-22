'use strict';
module.exports = {
	Controller: require('./lib/controller.js'),
	Facade: require('./lib/facade.js'),
	Crypto: require('./lib/crypto.js'),
	Error: require('./lib/error.js'),
	Router: require('./lib/router.js'),
	Mail: require('./lib/mail.js'),
	Test: {
		Rest: require('./lib/test/rest.js')
	}
};
