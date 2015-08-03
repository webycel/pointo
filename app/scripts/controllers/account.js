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
		$scope.accountView = false;

		$scope.toggleAccount = function(e) {
			e.preventDefault();
			$scope.accountView = !$scope.accountView;

			// reset form
			$scope.accountForm = {
				name: '',
				oldEmail: $scope.authUser().data.password.email
			};
			$scope.account.errors = {};
			$scope.account.updateSuccess = null;
		};

		$scope.updateAccount = function() {

			if (!$scope.account.updating) {

				$scope.account.updating = true;

				// reset errors
				$scope.account.errors.name = null;
				$scope.account.errors.email = null;
				$scope.account.errors.password = null;
				$scope.account.updateSuccess = null;

				$scope.account.updates = 0;
				$scope.account.updateCounter = 0;

				var newData = {};

				// name validation
				if ($scope.accountForm.name.length > 20) {
					$scope.account.errors.name = 'Name is too long, max 20 characters';
					$scope.account.updating = false;
					return false;
				} else if ($scope.accountForm.name) {
					newData.name = $scope.accountForm.name;
					$scope.account.updates++;
				}

				// email validation
				if ($scope.accountForm.oldEmail && $scope.accountForm.newEmail && !$scope.accountForm.emailPassword) {
					$scope.account.errors.email = 'Please confirm your email change with your current password';
					$scope.account.updating = false;
					return false;
				} else if (!$scope.accountForm.newEmail && $scope.accountForm.emailPassword) {
					$scope.account.errors.email = 'Please enter your current email address';
					$scope.account.updating = false;
					return false;
				} else if ($scope.accountForm.oldEmail && !$scope.accountForm.newEmail && $scope.accountForm.emailPassword) {
					$scope.account.errors.email = 'Please enter your new email address';
					$scope.account.updating = false;
					return false;
				} else if ($scope.accountForm.oldEmail && $scope.accountForm.newEmail && $scope.accountForm.emailPassword) {
					newData.oldEmail = $scope.accountForm.oldEmail;
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
							});
						} else {
							$scope.account.errors.name = error.message;
						}
					});
				}

				// update email
				if (newData.oldEmail && newData.newEmail && newData.emailPassword) {
					console.log('email change, old mail: '+$scope.authUser().data.password.email);
					console.log($scope.authUser().data.password.email);

					accountFactory.updateAccount(false).changeEmail({
						oldEmail: newData.oldEmail,
						newEmail: newData.newEmail,
						password: newData.emailPassword
					}, function(error) {
						$timeout(function() {
							$scope.account.updateCounter++;
							if (error) {
								console.log(error);
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
								console.log('email success');
								$scope.authUser().data.password.email = newData.email;
								$scope.account.updating = false;
								$scope.checkUpdateAccountFinished();
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
			console.log($scope.account.updateCounter, $scope.account.updates);
			if ($scope.account.updateCounter === $scope.account.updates) {
				$timeout(function() {
					viewFactory.setLoading('updateAccount', false);
					$scope.account.updating = false;
					$scope.account.updateSuccess = 'Your account data has been updated!';
					// reinit account data
					accountFactory.init();
				});
			}
		};
		
		$scope.updateAccountError = function() {
			$timeout(function() {
				viewFactory.setLoading('updateAccount', false);
				$scope.account.updating = false;
			});
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