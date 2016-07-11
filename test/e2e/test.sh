#!/usr/bin/env bash
ngdeploy login -a
ngdeploy create testapp123
ngdeploy init testapp123 ./
ngdeploy push

wget http://testapp123-development.ngdeploy.com > test.txt
cat test.txt == "hello world"

ngdeploy promote staging
wget http://testapp123-staging.ngdeploy.com > test.txt
cat test.txt == "hello world"

ngdeploy promote production
wget http://testapp123-production.ngdeploy.com > test.txt
cat test.txt == "hello world"

ngdeploy add domain testapp123 smoothie.rocks
wget http://testapp123-production.ngdeploy.com > test.txt
cat test.txt == "hello world"

