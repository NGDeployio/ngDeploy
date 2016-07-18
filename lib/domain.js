'use strict';

var logger = require('./logger');
var utils = require('./utils');
var auth = require('./auth');
var authedRequest = auth.request;

module.exports = {
    add: function add(opts){
    var id = opts.appId;
    var domain = opts.domain;
    var appName = opts.appName;
    var accountToken = opts.accountToken;

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
    },
upgrade: function upgrade(opts){
    var accountToken = opts.accountToken;
    var obj = {id:Number(opts.id)};

    if( !opts.id ) {
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
},

purge: function purge(opts) {
    var accountToken = opts.accountToken;
    var obj = {id: Number(opts.id)};

    if (!opts.id) {
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
            return utils.fatal('Failed to purge the domain: ' + body.error, 1);
        } else if (body.response) {
            return logger.info("Successfully purged the cache for app.");
        }
    });
},
perform: function perform(action, opts){
      //console.log(this);
      if(this[action]){
          this[action].call(opts);
      }else{
            console.log(this);
            //console.log(action);
      }
      //invoke(this,action,opts);
      //switch(action){
      //  case 'add': return add(opts);
      //  case 'upgrade': return upgrade(opts);
      //  case 'purge': return purge(opts);
      //}
  }
};