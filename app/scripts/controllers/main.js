'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('MainCtrl', function ($scope, $timeout, viewFactory, accountFactory, storyFactory) {

		accountFactory.init();

		$scope.authUser = accountFactory.getUser;
		$scope.name = $scope.authUser;
		$scope.joinName = $scope.authUser;
		$scope.passcode = null;
		$scope.passcodeNeeded = false;
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
				storyFactory.createSession({
					name: name,
					passcode: $scope.passcode
				});
			}
		};

		$scope.joinSession = function (id, passcodeEntered) {
			if (!$scope.loading().join) {
				if ($scope.spectator) {
					viewFactory.setLoading('joinSpectator', true);
				} else {
					viewFactory.setLoading('join', true);
				}

				viewFactory.setErrors('noSession', false);
				viewFactory.setErrors('wrongPasscode', false);

				var sid = id || $scope.sessionID;

				storyFactory.sessionExists(sid).once('value', function (snapshot) {
					if (snapshot.val()) {
						$timeout(function () {

							if (snapshot.child(sid).exists()) { // a session exists with this ID
								var session = snapshot.child(sid).val();
								if (!passcodeEntered) {
									if (typeof session.passcode !== 'undefined' && ($scope.authUser().data === null || session.owner !== $scope.authUser().data.uid)) {
										$scope.passcodeNeeded = true;
										$scope.$broadcast('passcodeIsNeeded');
										viewFactory.setLoading('join', false);
										viewFactory.setLoading('joinSpectator', false);
									} else {
										$scope.enterSession(sid);
									}
								} else {
									// check enterd passcode
									if (parseInt($scope.passcode) === session.passcode) {
										$scope.enterSession(sid);
									} else {
										viewFactory.setErrors('wrongPasscode', true);
										viewFactory.setLoading('join', false);
										viewFactory.setLoading('joinSpectator', false);
									}
								}
							} else {
								viewFactory.setErrors('noSession', true);
								viewFactory.setLoading('join', false);
								viewFactory.setLoading('joinSpectator', false);
							}

						});
					}
				});
			}
		};

		$scope.enterSession = function (id) {
			var name = $scope.authUser().account ? $scope.authUser().name : $scope.joinName().name;
			storyFactory.joinSession(id, name, $scope.spectator, true);

			setTimeout(function () {
				$scope.$apply();
			}, 1000);
		};

		$scope.formLogin = function () {
			$scope.auth.state.login = true;
			$scope.auth.state.register = false;
			$scope.$broadcast('enterLogin');
		};

		$scope.formRegister = function () {
			$scope.auth.state.register = true;
			$scope.auth.state.login = false;
			$scope.$broadcast('enterRegister');
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