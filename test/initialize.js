var ngdeploy = require('../lib/cli.js');
var fs = require('fs');
var chai = require('chai');
chai.use(require('chai-as-promised'));

var test = require('./fixtures/ngdeploy.json');
var assert = chai.assert;
var sinon = require('sinon');
var helpers = require('./helpers');
var api = require('../lib/cli');
var utils = require('../lib/utils');
var expect = chai.expect;

function clearConfig(){
    if (fs.existsSync('.ngdeploy')) {
        fs.unlinkSync('.ngdeploy');
    }
}

describe('ngdeploy', function () {
    var sandbox;
    var mockApi;

    beforeEach(function(){
        sandbox = sinon.sandbox.create();
        helpers.mockAuth(sandbox);
        mockApi = sandbox.mock(api);

        api.logger.configure({'level':'error'});
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('.addDomain()', function(){
        before(function(){
            clearConfig();
            ngdeploy.login({global:1, test:1, accountToken:"global token"});
        });

        context('requires an domain, id, and access token', function(){
            it('succeeds with all', function(){
                return expect(ngdeploy.addDoman({id:1, domain:'http://google.com'})).to.not.be.an("error");
            });

            it('fails otherwise', function(){
                return expect(ngdeploy.addDoman({domain:'http://google.com'})).to.be.an('error');
            });
        });
    });

          describe('.login()', function(){
            before(function(){
                clearConfig();
            });

            it('sets the global access key', function(){
                ngdeploy.login({global:1, test:1, accountToken:"global token"});
                ngdeploy.readngdeploy();
                assert.equal(ngdeploy.get("accountToken"), "global token");
            });

            it('sets the local access key', function(){
                ngdeploy.login({local:1, test:1, accountToken:"local token"});
                ngdeploy.readngdeploy();
                assert.equal(ngdeploy.get("accountToken"), "local token");
            });

          });

         describe('.init()', function () {
            before(function () {
                clearConfig();
              });

            it('should not create an empty .ngdeploy file', function () {
                try{
                    ngdeploy.init();
                }catch(e){}
                assert.equal(fs.existsSync('.ngdeploy'), false);
              });
          });

        describe('.init(appname,./dist)', function () {
            before(function () {
                clearConfig();
             });

            it('should create an .ngdeploy file', function () {
                var testJson;

                try{
                    ngdeploy.createConfiguration(test);
                }catch(e){}

                assert.equal(fs.existsSync('.ngdeploy'), true);

                try {
                     testJson = JSON.parse(fs.readFileSync('.ngdeploy'));
                }catch(e){}
                assert.equal(testJson.name, 'testapp');
                assert.equal(testJson.dist, './dist');
                assert.equal(testJson.id, 11);

              });

            after(function () {
                clearConfig();
              });
          });

        describe('.clean()', function () {
            before(function () {
                try{
                    ngdeploy.createConfiguration(test);
                }catch(e){}
              });

            it('(default) should remove the .ngdeploy file', function () {
                ngdeploy.clean();
                assert.equal(fs.existsSync('.ngdeploy'), false);
              });

            it(' -g should remove the ~/.ngdeploy file', function () {
                ngdeploy.setAccountToken("test account",1);
                ngdeploy.clean({global:1});
                assert.equal(fs.existsSync('.ngdeploy'), false);
            });

            it(' -l should remove the .ngdeploy file', function(){
                    ngdeploy.setAccountToken("test account",0);
                    ngdeploy.clean({local:1});
                    assert.equal(fs.existsSync('.ngdeploy'), false);
            });
            it(' -l -g should remove both .ngdeploy files', function(){
                ngdeploy.setAccountToken("local account",0);
                ngdeploy.setAccountToken("global account",1);
                ngdeploy.clean({local:1, global:1});
                assert.equal(fs.existsSync('.ngdeploy'), false);
                assert.equal(fs.existsSync( utils.getUserHome() + '/.ngdeploy'), false);
            });
          });


    describe('init with local and global accessToken', function () {
        before(function () {
            try{
            }catch(e){}
        });

        it('should use global by default', function () {
            ngdeploy.createConfiguration(test);
            ngdeploy.setAccountToken("global token", 1);
            ngdeploy.readngdeploy();
            assert.equal(ngdeploy.get("accountToken"), "global token");
        });

        it('should use the local if both present', function () {
            ngdeploy.createConfiguration(test);
            ngdeploy.setAccountToken("global token", 1);
            ngdeploy.setAccountToken("local token", 0);
            ngdeploy.readngdeploy();
            assert.equal(ngdeploy.get("accountToken"), "local token");
        });

        after(function () {
            clearConfig();
        });

    });

});
