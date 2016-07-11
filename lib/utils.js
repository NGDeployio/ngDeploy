'use strict';

var chalk = require('chalk');
var logger = require('./logger');
var fs = require('fs');

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
    },

    getUrl: function getUrl(stage, appName) {
        return chalk.cyan('https://' + stage + '-' + appName + '.ngdeploy.com/');
    },
    getUserHome: function getUserHome() {
        return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
    },

    configPath: function configPath(global) {
        var filename = '.ngdeploy';
        if (global) {
            return this.getUserHome() + '/' + filename;
        }

        return filename;
    },

    findToken: function findToken() {
        var globalConfig = this.configPath(1);
        var pkgConfig = this.configPath(0);
        var sys = {};

        try {
            sys = JSON.parse(fs.readFileSync(pkgConfig));
            if (fs.existsSync(pkgConfig) && sys.accountToken) {
                return sys.accountToken;
            }
        }catch (err) {
        }

        try {
            sys = JSON.parse(fs.readFileSync(globalConfig));
            if (fs.existsSync(globalConfig) &&  sys.accountToken) {
                return sys.accountToken;
            }
        }catch (err) {
            //logger.info('Failed to load global config: ', err);
        }

        return '';
    }
};