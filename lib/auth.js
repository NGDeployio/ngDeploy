var request = require('request');
var config = require('./config');

module.exports = {
    /**
     * Returns a request object without authentication headers
     * @param {String} optional Account Token to use
     */
    urequest : function(){
        return request.defaults(
            {
                json: true,
                headers: {
                    'Version':'1.0',
                    'Content-Type': 'application/json',
                },
            });
    },
    /**
     * Returns a request object with the appropriate authentication headers
     * @param {String} optional Account Token to use
     */
    request : function(token){
        if( ! token ){
            token = config.findToken();
        }

        return request.defaults(
            {
                json: true,
                headers: {
                    'Version':'1.0',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + token,
                },
            });
    }

};