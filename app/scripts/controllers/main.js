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
        
        $scope.name = '';
        $scope.joinName = '';
        $scope.sessionID = null;
        $scope.errors = storyFactory.getErrors;
        $scope.loading = storyFactory.getLoading;

        //reset
        storyFactory.setLoading('create', false);
        storyFactory.setLoading('join', false);
        storyFactory.setErrors('noSession', false);

        $scope.createSession = function() {
            if(!$scope.loading().create) {
                $scope.loading().create = true;
                storyFactory.createSession($scope.name);
            }
        };

        $scope.joinSession = function() {
            if(!$scope.loading().join) {
                storyFactory.setLoading('join', true);
                storyFactory.setErrors('noSession', false);

                storyFactory.joinSession($scope.sessionID, $scope.joinName);

                setTimeout(function() { $scope.$apply(); }, 1000);
            }
        };

});
