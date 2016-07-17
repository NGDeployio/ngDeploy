'use strict';

var logger = require('./logger');
var utils = require('./utils');
var auth = require('./auth');
var fs = require('fs');

var authedRequest = auth.request;

function add(opts) {
    var appId = opts.appId;
    var pathToKey = opts.pathToKey;
    var pathToCert = opts.pathToCert;
    var domain = opts.domain;
    var key = null;
    var cert = null;

    if (pathToKey && fs.existsSync(pathToKey)) {
        key = fs.readFileSync(pathToKey);
        key = new Buffer(key, 'ascii').toString();
    }else{
        return utils.fatal("Specified path to key: " + pathToKey + " does not exist.");
    }

    if (pathToCert && fs.existsSync(pathToCert)) {
        cert = fs.readFileSync(pathToCert);
        cert = new Buffer(cert, 'ascii').toString();
    }else{
        return utils.fatal('Specified path to cert: ' + pathToCert + " does not exist.");
    }

    var obj = {
        id: Number(appId),
        domain:domain,
        ssl:'enabled',
        sslKey: key,
        sslCert: cert};

    authedRequest(opts.accountToken).post({
        url: 'https://api.ngdeploy.com/apps/ssls',
        body: obj,
    }, function (error, response, body) {
        if (error) {
            return utils.fatal('Error: ' + obj, 1);
        }

        if (body.error) {
            return utils.fatal('Error: ' + body.error, 1);
        }

        if (body.response) {
            return logger.info(body.response);
        }
    });
}


function toggle(state, opts){
    var appId = opts.appId;
    var domain = opts.domain;
    var obj = {
        id: Number(appId),
        domain:domain,
        ssl:state};

    authedRequest(opts.accountToken).post({
        url: 'https://api.ngdeploy.com/apps/ssls',
        body: obj
    }, function (error, response, body) {
        if ( error )        { return utils.fatal('Error: ' + obj, 1); }
        if ( body && body.error)    { return utils.fatal('Error: ' + body.error, 1); }
        if ( body && body.response) { return logger.info(body.response); }
    });
}

module.exports = {
    perform: function perform(action, opts) {
        switch(action){
            case 'add':return add(opts);
            case 'disable': return toggle('disable',opts);
            case 'enable': return toggle('enable',opts);
        }
    }
};