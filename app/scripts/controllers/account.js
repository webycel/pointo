'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:AccountCtrl
 * @description
 * # AccountCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('AccountCtrl', function($scope, $document, $timeout, viewFactory, accountFactory) {

		accountFactory.init();

		$scope.authUser = accountFactory.getUser;
		$scope.errors = viewFactory.getErrors;
		$scope.account = {
			errors: {}
		};
		$scope.loading = viewFactory.getLoading;
		$scope.accountView = true;

		$scope.accountForm = {
			name: ''
		};

		$scope.toggleAccount = function(e) {
			e.preventDefault();
			$scope.accountView = !$scope.accountView;
		};

		$scope.updateAccount = function() {

			if (!$scope.account.updating) {

				$scope.account.updating = true;

				// reset errors
				$scope.account.errors.name = null;
				$scope.account.errors.email = null;
				$scope.account.errors.password = null;

				$scope.account.updates = 0;
				$scope.account.updateCounter = 0;

				console.log($scope.accountForm);
				var newData = {};

				// name validation
				if ($scope.accountForm.name.length > 20) {
					$scope.account.errors.name = 'Name is too long, max 20 characters';
					return false;
				} else if ($scope.accountForm.name) {
					newData.name = $scope.accountForm.name;
					$scope.account.updates++;
				}

				// email validation
				if ($scope.accountForm.email && !$scope.accountForm.emailPassword) {
					$scope.account.errors.email = 'Please confirm your email change with your current password';
					return false;
				} else if (!$scope.accountForm.email && $scope.accountForm.emailPassword) {
					$scope.account.errors.email = 'Please enter an email address';
					return false;
				} else if ($scope.accountForm.email && $scope.accountForm.emailPassword) {
					newData.email = $scope.accountForm.email;
					newData.emailPassword = $scope.accountForm.emailPassword;
					$scope.account.updates++;
				}

				// password change validation
				if ($scope.accountForm.passwordOld && !$scope.accountForm.passwordNew) {
					$scope.account.errors.password = 'Please enter your new password';
					return false;
				} else if (!$scope.accountForm.passwordOld && $scope.accountForm.passwordNew) {
					$scope.account.errors.password = 'Please confirm your password change with your current password';
					return false;
				} else if ($scope.accountForm.passwordOld && $scope.accountForm.passwordNew) {
					newData.passwordOld = $scope.accountForm.passwordOld;
					newData.passwordNew = $scope.accountForm.passwordNew;
					$scope.account.updates++;
				}


				// UPDATE ON DATABASE
				viewFactory.setLoading('updateAccount', true);

				// update name
				if (newData.name) {
					accountFactory.updateAccount(true).set({
						name: newData.name
					}, function(error) {
						if (!error) {
							$timeout(function() {
								accountFactory.setUserName(newData.name);
								$scope.account.updateCounter++;
								$scope.checkUpdateAccountFinished();
							});
						} else {
							$scope.account.errors.name = error.message;
						}
					});
				}

				// update email
				if (newData.email && newData.emailPassword) {
					console.log('email change');
					console.log($scope.authUser().data.password.email);

					accountFactory.updateAccount(false).changeEmail({
						oldEmail: $scope.authUser().data.password.email,
						newEmail: newData.email,
						password: newData.emailPassword
					}, function(error) {
						$timeout(function() {
							if (error) {
								console.log(error);
								switch (error.code) {
									case 'INVALID_PASSWORD':
										$scope.account.errors.email = 'The specified password is incorrect.';
										break;
									case 'INVALID_USER':
										$scope.account.errors.email = 'The specified password is incorrect.';
										break;
									default:
										$scope.account.errors.email = error.message;
								}
							} else {
								console.log('email success');
							}
						});
					});
				}

				// uodate password
				if (newData.passwordOld && newData.passwordNew) {
					console.log('password change');
				}
			}
		};

		$scope.checkUpdateAccountFinished = function() {
			if ($scope.account.updateCounter === $scope.account.updates) {
				viewFactory.setLoading('updateAccount', false);
				$scope.account.updateSuccess = 'Your account data has been updated!';
			}
		};

		$scope.closeAccountPanel = function() {
			$scope.$apply(function() {
				$scope.accountView = false;
			});
		};

		$document.bind('keyup', function(e) {
			if (e.which === 27) {
				$scope.closeAccountPanel();
			}
		});

		$document.bind('click', function(e) {
			if (e.target.closest('.account .account-settings-panel') === null && e.target.closest('.account .fakelink') === null) {
				$scope.closeAccountPanel();
			}
		});

	});