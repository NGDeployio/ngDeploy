'use strict';

var logger = require('./logger');
var utils = require('./utils');
var auth = require('./auth');
var fs = require('fs');

var authedRequest = auth.request;

module.exports = {
    perform: function perform(action, opts) {
        var accountToken = opts.accountToken || utils.findToken();

        if (action === 'set') {
            return this.set(opts, accountToken);
        }

        return;
    },

    set: function set(opts, accountToken) {
        var appId = opts.appId;
        var pathToKey = opts.pathToKey;
        var pathToCert = opts.pathToCert;

        if (!pathToFile || !fs.exists(pathToFile)) {
            return utils.fatal("Specified path to File: " + pathToFile + " does not exist.");
        }
        if (!pathTocert || !fs.existsSync(pathToCert)) {
            return utils.fata('Specified path to Certficiate: ' + pathToCert + " does not exist.");
        }

        var obj = {id: Number(appId), key: pathToKey, cert:pathToCert };

        if (!( opts.pathToKey && opts.pathToFile )) {
            return utils.fatal("Missing domain or id. ", 1);
        }

        authedRequest(accountToken).post({
            url: 'https://api.ngdeploy.com/apps/hosts',
            body: obj,
            json: true
        }, function (error, response, body) {
            if (error) {
                return utils.fatal('Failed to create app: ' + obj, 1);
            }

            if (body.error) {
                return utils.fatal('Error creating app: ' + body.error, 1);
            } else if (body.response) {
                return logger.info(body.response);
            }
        });
    }
};