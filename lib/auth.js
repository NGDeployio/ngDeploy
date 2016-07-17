var request = require('request');
var utils = require('./utils');

module.exports = {
    /**
     * Returns a request object with the appropriate authentication headers
     * @param {String} optional Account Token to use
     */
    request : function(token){
        if( ! token ){
            token = utils.findToken();
        }
        console.log(token);
        return request.defaults(
            { json: true,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
                },
            });
    }

};