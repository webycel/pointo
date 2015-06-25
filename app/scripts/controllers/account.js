'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:AccountCtrl
 * @description
 * # AccountCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('AccountCtrl', function ($scope, $document, viewFactory, accountFactory) {

		accountFactory.init();

		$scope.authUser = accountFactory.getUser;
		$scope.errors = viewFactory.getErrors;
		$scope.loading = viewFactory.getLoading;
		$scope.accountView = false;

		$scope.accountForm = {
			name: ''
		};

		$scope.toggleAccount = function (e) {
			e.preventDefault();
			$scope.accountView = !$scope.accountView;
		};

		$scope.updateAccount = function () {
			viewFactory.setLoading('updateAccount', true);
			accountFactory.updateAccount($scope.accountForm);
		};

		$scope.closeAccountPanel = function () {
			$scope.$apply(function () {
				$scope.accountView = false;
			});
		};

		$document.bind('keyup', function (e) {
			if (e.which === 27) {
				$scope.closeAccountPanel();
			}
		});

		$document.bind('click', function (e) {
			if (e.target.closest('.account .account-settings-panel') === null && e.target.closest('.account .fakelink') === null) {
				$scope.closeAccountPanel();
			}
		});

	});