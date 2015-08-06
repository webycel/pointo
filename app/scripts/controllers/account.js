'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:AccountCtrl
 * @description
 * # AccountCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('AccountCtrl', function($scope, $document, $window, $timeout, viewFactory, accountFactory) {

		accountFactory.init();

		var newData = {};

		$scope.authUser = accountFactory.getUser;

		if (!$scope.authUser().account) {
			$window.location.assign('#/');
		}

		$scope.errors = viewFactory.getErrors;
		$scope.account = {
			errors: {}
		};
		$scope.loading = viewFactory.getLoading;
		$scope.accountView = false;

		$scope.accountForm = {
			name: ''
		};
		$scope.account.errors = {};
		$scope.account.updateSuccess = {};
		$scope.account.updating = false;
		$scope.account.emailChange = false;

		$scope.updateAccount = function() {

			if (!$scope.account.updating) {

				$scope.account.updating = true;

				// reset errors
				$scope.account.errors.name = null;
				$scope.account.errors.email = null;
				$scope.account.errors.password = null;
				$scope.account.updateSuccess = {};

				$scope.account.updates = 0;
				$scope.account.updateCounter = 0;

				newData = {};

				// name validation
				if ($scope.accountForm.name.length > 20) {
					$scope.account.errors.name = 'Your name is too long, max 20 characters';
					$scope.account.updating = false;
					return false;
				} else if ($scope.accountForm.name && $scope.accountForm.name.trim().length > 0) {
					newData.name = $scope.accountForm.name;
					$scope.account.updates++;
				}

				// email validation
				if ($scope.accountForm.newEmail && !$scope.accountForm.emailPassword) {
					$scope.account.errors.email = 'Please confirm your email change with your current password';
					$scope.account.updating = false;
					return false;
				} else if (!$scope.accountForm.newEmail && $scope.accountForm.emailPassword) {
					$scope.account.errors.email = 'Please enter your new email address';
					$scope.account.updating = false;
					return false;
				} else if ($scope.accountForm.newEmail && $scope.accountForm.emailPassword) {
					newData.newEmail = $scope.accountForm.newEmail;
					newData.emailPassword = $scope.accountForm.emailPassword;
					$scope.account.updates++;
				}

				// password change validation
				if ($scope.accountForm.passwordOld && !$scope.accountForm.passwordNew) {
					$scope.account.errors.password = 'Please enter your new password';
					$scope.account.updating = false;
					return false;
				} else if (!$scope.accountForm.passwordOld && $scope.accountForm.passwordNew) {
					$scope.account.errors.password = 'Please confirm your password change with your current password';
					$scope.account.updating = false;
					return false;
				} else if ($scope.accountForm.passwordOld && $scope.accountForm.passwordNew) {
					newData.passwordOld = $scope.accountForm.passwordOld;
					newData.passwordNew = $scope.accountForm.passwordNew;
					$scope.account.updates++;
				}


				if ($scope.account.updates === 0) {
					return false;
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
								$scope.account.updateSuccess.name = 'Your name has been successfully updated.';
							});
						} else {
							$scope.account.errors.name = error.message;
						}
					});
				}

				// update password
				if (newData.passwordOld && newData.passwordNew) {
					accountFactory.updateAccount(false).changePassword({
						email: $scope.authUser().data.password.email,
						oldPassword: newData.passwordOld,
						newPassword: newData.passwordNew
					}, function(error) {
						$timeout(function() {
							$scope.account.updateCounter++;
							if (error) {
								switch (error.code) {
									case 'INVALID_PASSWORD':
										$scope.account.errors.password = 'The specified user account password is incorrect.';
										break;
									case 'INVALID_USER':
										$scope.account.errors.password = 'The specified user account does not exist.';
										break;
									default:
										$scope.account.errors.password = error.message;
								}
								$scope.updateAccountError();
							} else {
								$scope.account.updateSuccess.password = 'Your password has been successfully updated.';
								$scope.checkUpdateAccountFinished();
							}
						});
					});
				}

				// update email
				if (newData.newEmail && newData.emailPassword) {
					accountFactory.updateAccount(false).changeEmail({
						oldEmail: $scope.authUser().data.password.email,
						newEmail: newData.newEmail,
						password: newData.emailPassword
					}, function(error) {
						$timeout(function() {
							$scope.account.updateCounter++;
							if (error) {
								switch (error.code) {
									case 'INVALID_PASSWORD':
										$scope.account.errors.email = 'The specified password is incorrect.';
										break;
									case 'INVALID_USER':
										$scope.account.errors.email = 'The specified user does not exist.';
										break;
									default:
										$scope.account.errors.email = error.message;
								}
								$scope.updateAccountError();
							} else {
								$scope.account.emailChange = true;
								$scope.authUser().data.password.email = newData.newEmail;
								$scope.account.updateSuccess.email = 'Your email address has been successfully updated.';
								$scope.checkUpdateAccountFinished();
							}
						});
					});
				}
			}
		};

		$scope.checkUpdateAccountFinished = function() {
			console.log($scope.account.updateCounter, $scope.account.updates);
			if ($scope.account.updateCounter === $scope.account.updates) {
				$timeout(function() {
					viewFactory.setLoading('updateAccount', false);
					$scope.account.updating = false;

					accountFactory.init();

					if ($scope.account.emailChange) {
						$scope.account.emailChange = false;
						// reinit account data
						accountFactory.updateAccount(false).unauth();

						console.log(newData.newEmail, newData.emailPassword);

						accountFactory.updateAccount(false).authWithPassword({
							email: newData.newEmail,
							password: newData.emailPassword
						}, function() {});
					}
				});
			}
		};

		$scope.updateAccountError = function() {
			$timeout(function() {
				viewFactory.setLoading('updateAccount', false);
				$scope.account.updating = false;
			});
		};

	});