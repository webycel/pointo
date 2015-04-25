'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
    .controller('MainCtrl', function ($scope, storyFactory) {
        
        $scope.name = 'Jeff';
        $scope.sessionID = 222018624;

        $scope.createSession = function() {
            storyFactory.createSession($scope.name);
        };

        $scope.joinSession = function() {
            storyFactory.joinSession($scope.sessionID, $scope.name);
        };

});
