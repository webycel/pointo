'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
    .controller('StoryCtrl', function ($scope, $routeParams, $window, storyFactory) {

        var sessionID = $routeParams.sessionID,
            session, exists;

        if(sessionID < 100000 || sessionID > 999999) {
            $window.location.assign('#/');
        }
        
        exists = storyFactory.sessionExists(sessionID).once('value', function(snapshot) {
            if(!snapshot.child(sessionID).exists()) {
                $window.location.assign('#/');
            } else {
                $scope.view = 1;
                $scope.name = '';
                $scope.sessionID = sessionID;
                $scope.revealed = false;
                $scope.isFlipped = false;

                if(!storyFactory.isLoggedIn()) {
                    $scope.view = 2;
                } else if(!storyFactory.user.redirect) {
                    storyFactory.joinSession(sessionID, storyFactory.user.name);
                }

                session = storyFactory.getSession(sessionID);

                $scope.user = storyFactory.user;
                $scope.participants = session.participants;
                $scope.session = session.session;

                $scope.storypoints = [
                    { text: 0, value: 0 },
                    { text: '½', value: 0.5 },
                    { text: 1, value: 1 },
                    { text: 2, value: 2 },
                    { text: 3, value: 3 },
                    { text: 5, value: 6 },
                    { text: 8, value: 8 },
                    { text: 13, value: 13 },
                    { text: 20, value: 20 },
                    { text: 40, value: 40 },
                    { text: 100, value: 100 },
                    { text: '?', value: -2 }];
            }

        });

        $scope.joinSession = function() {
            storyFactory.joinSession(sessionID, $scope.name);
            $scope.view = 1;
        };

        $scope.vote = function(points) {
            storyFactory.setVote(points);
        };

        $scope.revealVotes = function() {
            if(!$scope.revealed) {
                $scope.revealed = true;
                $scope.flip();
                storyFactory.revealVotes();
            }
        };

        $scope.clearVotes = function() {
            if($scope.revealed) {
                $scope.revealed = false;
                $scope.flip();
                storyFactory.clearVotes();
            }
        };

        $scope.flip = function() {
            $scope.isFlipped =! $scope.isFlipped;
        };

    });
