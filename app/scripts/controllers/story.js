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
			session, timerInterval;

		// go back to main screen if session ID is invalid
		if (sessionID < 100000 || sessionID > 999999) {
			$window.location.assign('#/');
		}

		$scope.sessionID = sessionID;
		$scope.view = 0;

		// init account data
		accountFactory.init();

		// init errors & loading view
		$scope.errors = viewFactory.getErrors;
		$scope.loading = viewFactory.getLoading;

		// get user data
		$scope.authUser = accountFactory.getUser;

		// init statistics
		$scope.stats = {
			options: {
				scaleShowVerticalLines: false,
				showTooltips: false,
				scaleFontSize: 14
			},
			labels: [0, '½', 1, 2, 3, 5, 8, 13, 20, 40, 100],
			data: [
				[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
			],
			colours: ['#16a085', '#1abc9c']
		};

		$scope.countdown = {
			labels: ['', ''],
			data: [0, 100],
			options: {
				animationEasing: 'linear',
				percentageInnerCutout: 85
			},
			colours: ['#16a085', '#e5e5e5']
		};

		/* functions */
		$scope.initSession = function () {
			// init vars
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
			$scope.newPasscode = '';

			// init timer
			$scope.timer = {
				value: 15,
				counter: 15,
				unit: 's',
				running: false
			};
			$scope.timerStarted = false;

			// listen to timer changes
			storyFactory.getTimer($scope.sessionID).on('value', function (snap) {
				$scope.timer = snap.val();

				if (!$scope.timerStarted && $scope.timer.running && $scope.timer.counter > 0) {

					// start timer
					timerInterval = setInterval(function () {
						$scope.timer.counter--; // count down

						$scope.countdown.data[1] = (100 / ($scope.timer.value - 2)) * ($scope.timer.counter - 2);

						if ($scope.countdown.data[1] > 0) {
							$scope.countdown.data[0] = 100 - $scope.countdown.data[1];
						} else {
							$scope.countdown.data[0] = 100;
							$scope.countdown.data[1] = 0;
						}

						if ($scope.timer.counter <= 0) {
							$scope.stopTimer(true);
						}

						$scope.timerStarted = true;
						$scope.$apply();
					}, 1000);

				} else {
					//$scope.stopTimer(false);
				}
			});

			// get the vote statistics
			$scope.statistics = storyFactory.getVoteStatistics;

			$scope.$watch('statistics()', function (data) {
				$scope.stats.data = data.data;
			});

			// get all voted storypoints
			$scope.storypoints = storyFactory.getStoryPointSet();
		};

		$scope.autoJoinSession = function () {

			if (!storyFactory.isLoggedIn()) {
				// if not logged in (account or anonymous), show join session screen
				$timeout(function () {
					$scope.view = 2;
				});
			} else if (!storyFactory.user.redirect) { // if not coming from main screen
				if ($scope.authUser().account) {
					// if is logged in with account, get account data and join session
					accountFactory.getUserName().once('value', function (snap) {
						var user = snap.val();
						if (!user) {
							return;
						}
						storyFactory.joinSession(sessionID, user.name, false);
					});
				} else {
					// if not logged in with account, join session (anonymous session will be created)
					storyFactory.joinSession(sessionID, storyFactory.user.name, storyFactory.user.spectator);
				}
				$scope.initSession();
			} else {
				// if coming from mains screen, init session - already joined
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
							if (parseInt(snap.passcode) === parseInt($scope.passcode)) {
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

		$scope.stopTimer = function (ended) {
			$timeout(function () {
				clearInterval(timerInterval);
				$scope.timerStarted = false;
				$scope.countdown.data = [0, 100];

				if (ended) { // when timer reached 0

					// reveal votes automatically
					if ($scope.session.voteStatus === 0) {
						$scope.revealed = true;
						$scope.flip();
						storyFactory.revealVotes();
					}

					$scope.timer.running = false;
					storyFactory.setTimer($scope.timer);
				}
			});
		};

		$scope.toggleTimer = function () {
			$scope.timer.running = !$scope.timer.running;
			if ($scope.timer.running) {
				$scope.timer.counter = $scope.timer.value;
			} else {
				$scope.stopTimer();
			}
			storyFactory.setTimer($scope.timer);
		};

		$scope.changeName = function () {
			storyFactory.changeName($scope.newName);
		};

		$scope.changePasscode = function () {
			viewFactory.setErrors('changePasscode', false);
			viewFactory.setLoading('changePasscode', true);
			storyFactory.changePasscode($scope.newPasscode);
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

	});