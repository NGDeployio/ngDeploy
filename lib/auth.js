var request = require('request');
var utils = require('./utils');

module.exports = {
    request : function(token){
        if( ! token ){
            token = utils.findToken();
        }

        return request.defaults(
            { json: true,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
                },
            });
    }

};