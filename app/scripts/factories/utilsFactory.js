'use strict';

angular.module('pointoApp')
    .factory('utilsFactory', function() {
    
    	var utilsFactory = {};

    	utilsFactory.randomID = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        utilsFactory.hasStorage = function() {
        	try {
		        return 'localStorage' in window && window.localStorage !== null;
		    } catch(e) {
		        return false;
		    }
        };

        return {
        	randomID: utilsFactory.randomID,
        	hasStorage: utilsFactory.hasStorage
        };

    });