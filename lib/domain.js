'use strict';

var logger = require('./logger');
var utils = require('./utils');
var auth = require('./auth');
var authedRequest = auth.request;

module.exports = {
  perform: function perform(action, id, domain, opts){
        var accountToken = opts.accountToken || utils.findToken();

       if(action === 'add'){
            return this.add(id,domain,accountToken);
       }

      return;
  },

  add: function add(id, domain, accountToken){
          var obj = {id:Number(id), domain:domain};

          if( ! ( id && domain ) ) {
              return utils.fatal("Missing domain or id. ", 1);
          }

          authedRequest(accountToken).post({
              url: 'https://api.ngdeploy.com/apps/hosts',
              body: obj,
              json:true
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