'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:HeaderCtrl
 * @description
 * # HeaderCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('HeaderCtrl', function($scope, viewFactory, accountFactory) {

		accountFactory.init();

		$scope.authUser = accountFactory.getUser;
		$scope.errors = viewFactory.getErrors;
		$scope.loading = viewFactory.getLoading;

	});