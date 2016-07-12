'use strict';

var chalk = require('chalk');
var logger = require('./logger');
var fs = require('fs');
var pkg = require('../package');

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

    /**
     * Log an info statement with a gray bullet at the start of the line.
     * @param {String} The message to log
     * @param {String} The log type, defaults to 'info'
     */
    logError: function(message, type) {
        type = type || 'warn';
        logger[type](chalk.yellow.bold('x' + ' '), message);
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
        logger.silly("findToken (global): ", globalConfig);
        logger.silly("findToken (local): ", pkgConfig);
        var sys = {};

        try {
            if(fs.existsSync(pkgConfig)){
                sys = JSON.parse(fs.readFileSync(pkgConfig));
                if (sys.accountToken && sys.accountToken !== "" ) {
                    return sys.accountToken;
                }
            }
        }catch (err) {
            logger.error('Failed to load local config: ', err);
        }

        try {
            if (fs.existsSync(globalConfig)){
                sys = JSON.parse(fs.readFileSync(globalConfig));
                if(sys.accountToken) {
                    return sys.accountToken;
                }
            }
        }catch (err) {
            logger.error('Failed to load global config: ', err);
        }

        this.logError("Not logged in. "+chalk.red("ngdeploy login"));

        return '';
    },
    header: function header() {
        logger.info(' ngdeploy: ' + pkg.description + ' (v' + pkg.version + ')');
    },
    helpHeader: function helpHeader() {
        this.header();
        logger.info(' ngdeploy --help for help menu');
        logger.info('');
    },
    helpFooter: function helpFooter() {
        logger.info('For documentation visit http://ngdeploy.com');
        logger.info('');
    },
    fatal: function fatal(msg, code) {
        //this.helpHeader();
        logger.info(chalk.red('Fatal error: ' + msg));
        logger.info('');
        this.helpFooter();
        //process.exit(code);
        return new Error({'error':code, 'msg':msg});
    }
};