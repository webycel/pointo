'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
    .controller('MainCtrl', function ($scope, accountFactory, storyFactory) {
        
        $scope.name = '';
        $scope.joinName = '';
        $scope.sessionID = null;
        $scope.spectator = false;
        $scope.errors = storyFactory.getErrors;
        $scope.loading = storyFactory.getLoading;
        $scope.auth = { 
            state: { login: false, register: false },
            login: { email: '', password: '' },
            register: { email: '', password: '' }
        };

        //reset
        storyFactory.setLoading('create', false);
        storyFactory.setLoading('join', false);
        storyFactory.setLoading('joinSpectator', false);
        storyFactory.setErrors('noSession', false);

        $scope.createSession = function() {
            if(!$scope.loading().create) {
                $scope.loading().create = true;
                storyFactory.createSession($scope.name);
            }
        };

        $scope.joinSession = function() {
            if(!$scope.loading().join) {
                if($scope.spectator) {
                    storyFactory.setLoading('joinSpectator', true);
                } else {
                    storyFactory.setLoading('join', true);
                }

                storyFactory.setErrors('noSession', false);

                storyFactory.joinSession($scope.sessionID, $scope.joinName, $scope.spectator, true);

                setTimeout(function() { $scope.$apply(); }, 1000);
            }
        };

        $scope.formLogin = function() {
            $scope.auth.state.login = true;
            $scope.auth.state.register = false;
        };

        $scope.formRegister = function() {
            $scope.auth.state.register = true;
            $scope.auth.state.login = false;
        };

        $scope.login = function() {
            storyFactory.setLoading('login', true);
            storyFactory.setErrors('registerError', false);
            //accountFactory.login($scope.auth.login.email, $scope.auth.login.password);
        };

        $scope.register = function() {
            storyFactory.setLoading('register', true);
            storyFactory.setErrors('registerError', false);
            accountFactory.register($scope.auth.register.email, $scope.auth.register.password);
        };

});
