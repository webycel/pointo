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

        var sessionID = $routeParams.sessionID,
            session;

        if(sessionID < 100000000 || sessionID > 999999999) {
            $location.path('');
        }
        storyFactory.sessionExists(sessionID);
        
        $scope.view = 1;
        $scope.name = '';
        $scope.sessionID = sessionID;

        console.log(storyFactory.user);
        
        if(!storyFactory.isLoggedIn()) {
            $scope.view = 2;
        } else {
            storyFactory.joinSession(sessionID, storyFactory.user.name);
        }

        session = storyFactory.getSession(sessionID);


        $scope.participants = session.participants;
        $scope.storypoints = [0, '½', 1, 2, 3, 5, 8, 13, 20, 40, 100, '?'];

        $scope.joinSession = function() {
            storyFactory.joinSession(sessionID, $scope.name);
            $scope.view = 1;
        };

    });
