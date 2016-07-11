'use strict';

var chalk = require('chalk');
var logger = require('./logger');

var isWindows = process.platform === 'win32';

module.exports = {
    /**
     * Log an info statement with a green checkmark at the start of the line.
     * @param {String} The message to log
     * @param {String} The log type, defaults to 'info'
     */
    logSuccess: function(message, type) {
        type = type || 'info';
        var chr = isWindows ? '+' : '✔';
        logger[type](chalk.green(chr + ' '), message);
    },
    /**
     * Log an info statement with a gray bullet at the start of the line.
     * @param {String} The message to log
     * @param {String} The log type, defaults to 'info'
     */
    logBullet: function(message, type) {
        type = type || 'info';
        logger[type](chalk.cyan.bold('i '), message);
    },
    /**
     * Log an info statement with a gray bullet at the start of the line.
     * @param {String} The message to log
     * @param {String} The log type, defaults to 'info'
     */
    logWarning: function(message, type) {
        type = type || 'warn';
        var chr = isWindows ? '!' : '⚠';
        logger[type](chalk.yellow.bold(chr + ' '), message);
    }
};