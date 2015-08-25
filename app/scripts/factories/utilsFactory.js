'use strict';

angular.module('pointoApp')
    .factory('utilsFactory', function($q) {

        var utilsFactory = {};

        // generate a random session ID
        utilsFactory.randomID = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        // check if localStorage is supported by browser
        utilsFactory.hasStorage = function() {
            try {
                return 'localStorage' in window && window.localStorage !== null;
            } catch (e) {
                return false;
            }
        };

        // get closest number in an array
        utilsFactory.getClosestNumber = function(array, num) {
            var i = 0,
                minDiff = 1000,
                closest;

            for (i in array) {
                var m = Math.abs(num - array[i]);
                if (m < minDiff) {
                    minDiff = m;
                    closest = array[i];
                }
            }

            return parseFloat(closest);
        };

        // encode html
        utilsFactory.encodeHtml = function(rawHtml) {
            return rawHtml.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
                return '&#' + i.charCodeAt(0) + ';';
            });
        };




        /*
            FILEREADER
        */
        utilsFactory.fileReader = {};

        var onLoad = function(reader, deferred, scope) {
            return function() {
                scope.$apply(function() {
                    deferred.resolve(reader.result);
                });
            };
        };

        var onError = function(reader, deferred, scope) {
            return function() {
                scope.$apply(function() {
                    deferred.reject(reader.result);
                });
            };
        };

        var onProgress = function(reader, scope) {
            return function(event) {
                scope.$broadcast('fileProgress', {
                    total: event.total,
                    loaded: event.loaded
                });
            };
        };

        var getReader = function(deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            reader.onprogress = onProgress(reader, scope);
            return reader;
        };

        utilsFactory.fileReader.readAsDataURL = function(file, scope) {
            var deferred = $q.defer();

            var reader = getReader(deferred, scope);
            reader.readAsDataURL(file);

            return deferred.promise;
        };

        // expose public functions
        return {
            randomID: utilsFactory.randomID,
            hasStorage: utilsFactory.hasStorage,
            getClosestNumber: utilsFactory.getClosestNumber,
            encodeHtml: utilsFactory.encodeHtml,
            fileReader: utilsFactory.fileReader
        };

    });
