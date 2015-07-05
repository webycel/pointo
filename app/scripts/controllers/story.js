'use strict';

/**
 * @ngdoc function
 * @name pointoApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the pointoApp
 */

/*
	$scope.view =
	view = 0 -> loading screen
	view = 1 -> session screen
	view = 2 -> enter name & passcode screen
 */
angular.module('pointoApp')
	.controller('StoryCtrl', function ($scope, $routeParams, $window, $timeout, storyFactory, accountFactory, viewFactory) {

		var sessionID = $routeParams.sessionID,
			session;

		if (sessionID < 100000 || sessionID > 999999) {
			$window.location.assign('#/');
		}

		$scope.sessionID = sessionID;
		$scope.view = 0;

		accountFactory.init();

		$scope.errors = viewFactory.getErrors;
		$scope.loading = viewFactory.getLoading;
		$scope.authUser = accountFactory.getUser;

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
		$scope.initSession = function () {
			$scope.view = 1;
			$scope.name = '';
			$scope.spectator = false;
			$scope.shareURL = $window.location.host + '/#/' + $scope.sessionID;
			$scope.isFlipped = false;

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
		};

		$scope.autoJoinSession = function () {

			if (!storyFactory.isLoggedIn()) {
				$timeout(function () {
					$scope.view = 2;
				});
			} else if (!storyFactory.user.redirect) {
				if ($scope.authUser().account) {
					accountFactory.getUserName().once('value', function (snap) {
						var user = snap.val();
						if (!user) {
							return;
						}
						storyFactory.joinSession(sessionID, user.name, false);
					});
				} else {
					storyFactory.joinSession(sessionID, storyFactory.user.name, storyFactory.user.spectator);
				}
				$scope.initSession();
			} else {
				//storyFactory.joinSession(sessionID, storyFactory.user.name, storyFactory.user.spectator);
				$scope.initSession();
			}

		};

		$scope.joinSession = function () {
			if ($scope.passcodeNeeded) {

				storyFactory.joinSessionWithPasscode(sessionID).once('value', function (snapshot) {
					var snap = snapshot.val();
					$timeout(function () {
						if (snap) {
							if (snap.passcode === parseInt($scope.passcode)) {
								if (!$scope.authUser().account) {
									storyFactory.joinSession(sessionID, $scope.name, $scope.spectator);
									$scope.initSession();
								} else {
									$scope.autoJoinSession();
								}
							} else {
								console.log('you shall NOT pass');
								viewFactory.setErrors('wrongPasscode', true);
							}
						} else {
							viewFactory.setErrors('noSessionJoin', true);
						}
					});
				});
			} else {
				storyFactory.joinSession(sessionID, $scope.name, $scope.spectator);
				$scope.initSession();
			}
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

		storyFactory.sessionExists(sessionID).once('value', function (snapshot) {
			if (snapshot.val()) {
				if (!snapshot.child(sessionID).exists()) {
					$window.location.assign('#/');
				} else {
					var sessionSnap = snapshot.child(sessionID).val();
					if (typeof sessionSnap.passcode !== 'undefined' && ($scope.authUser().data === null || sessionSnap.owner !== $scope.authUser().data.uid) && !storyFactory.user.redirect) {
						$timeout(function () {
							$scope.passcodeNeeded = true;
							$scope.view = 2;
						});
					} else {
						$scope.autoJoinSession();
					}
				}
			}
		});

		//overwrite chart colours
		Chart.defaults.global.colours[0] = '#16a085';
		Chart.defaults.global.colours[1] = '#1abc9c';

	});