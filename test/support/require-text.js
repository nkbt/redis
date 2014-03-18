"use strict";

var fs = require('fs');
var path = require('path');
var _ = require('underscore');


function requireText(file) {
	var filePath = path.join(__dirname, '..', file);
	return fs.readFileSync(filePath, 'UTF-8');
}

module.exports = exports = _.memoize(requireText);
