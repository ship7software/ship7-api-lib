'use strict';
module.exports = {
	Controller: require('./lib/controller'),
	Facade: require('./lib/facade'),
	Crypto: require('./lib/crypto'),
	Error: require('./lib/error'),
	Router: require('./lib/router'),
	Mail: require('./lib/mail'),
	Test: {
		Rest: require('./lib/test/rest')
	}
};
