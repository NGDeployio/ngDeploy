'use strict';

var logger = require('./logger');
var utils = require('./utils');
var auth = require('./auth');
var fs = require('fs');

var authedRequest = auth.request;

function add(opts) {
    console.log(arguments);
    var appId = opts.appId;
    var pathToKey = opts.pathToKey;
    var pathToCert = opts.pathToCert;
    var key = null;
    var cert = null;

    if (pathToKey && fs.existsSync(pathToKey)) {
        key = fs.readFileSync(pathToKey);
        key = new Buffer(key, 'ascii').toString("base64");
    }else{
        return utils.fatal("Specified path to key: " + pathToKey + " does not exist.");
    }

    if (pathToCert && fs.existsSync(pathToCert)) {
        cert = fs.readFileSync(pathToCert);
        cert = new Buffer(key, 'ascii').toString("base64");
    }else{
        return utils.fatal('Specified path to certficiate: ' + pathToCert + " does not exist.");
    }

    var obj = {id: Number(appId), ssl: { key: key, cert:cert }};

    authedRequest(opts.accountToken).post({
        url: 'https://api.ngdeploy.com/apps/hosts',
        body: obj,
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
module.exports = {
    perform: function perform(action, opts) {
        if (action === 'add') {
            return add(opts);
        }

        return;
    }
};