var ngdeploy = require('../lib/cli.js');
var fs = require('fs');
var chai = require('chai');

var assert = chai.assert;

var test = {
    name: 'testapp',
    version: '0.1.1',
    dist: './dist',
    ngDeployUrl: 'testapp',
    path: '',
    endpoint: 'https://api.ngdeploy.com',
    accountToken: '123123123',
    id: 11, };

function clearConfig(){
    if (fs.existsSync('.ngdeploy')) {
        fs.unlinkSync('.ngdeploy');
    }
}

describe('ngdeploy', function () {
          describe('.login()', function(){
            before(function(){
                clearConfig();
            });
            it('sets the global access key', function(){
                ngdeploy.login({global:1});
                ngdeploy.readngdeploy();
                assert.equal(ngdeploy.get("accountToken"), "global token");
            });

            it('sets the local access key', function(){
                ngdeploy.login({local:1});
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
                assert.equal(fs.existsSync( ngdeploy.getUserHome() + '/.ngdeploy'), false);
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
