'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('FeedbackCtrl', function($scope, $timeout, viewFactory, accountFactory) {

		accountFactory.init();

		$scope.authUser = accountFactory.getUser;
		$scope.errors = viewFactory.getErrors;
		$scope.loading = viewFactory.getLoading;

		$scope.open = false;
		$scope.view = 1;
		$scope.feedback = {
			message: null
		};

		$scope.sendFeedback = function() {
			if ($scope.authUser().data) {
				$scope.feedback.uid = $scope.authUser().data.uid;
			}
			if ($scope.authUser().name) {
				$scope.feedback.name = $scope.authUser().name;
			}

			viewFactory.setLoading('feedback', true);

			accountFactory.sendFeedback().push($scope.feedback, function(error) {
				if (!error) {
					$timeout(function() {
						$scope.view = 2;
						viewFactory.setLoading('feedback', false);
					});
				}
			});
		};

	});