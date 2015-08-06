'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:PasswordResetCtrl
 * @description
 * # PasswordResetCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('PasswordResetCtrl', function($scope, $timeout, viewFactory, accountFactory) {

		accountFactory.init();

		$scope.authUser = accountFactory.getUser;
		$scope.errors = viewFactory.getErrors;
		$scope.loading = viewFactory.getLoading;

		$scope.pwdReset = {};

		$scope.resetting = false;

		$scope.resetPassword = function() {

			if (!$scope.resetting) {
				$scope.resetting = true;
				$scope.pwdReset.success = false;
				viewFactory.setLoading('updateAccount', true);

				accountFactory.updateAccount(false).resetPassword({
					email: $scope.pwdReset.email
				}, function(error) {
					$timeout(function() {
						viewFactory.setLoading('updateAccount', false);
						$scope.resetting = false;

						if (error) {
							switch (error.code) {
								case 'INVALID_USER':
									$scope.pwdReset.message = 'The specified user account does not exist.';
									break;
								default:
									$scope.pwdReset.message = 'Error resetting password: ' + error;
							}
						} else {
							$scope.pwdReset.success = true;
							$scope.pwdReset.message = 'Password reset email sent successfully!';
						}
					});
				});
			}

		};

	});