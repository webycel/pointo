'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
    .controller('StoryCtrl', function ($scope, $routeParams, $location, storyFactory) {

        var sessionID = $routeParams.sessionID;

        if(sessionID < 100000000 || sessionID > 999999999) {
            $location.path('');
        }

        var session = storyFactory.getSession(sessionID);
        //$scope.participants = { users: { name: 'Anthony' } };
        $scope.participants = session;

        console.log(sessionID);

    });
