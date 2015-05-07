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

        utilsFactory.getClosestNumber = function(array, num) {
            var i = 0,
                minDiff = 1000,
                closest;

            for(i in array){
                var m = Math.abs(num - array[i]);
                if(m < minDiff){ 
                    minDiff = m; 
                    closest = array[i]; 
                }
            }

            return closest;
        };

        return {
        	randomID: utilsFactory.randomID,
        	hasStorage: utilsFactory.hasStorage,
            getClosestNumber: utilsFactory.getClosestNumber
        };

    });