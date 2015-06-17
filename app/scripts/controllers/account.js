'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:AccountCtrl
 * @description
 * # AccountCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('AccountCtrl', function ($scope, viewFactory, accountFactory) {

		accountFactory.init();

		$scope.authUser = accountFactory.getUser;
		$scope.accountView = false;

		$scope.toggleAccount = function (e) {
			e.preventDefault();
			$scope.accountView = !$scope.accountView;
		};

	});