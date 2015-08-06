'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('FeedbackCtrl', function($scope, $timeout, $document, viewFactory, accountFactory, utilsFactory) {

		accountFactory.init();

		$scope.authUser = accountFactory.getUser;
		$scope.errors = viewFactory.getErrors;
		$scope.loading = viewFactory.getLoading;

		$scope.open = false;
		$scope.selectImageMode = false;
		$scope.view = 1;
		$scope.feedback = {
			message: null,
			image: null
		};

		$scope.selectImage = function(e) {
			e.preventDefault();

			$scope.selectImageMode = !$scope.selectImageMode;
		};

		$scope.getFile = function(file) {

			$timeout(function() {
				if (file.size < 5000000) { // 5mb
					viewFactory.setLoading('feedback', true);

					utilsFactory.fileReader.readAsDataURL(file, $scope)
						.then(function(result) {
							$scope.feedback.image = result;
							viewFactory.setLoading('feedback', false);
						});
				} else {
					viewFactory.setErrors('feedbackImage', true);
				}
			});
		};


		$scope.$on('fileProgress', function(e, progress) {
			$scope.progress = progress.loaded / progress.total;
		});

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

		$scope.closePopup = function() {
			$timeout(function() {
				$scope.open = false;
			});
		};

		$document.bind('keyup', function(e) {
			if (e.which === 27) {
				$scope.closePopup();
			}
		});

		$document.bind('click', function(e) {
			if (e.target.closest('.feedback .popup') === null && e.target.closest('.feedback a') === null) {
				$scope.closePopup();
			}
		});

	});