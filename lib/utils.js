'use strict';

var chalk = require('chalk');
var logger = require('./logger');
var pkg = require('../package');
var _open = require('open');
var config = require('./config');

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
    /**
     * Generate an ngdeploy url based on stage and appName
     * @param {String} Stage to be used in the url
     * @param {String} AppName to insert
     * @returns the complete url
     */
    getUrl: function getUrl(stage, appName) {
        return chalk.cyan('https://' + stage + '-' + appName + '.ngdeploy.com/');
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
    },
    open: function open(opts){
        var name = config.get('ngDeployUrl');
        try {
            _open('https://'+(opts.stage || "development") +'-'+name+'.ngdeploy.com');
        }catch (err) {
            logger.error('Failed to load local config: ', err);
        }

    }
};