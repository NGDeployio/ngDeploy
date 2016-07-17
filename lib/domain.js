'use strict';

var logger = require('./logger');
var utils = require('./utils');
var auth = require('./auth');
var authedRequest = auth.request;

function add(id, domain, accountToken){
    var obj = {id:Number(id), domain:domain};

    if( !id || !domain ) {
        return utils.fatal("Missing domain or id. ", 1);
    }

    authedRequest(accountToken).post({
        url: 'https://api.ngdeploy.com/apps/domains',
        body: obj
    }, function (error, response, body) {
        if (error) {
            return utils.fatal('Failed to create app: ' + obj, 1);
        }

        if (body.error) {
            return utils.fatal('Error creating app: '+ body.error, 1);
        } else if (body.response) {
            return logger.info("Successfully added domain. It'll take about 5 minutes for everything to propagate.");
        }
    });
}

function upgrade(id, accountToken){
    var obj = {id:Number(id)};

    if( !id ) {
        return utils.fatal("Missing domain or id. ", 1);
    }

    authedRequest(accountToken).post({
        url: 'https://api.ngdeploy.com/apps/upgrades',
        body: obj
    }, function (error, response, body) {
        if (error) {
            return utils.fatal('Failed to upgrade app: ' + obj, 1);
        }

        if (body.error) {
            return utils.fatal('Failed to upgrade app: '+ body.error, 1);
        } else if (body.response) {
            return logger.info("Successfully upgraded domain.");
        }
    });
}

function purge(id,accountToken){
    var obj = {id:Number(id)};

    if( !id ) {
        return utils.fatal("Missing app id or app name. ", 1);
    }

    authedRequest(accountToken).post({
        url: 'https://api.ngdeploy.com/apps/purges',
        body: obj
    }, function (error, response, body) {
        if (error) {
            return utils.fatal('Failed to purge the domain: ' + obj, 1);
        }

        if (body.error) {
            return utils.fatal('Failed to purge the domain: '+ body.error, 1);
        } else if (body.response) {
            return logger.info("Successfully purged the cache for app.");
        }
    });
}

module.exports = {
  perform: function perform(action, id, domain, opts){
        var accountToken = opts.accountToken;
      //
       switch(action){
           case 'add': return add(id,domain,accountToken);
           case 'upgrade': return upgrade(id,accountToken);
           case 'purge': return purge(id,accountToken);
       }
  }
};