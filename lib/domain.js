'use strict';

var chalk = require('chalk');
var logger = require('./logger');

module.exports = {
  perform: function perform(action, id, domain, accountToken){
        if(action === 'add'){
            return this.add(id,domain,accountToken);
        }

      return;
  },
  add: function add(id, domain, accountToken){
        logger.log(chalk.cyan(id),domain,accountToken);
  }
};