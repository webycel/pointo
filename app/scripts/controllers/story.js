'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the pointoApp
 */
angular.module('pointoApp')
	.controller('StoryCtrl', function ($scope, $routeParams, $window, $timeout, storyFactory, accountFactory) {

		var sessionID = $routeParams.sessionID,
			session, exists;

		if (sessionID < 100000 || sessionID > 999999) {
			$window.location.assign('#/');
		}

		$scope.sessionID = sessionID;
		accountFactory.init();

		exists = storyFactory.sessionExists(sessionID).once('value', function (snapshot) {
			if (!snapshot.child(sessionID).exists()) {
				$window.location.assign('#/');
			} else {
				$scope.view = 1;
				$scope.name = '';
				$scope.spectator = false;
				$scope.shareURL = $window.location.host + '/#/' + $scope.sessionID;
				$scope.isFlipped = false;

				console.log(accountFactory.getUser());
				if (!storyFactory.isLoggedIn()) {
					$scope.view = 2;
				} else if (!storyFactory.user.redirect) {
					if (accountFactory.getUser().account) {
						storyFactory.joinSession(sessionID, accountFactory.getUser().data.uid, false);
					} else {
						storyFactory.joinSession(sessionID, storyFactory.user.name, storyFactory.user.spectator);
					}
				}

				session = storyFactory.getSession(sessionID);

				$scope.user = storyFactory.user;
				$scope.participants = session.participants;
				$scope.session = session.session;
				$scope.newName = storyFactory.user.name;

				$scope.statistics = storyFactory.getVoteStatistics;

				$scope.$watch('statistics()', function (data) {
					$scope.stats.data = data.data;
				});

				$scope.storypoints = storyFactory.getStoryPointSet();
			}

		});

		//overwrite chart colours
		Chart.defaults.global.colours[0] = '#16a085';
		Chart.defaults.global.colours[1] = '#1abc9c';

		$scope.stats = {
			options: {
				scaleShowVerticalLines: false,
				showTooltips: false,
				scaleFontSize: 14
			},
			labels: [0, '½', 1, 2, 3, 5, 8, 13, 20, 40, 100],
			data: [
				[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
			]
		};

		/* functions */
		$scope.joinSession = function () {
			storyFactory.joinSession(sessionID, $scope.name, $scope.spectator);
			$scope.view = 1;
		};

		$scope.vote = function (points) {
			if (!$scope.user.spectator) {
				storyFactory.setVote(points);
			}
		};

		$scope.revealVotes = function () {
			if ($scope.session.voteStatus === 0 && $scope.user.leader) {
				$scope.revealed = true;
				$scope.flip();
				storyFactory.revealVotes();
			}
		};

		$scope.clearVotes = function () {
			if ($scope.session.voteStatus === 1 && $scope.user.leader) {
				$scope.revealed = false;
				$scope.flip();
				storyFactory.clearVotes();
			}
		};

		$scope.changeName = function () {
			storyFactory.changeName($scope.newName);
		};

		$scope.leadSession = function () {
			storyFactory.leadSession();
		};

		$scope.participateStatus = function () {
			storyFactory.participateStatus();
		};

		$scope.flip = function () {
			$scope.isFlipped = !$scope.isFlipped;
		};

	});