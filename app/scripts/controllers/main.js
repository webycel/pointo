'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('MainCtrl', function ($scope, viewFactory, accountFactory, storyFactory) {

		accountFactory.init();

		$scope.authUser = accountFactory.getUser;
		$scope.name = $scope.authUser;
        $scope.joinName = $scope.authUser;
		$scope.passcode = null;
		$scope.sessionID = null;
		$scope.spectator = false;
		$scope.errors = viewFactory.getErrors;
		$scope.loading = viewFactory.getLoading;
		$scope.auth = {
			state: {
				login: false,
				register: false
			},
			login: {
				email: '',
				password: ''
			},
			register: {
				email: '',
				password: ''
			}
		};

		//reset
		viewFactory.setLoading('create', false);
		viewFactory.setLoading('join', false);
		viewFactory.setLoading('joinSpectator', false);
		viewFactory.setErrors('noSession', false);

		$scope.createSession = function () {
			if (!$scope.loading().create) {
				$scope.loading().create = true;
				var name = $scope.authUser().account ? $scope.authUser().name : $scope.name;
				storyFactory.createSession({name: name, passcode: $scope.passcode});
			}
		};

		$scope.joinSession = function () {
			if (!$scope.loading().join) {
				if ($scope.spectator) {
					viewFactory.setLoading('joinSpectator', true);
				} else {
					viewFactory.setLoading('join', true);
				}

				viewFactory.setErrors('noSession', false);

				storyFactory.joinSession($scope.sessionID, $scope.joinName, $scope.spectator, true);

				setTimeout(function () {
					$scope.$apply();
				}, 1000);
			}
		};

		$scope.formLogin = function () {
			$scope.auth.state.login = true;
			$scope.auth.state.register = false;
		};

		$scope.formRegister = function () {
			$scope.auth.state.register = true;
			$scope.auth.state.login = false;
		};

		$scope.login = function () {
			viewFactory.setLoading('login', true);
			viewFactory.setErrors('registerError', false);
			accountFactory.login($scope.auth.login.email, $scope.auth.login.password);
		};

		$scope.register = function () {
			viewFactory.setLoading('register', true);
			viewFactory.setErrors('registerError', false);
			accountFactory.register($scope.auth.register.email, $scope.auth.register.password);
		};

	});