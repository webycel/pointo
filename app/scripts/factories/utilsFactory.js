'use strict';

angular.module('pointoApp')
    .factory('utilsFactory', function($q, $log) {

        var utilsFactory = {};

        utilsFactory.randomID = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        utilsFactory.hasStorage = function() {
            try {
                return 'localStorage' in window && window.localStorage !== null;
            } catch (e) {
                return false;
            }
        };

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
                scope.$broadcast("fileProgress", {
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

        return {
            randomID: utilsFactory.randomID,
            hasStorage: utilsFactory.hasStorage,
            getClosestNumber: utilsFactory.getClosestNumber,
            fileReader: utilsFactory.fileReader
        };

    });