var ngdeploy = require('../lib/cli.js');
var fs = require('fs');
var chai = require('chai');

var assert = chai.assert;
var should = chai.should();

var test = {
    name: 'testapp',
    version: '0.1.1',
    dist: './dist',
    ngDeployUrl: 'testapp',
    path: '',
    endpoint: 'https://api.ngdeploy.com',
    accountToken: '123123123',
    id: 11, };

describe('ngdeploy', function () {
        describe('.init()', function () {
            before(function () {
                if (fs.existsSync('.ngdeploy')) {
                  fs.unlinkSync('.ngdeploy');
                }
              });

            it('should not create an empty .ngdeploy file', function () {
                ngdeploy.init();
                assert.equal(fs.existsSync('.ngdeploy'), false);
              });
          });

        describe('.init(appname,./dist)', function () {
            before(function () {
                if (fs.existsSync('.ngdeploy')) {
                  fs.unlinkSync('.ngdeploy');
                }

                console.log('before');
              });

            it('should create an .ngdeploy file', function () {

                ngdeploy.createConfiguration(test);
                assert.equal(fs.existsSync('.ngdeploy'), true);

                var testJson = JSON.parse(fs.readFileSync('.ngdeploy'));
                assert.equal(testJson.name, 'testapp');
                assert.equal(testJson.dist, './dist');
                assert.equal(testJson.id, 11);

              });

            after(function () {
                if (fs.existsSync('.ngdeploy')) {
                  fs.unlinkSync('.ngdeploy');
                }
              });
          });

        describe('.clean()', function () {
            before(function () {
                ngdeploy.createConfiguration(test);
              });

            it('should remove the .ngdeploy file', function () {
                ngdeploy.clean();
                assert.equal(fs.existsSync('.ngdeploy'), false);
              });
          });

      });
