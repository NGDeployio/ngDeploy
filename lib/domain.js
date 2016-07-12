'use strict';

var logger = require('./logger');
var utils = require('./utils');
var auth = require('./auth');
var authedRequest = auth.request;

module.exports = {
  perform: function perform(action, id, domain, accountToken){
        if(action === 'add'){
            return this.add(id,domain,accountToken);
        }

      return;
  },

  add: function add(id, domain, accountToken){
          var obj = {id:id, domain:domain};

          if( ! ( id && domain ) ) {
              return utils.fatal("Missing domain or id. ", 1);
          }

          if ( accountToken === undefined ) {
              accountToken = utils.findToken();
          }

          if ( accountToken === undefined ) {
              return utils.fatal("Could not resolve account token. ", 1);
          }

          authedRequest().post({

              url: 'https://api.ngdeploy.com/domains',
              body: obj ,
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer ' + accountToken
              }

          }, function (error, response, body) {
              if (error) {
                  return utils.fatal('Failed to create app: ' + obj, 1);
              }

              if (body.error) {
                  return utils.fatal('Error creating app: '+ body.error, 1);
              } else if (body.response) {
                  return logger.info(body.response);
              }
          });
  }
};