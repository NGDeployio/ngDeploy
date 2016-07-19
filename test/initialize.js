var ngdeploy = require('../lib/cli.js');
var fs = require('fs');
var chai = require('chai');
chai.use(require('chai-as-promised'));

var test = require('./fixtures/ngdeploy.json');
var assert = chai.assert;
var sinon = require('sinon');
var helpers = require('./helpers');
var api = require('../lib/cli');
var domains = require('../lib/domain');
var expect = chai.expect;

var config = require('../lib/config');

function clearConfig(){
    ngdeploy.clean({local:1,global:1});
}

var debug = true;

describe('ngdeploy', function () {
    var sandbox;
    var mockApi;

    beforeEach(function(){
        sandbox = sinon.sandbox.create();
        helpers.mockAuth(sandbox);
        mockApi = sandbox.mock(api);
        clearConfig();

        if(!debug) {
            api.logger.configure({'level':'error'});
        }
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('.addDomain()', function(){
        before(function(){
            ngdeploy.login({global:1, accountToken:"global token"});
        });

        context('requires an domain, id, and access token', function(){
            it('succeeds with all', function(){
                return expect(domains.add({appId:1,domain:'google.com'})).to.not.be.an("error");
            });
        });
    });

          describe('.login()', function(){
            it('sets the global access key', function(){
                ngdeploy.login({global:1, accountToken:"global token"});
                console.log(config.findToken());
                assert.equal(config.findToken(), "global token");
            });

            it('sets the local access key', function(){
                ngdeploy.login({global:0, accountToken:"local token"});
                assert.equal(config.findToken(), "local token");
            });

          });

         describe('.init()', function () {

            it('should not create an empty .ngdeploy file', function () {
                try{
                    ngdeploy.init();
                }catch(e){}
                assert.equal(fs.existsSync('.ngdeploy'), false);
              });
          });

        describe('.init(appname,./dist)', function () {

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
                config.setAccountToken("test account",1);
                ngdeploy.clean({global:1});
                assert.equal(fs.existsSync('.ngdeploy'), false);
            });

            it(' -l should remove the .ngdeploy file', function(){
                    config.setAccountToken("test account",0);
                    ngdeploy.clean({local:1});
                    assert.equal(fs.existsSync('.ngdeploy'), false);
            });
            it(' -l -g should remove both .ngdeploy files', function(){
                config.setAccountToken("local account",0);
                config.setAccountToken("global account",1);
                ngdeploy.clean({local:1, global:1});
                assert.equal(fs.existsSync('.ngdeploy'), false);
                assert.equal(fs.existsSync( config.getUserHome() + '/.ngdeploy'), false);
            });
          });


    describe('init with local and global accessToken', function () {
        it('should use global by default', function () {
            ngdeploy.createConfiguration(test);
            config.setAccountToken("global token", 1);
            assert.equal(config.findToken(), "global token");
        });

        it('should use the local if both present', function () {
            ngdeploy.createConfiguration(test);
            config.setAccountToken("global token", 1);
            config.setAccountToken("local token", 0);
            assert.equal(config.findToken(), "local token");
        });
    });

    describe("end to end test", function(){
        it("log the user in", function(){
            //ngdeploy.login('test key');
        });

        it("create an application", function(){
            //ngdeploy.create(test);
        });

        it("initialize the test application", function(){
            //ngdeploy.init(test);
        });

        it("push it to development", function(){
            //ngdeploy.push();
        });

        it("promote to staging", function(){
            //ngdeploy.promote('staging');
        });

        it("promote to production", function(){
            //ngdeploy.promote('production');
        });

        it("add a domain", function(){
            //domains.add('http://ngdeploy.org');
        });
    });
});
