'use strict';

angular.module('pointoApp')
	.factory('storyFactory', function ($firebaseObject, $firebaseArray, $window, $timeout, FIREBASE_URL, utilsFactory, viewFactory, accountFactory) {

		var storyFactory = {},
			ref = new Firebase(FIREBASE_URL);

		storyFactory.user = {
			key: null,
			name: null,
			points: {},
			'new': false,
			leader: false,
			spectator: false
		};

		storyFactory.storyPointSet = [{
			text: 0,
			value: 0
		}, {
			text: '½',
			value: 0.5
		}, {
			text: 1,
			value: 1
		}, {
			text: 2,
			value: 2
		}, {
			text: 3,
			value: 3
		}, {
			text: 5,
			value: 5
		}, {
			text: 8,
			value: 8
		}, {
			text: 13,
			value: 13
		}, {
			text: 20,
			value: 20
		}, {
			text: 40,
			value: 40
		}, {
			text: 100,
			value: 100
		}, {
			text: '?',
			value: -2
		}, {
			text: 'X',
			value: -1
		}];

		storyFactory.storyPointValues = [0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100];

		storyFactory.session = {};
		storyFactory.participants = {};
		storyFactory.statistics = {};
		storyFactory.sessionID = null;

		storyFactory.createSession = function (options) {
			var id = utilsFactory.randomID(100000, 999999);
			var sessionsRef = ref.child('sessions').child(id);

			ref.child('sessions').once('value', function (snapshot) {
				if (snapshot.child(id).exists()) {
					storyFactory.createSession(options);
				} else {
					sessionsRef.set({
						users: '',
						voteStatus: 0,
						score: 0,
						owner: accountFactory.getUser().data.uid,
						passcode: options.passcode
					}, function (error) {
						if (!error) {
							storyFactory.joinSession(id, options.name, false, true);
						} else {
							console.log(error);
						}
					});
				}
			});

		};

		storyFactory.enterSession = function (id, name, spectator, redirect) {

			ref.child('sessions').once('value', function (snapshot) {
				if (!snapshot.child(id).exists()) {
					viewFactory.setErrors('noSession', true);
					viewFactory.setLoading('join', false);
					viewFactory.setLoading('joinSpectator', false);
				} else {
					viewFactory.setErrors('noSession', false);
					storyFactory.joinSession(id, name, spectator, redirect);
				}
			});

		};

		storyFactory.joinSession = function (id, name, spectator, redirect) {
			if (!storyFactory.user.key) {
				if (accountFactory.getUser().account) {
					storyFactory.addUser(id, accountFactory.getUser().name, spectator, accountFactory.getUser().data.uid, redirect);
				} else {
					ref.unauth();
					ref.authAnonymously(function (error, authData) {
						if (error) {
							console.log('Login Failed!', error);
						} else {
							console.log('Logged in as Anonymous');
							storyFactory.addUser(id, name, spectator, authData.uid, redirect);
						}
					});
				}
			} else {
				var authData = ref.getAuth();
				storyFactory.addUser(id, name, spectator, authData.uid, redirect);
			}

			storyFactory.sessionID = id;
		};

		storyFactory.joinSessionWithPasscode = function (id) {
			viewFactory.setErrors('wrongPasscode', false);
			return ref.child('sessions').child(id);
		};

		storyFactory.addUser = function (id, name, spectator, uid, redirect) {
			var usersRef = new Firebase(FIREBASE_URL + 'sessions/' + id + '/users'),
				points = {
					text: -1,
					value: -1
				};

			usersRef.child(uid).set({
				name: name,
				points: points,
				spectator: spectator
			}, function (error) {
				if (!error) {
					storyFactory.user.key = uid;
					storyFactory.user.name = name;
					storyFactory.user.redirect = redirect;
					storyFactory.user.points = points;
					storyFactory.user.spectator = spectator;

					if (utilsFactory.hasStorage()) {
						localStorage[uid] = name;
					}

					usersRef.child(uid).onDisconnect().remove();

					//reset vote status if first user to join
					ref.child('sessions').child(id).child('users').once('value', function (snap) {
						if (snap.numChildren() <= 1) {
							ref.child('sessions').child(id).update({
								voteStatus: 0,
								score: 0
							});
						}
					});

					//on vote status change
					ref.child('sessions').child(id).child('voteStatus').on('value', function (snap) {
						if (snap.val() === 0) {
							ref.child('sessions').child(id).child('users').child(storyFactory.user.key).update({
								points: {
									text: -1,
									value: -1
								}
							});
						}
					});

					$timeout(function () {
						ref.child('sessions').child(id).once('value', storyFactory.onSessionChange);
					}, 300);
					ref.child('sessions').child(id).on('value', storyFactory.onSessionChange);

					$window.location.assign('#/' + id);
				} else {
					console.log(error);
				}
			});
		};

		storyFactory.onSessionChange = function (snap) {
			var users = snap.val().users,
				s, points, i,
				stats = {
					data: [
						[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
					],
					participants: 0,
					score: 0
				},
				data, x = 0,
				total = 0;

			//get statistics
			storyFactory.statistics = {};

			for (s in users) {
				points = users[s].points;

				for (i = 0; i < storyFactory.storyPointSet.length - 2; i++) {
					if (storyFactory.storyPointSet[i].value === points.value) {
						stats.data[0][i] += 1;
					}
				}
				stats.participants += 1;
			}

			//calculate average score
			data = stats.data[0];

			for (i = 0; i < data.length; i++) {
				if (data[i] > 0) {
					total += storyFactory.storyPointSet[i].value;
					x++;
				}
			}

			stats.score = x > 0 ? utilsFactory.getClosestNumber(storyFactory.storyPointValues, total / x) : -1;

			storyFactory.statistics = stats;
		};

		storyFactory.sessionExists = function () {
			var text = ref.child('sessions');
			return text;
		};

		storyFactory.isLoggedIn = function () {
			var authData = ref.getAuth();
			if (authData && utilsFactory.hasStorage()) {
				storyFactory.user.key = authData.uid;
				storyFactory.user.name = localStorage[authData.uid] || 'Anonymous';
				storyFactory.user.spectator = false;
				return true;
			} else {
				return false;
			}
		};

		storyFactory.anonymousLogin = function () {
			ref.authAnonymously(function (error) {
				if (error) {
					console.log('Login Failed!', error);
				} else {
					console.log('Logged in as Anonymous');
				}
			});
		};

		storyFactory.getSession = function (id) {
			storyFactory.session = $firebaseObject(ref.child('sessions').child(id));
			storyFactory.participants = $firebaseArray(ref.child('sessions').child(id).child('users'));

			return {
				session: storyFactory.session,
				participants: storyFactory.participants
			};
		};

		storyFactory.setVote = function (points) {
			var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key);
			user.update({
				points: {
					text: points.text,
					value: points.value
				}
			});
			storyFactory.user.points = points;
		};

		storyFactory.revealVotes = function () {
			var session = ref.child('sessions').child(storyFactory.sessionID);

			session.update({
				voteStatus: 1
			});
		};

		storyFactory.clearVotes = function () {
			var session = ref.child('sessions').child(storyFactory.sessionID),
				points = {
					text: -1,
					value: -1
				};
			session.update({
				voteStatus: 0
			});
			session.child('users').child(storyFactory.user.key).update({
				points: points
			});
			storyFactory.user.points = points;
		};

		storyFactory.changeName = function (name) {
			var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key);
			user.update({
				name: name
			});
			storyFactory.user.name = name;
			if (utilsFactory.hasStorage()) {
				localStorage[storyFactory.user.key] = name;
			}
		};

		storyFactory.leadSession = function () {
			var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key);
			storyFactory.user.leader = !storyFactory.user.leader;
			user.update({
				leader: storyFactory.user.leader
			});
		};

		storyFactory.participateStatus = function () {
			var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key);
			storyFactory.user.spectator = !storyFactory.user.spectator;
			user.update({
				spectator: storyFactory.user.spectator,
				points: {
					text: -1,
					value: -1
				}
			});
		};

		storyFactory.getVoteStatistics = function () {
			return storyFactory.statistics;
		};

		storyFactory.getStoryPointSet = function () {
			return storyFactory.storyPointSet;
		};

		return {
			createSession: storyFactory.createSession,
			joinSession: storyFactory.enterSession,
			joinSessionWithPasscode: storyFactory.joinSessionWithPasscode,
			sessionExists: storyFactory.sessionExists,
			getSession: storyFactory.getSession,
			isLoggedIn: storyFactory.isLoggedIn,
			anonymousLogin: storyFactory.anonymousLogin,
			setVote: storyFactory.setVote,
			revealVotes: storyFactory.revealVotes,
			clearVotes: storyFactory.clearVotes,
			changeName: storyFactory.changeName,
			leadSession: storyFactory.leadSession,
			participateStatus: storyFactory.participateStatus,
			getVoteStatistics: storyFactory.getVoteStatistics,
			getStoryPointSet: storyFactory.getStoryPointSet,
			user: storyFactory.user
		};

	});