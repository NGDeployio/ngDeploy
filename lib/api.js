'use strict';

var logger = require('./logger');
var utils = require('./utils');
var authedRequest = require('./auth').request;

var endpoint =  'https://api.ngdeploy.com';

module.exports = {
    findByName: function findByName(appName,accountToken,cb){
        if( !appName ) {
            return null;
        }

        this.list(accountToken, function(err,items){
            if(err){
                logger.info("findByName: error: ", err);
            }
            if(items){
                var appId = 0;
                items.forEach(function (item) {
                    if( item.apps.ngDeployUrl === appName){
                        appId= item.apps.id;
                    }
                });
                return cb(appId);
            }
        });
    },
    list: function list(accountToken,cb){
            authedRequest(accountToken)
            .get({
                url: endpoint + '/apps',
            }, function (err, response, body) {
                if (err) {
                    logger.info(err);
                    return cb('Error retrieving apps. ' + err, null);
                }
                if (body.error) {
                    logger.info(body.error);
                    return cb('Error retrieving apps. ' + body.error, null);
                }
                if (body && body.length > 0 && body.forEach && cb) {
                    // If callback provided pass on the items.
                        return cb(null,body);
                }
            });
    }
};