'use strict';

angular.module('pointoApp')
	.factory('storyFactory', function($firebaseObject, $firebaseArray, $window, $timeout, FIREBASE_URL, utilsFactory, viewFactory, accountFactory) {

		var storyFactory = {},
			ref = new Firebase(FIREBASE_URL),
			chatbox = document.getElementById('chatlog'),
			lastChatMessageID;

		storyFactory.user = {
			key: null,
			name: null,
			points: {},
			voteHistory: [],
			'new': false,
			leader: false,
			spectator: false,
			redirect: false
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

		storyFactory.chatLog = [];
		storyFactory.chatEmoticons = {
			'\:\)': 	 	'happy',		'\:\-\)': 'happy',			'\(happy\)': 'happy',
			'\:\(':  		'unhappy', 		'\:\-\(': 'unhappy',		'\(sad\)': 'unhappy',
			'\;\)':  		'wink', 		'\;\-\)': 'wink',			'\(wink\)': 'wink',
			'\(\;': 		'wink2', 		'\(\-\;': 'wink2',
			'\|\-\)': 		'sleep',		'\(\-\|': 'sleep',			'\(sleepy\)': 'sleep',
			'\(y\)': 		'thumbsup',
			'\(devil\)':  	'devil',		'\(evil\)': 'devil',
			'\:p': 			'tongue',		'\:\-p': 'tongue', 			'\(tongue\)': 'tongue',
			'\(coffee\)':	'coffee', 		'\(tea\)': 'coffee',  		'\(mug\)': 'coffee',
			'8\)': 			'sunglasses', 	'8\-\)': 'sunglasses',  	'\(cool\)': 'sunglasses',
			'\:o': 			'surprised',	'\:\-o': 'surprised',
			'\:\/': 		'displeased',	'\:\-\/': 'displeased',
			'\(beer\)': 	'beer',
			'\:d': 			'grin',			'\:\-d': 'grin',
			'x\(': 			'angry',		'\>\(': 'angry',			'\(angry\)': 	'angry',
			'o\:\)': 		'saint',		'o\:\-\)': 'saint',			'\(angel\)':	'saint',
			'\:\'\(': 		'cry',			'\(cry\)': 'cry',
			'\(shoot\)': 	'shoot',		'\(gun\)': 'shoot',
			'\(firefox\)': 	'firefox',
			'\(chrome\)': 	'chrome',
			'\(ie\)': 		'ie',			'\(shit\)': 'ie',
			'\(opera\)': 	'opera',
			'xd': 'laugh'
		};

		storyFactory.session = {};
		storyFactory.participants = {};
		storyFactory.statistics = {};
		storyFactory.sessionID = null;

		/*
			SESSION
		*/

		storyFactory.createSession = function(options) {
			var id = utilsFactory.randomID(100000, 999999),
				sessionsRef = ref.child('sessions').child(id),
				sessionOptions;

			ref.child('sessions').once('value', function(snapshot) {
				if (snapshot.child(id).exists()) {
					storyFactory.createSession(options);
				} else {
					sessionOptions = {
						users: '',
						voteStatus: 0,
						score: 0,
						//owner: accountFactory.getUser().data.uid,
						owner: null,
						passcode: options.passcode,
						settings: {
							allLeader: true,
							autoReveal: false,
							disallowVotes: false
						}
					};

					if (accountFactory.getUser().data !== null && accountFactory.getUser().data.provider !== 'anonymous') {
						sessionOptions.owner = accountFactory.getUser().data.uid;
					}

					sessionsRef.set(sessionOptions, function(error) {
						if (!error) {
							storyFactory.joinSession(id, options.name, false, true);
						} else {
							console.log(error);
						}
					});
				}
			});

		};

		storyFactory.enterSession = function(id, name, spectator, redirect) {

			ref.child('sessions').once('value', function(snapshot) {
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

		storyFactory.joinSession = function(id, name, spectator, redirect) {
			var authData = ref.getAuth();

			if (!storyFactory.user.key || authData === null) {
				if (accountFactory.getUser().account) {
					storyFactory.addUser(id, accountFactory.getUser().name, spectator, accountFactory.getUser().data.uid, redirect);
				} else {
					//ref.unauth();
					ref.authAnonymously(function(error, authData) {
						if (error) {
							console.log('Login Failed!', error);
						} else {
							console.log('Logged in as Anonymous');
							storyFactory.addUser(id, name, spectator, authData.uid, redirect);
						}
					});
				}
			} else {
				storyFactory.addUser(id, name, spectator, authData.uid, redirect);
			}

			storyFactory.sessionID = id;
		};

		storyFactory.joinSessionWithPasscode = function(id) {
			viewFactory.setErrors('wrongPasscode', false);
			return ref.child('sessions').child(id);
		};

		storyFactory.addUser = function(id, name, spectator, uid, redirect) {
			var usersRef = new Firebase(FIREBASE_URL + 'sessions/' + id + '/users'),
				points = {
					text: -1,
					value: -1
				};

			name = name.toString();

			usersRef.child(uid).set({
				name: name,
				points: points,
				spectator: spectator
			}, function(error) {
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
					ref.child('sessions').child(id).child('users').once('value', function(snap) {
						if (snap.numChildren() <= 1) {
							ref.child('sessions').child(id).update({
								voteStatus: 0,
								score: 0
							}, storyFactory.errorCallback);
						}
					});

					// on vote status change
					ref.child('sessions').child(id).child('voteStatus').on('value', function(snap) {
						if (snap.val() === 0) {
							ref.child('sessions').child(id).child('users').child(storyFactory.user.key).update({
								points: {
									text: -1,
									value: -1
								},
								voteHistory: []
							}, storyFactory.errorCallback);
						}
					});

					// on session settings
					ref.child('sessions').child(id).child('settings').on('value', function(snap) {
						var sessionSettings = snap.val();
						if (!sessionSettings.allLeader && storyFactory.session.owner !== accountFactory.getUser().data.uid) {
							ref.child('sessions').child(id).child('users').child(storyFactory.user.key).update({
								leader: false
							});
						}
					});

					// on chat changed
					ref.child('sessions').child(id).child('chat').on('child_added', storyFactory.chatChanged);

					// on session change
					$timeout(function() {
						ref.child('sessions').child(id).once('value', storyFactory.onSessionChange);
					}, 300);
					ref.child('sessions').child(id).on('value', storyFactory.onSessionChange);

					ref.child('sessions').child(id).child('users').child(storyFactory.user.key).on('value', storyFactory.onParticipantChange);

					$window.location.assign('#/' + id);
				} else {
					console.log(error);
				}
			});
		};

		storyFactory.onSessionChange = function(snap) {
			var users = snap.val().users,
				s, points, i,
				stats = {
					data: [
						[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
					],
					participants: 0,
					score: 0
				},
				data, x = 0, votes = 0, average, averageFirstDigit, isStoryPoint = false,
				total = 0, firstVoteIndex = null, lastVoteIndex;

			// get statistics
			storyFactory.statistics = {};

			for (s in users) {
				points = users[s].points;

				for (i = 0; i < storyFactory.storyPointSet.length - 1; i++) {
					if(i === storyFactory.storyPointSet.length -2 && storyFactory.storyPointSet[i].value === points.value) {
						votes++;
						break;
					}
					if (storyFactory.storyPointSet[i].value === points.value) {
						stats.data[0][i] += 1;
					}
				}
				stats.participants += 1;
			}

			// get the total amount and number of votes
			data = stats.data[0];
			for (i = 0; i < data.length; i++) {
				if (data[i] > 0) {
					total += storyFactory.storyPointSet[i].value * data[i];
					votes += data[i];
					x += data[i];

					if(firstVoteIndex === null) {
						firstVoteIndex = i;
					}
					lastVoteIndex = i;
				}
			}

			if (lastVoteIndex - firstVoteIndex >= 3) {
				// difference in votes is too big, team is not sure about story
				stats.score = -666;
			} else {
				// calculate average
				average = total / x;
				averageFirstDigit = Math.floor(average);

				// check if the average first digit is a storypoint
				for (i = 0; i < storyFactory.storyPointValues.length; i++) {
					if (storyFactory.storyPointValues[i] === averageFirstDigit) {
						isStoryPoint = true;
						break;
					}
				}

				if (isStoryPoint) {
					// score is the first digit
					stats.score = averageFirstDigit;
				} else {
					// score is the closest number to the average
					stats.score = x > 0 ? utilsFactory.getClosestNumber(storyFactory.storyPointValues, average) : -1;
				}
			}

			// when everybody has voted
			if(votes === stats.participants) {
				if(storyFactory.session.voteStatus === 0 && storyFactory.session.settings.autoReveal && (storyFactory.session.owner === accountFactory.getUser().data.uid || storyFactory.user.leader)) {
					// auto reveal votes
					storyFactory.revealVotes();
				}
			}

			storyFactory.statistics = stats;

			if (storyFactory.session.owner === accountFactory.getUser().data.uid || storyFactory.user.leader) {
				// save score to database
				ref.child('sessions').child(storyFactory.sessionID).update({ score: stats.score });
				if (storyFactory.session.stories[storyFactory.session.activeStory].points === -999) {
					ref.child('sessions').child(storyFactory.sessionID).child('stories').child(storyFactory.session.activeStory).update({ points: stats.score });
				}
			}
		};

		storyFactory.sessionExists = function() {
			var text = ref.child('sessions');
			return text;
		};

		storyFactory.isLoggedIn = function() {
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

		storyFactory.anonymousLogin = function() {
			ref.authAnonymously(function(error) {
				if (error) {
					console.log('Login Failed!', error);
				} else {
					// console.log('Logged in as Anonymous');
				}
			});
		};

		storyFactory.getSession = function(id) {
			storyFactory.session = $firebaseObject(ref.child('sessions').child(id));
			storyFactory.participants = $firebaseArray(ref.child('sessions').child(id).child('users'));

			return {
				session: storyFactory.session,
				participants: storyFactory.participants
			};
		};

		storyFactory.participateStatus = function() {
			var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key);
			storyFactory.user.spectator = !storyFactory.user.spectator;
			user.update({
				spectator: storyFactory.user.spectator,
				points: {
					text: -1,
					value: -1
				}
			}, storyFactory.errorCallback);
		};

		storyFactory.onParticipantChange = function(snap) {
			var participant = snap.val();
			if (!participant) {
				return false;
			}

			if (participant.resetSession) {
				$window.location.reload();
			}
		};

		storyFactory.getSessionRef = function(id) {
			if (id) {
				return ref.child('sessions').child(id);
			} else {
				return ref;
			}
		};



		/*
			VOTING
		*/
		storyFactory.setVote = function(points) {
			var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key);

			if (storyFactory.user.points.value !== -1 && storyFactory.session.voteStatus === 1) {
				if (storyFactory.user.voteHistory.length === 3) {
					storyFactory.user.voteHistory.shift();
				}
				storyFactory.user.voteHistory.push(storyFactory.user.points);
			}

			storyFactory.user.points = points;

			user.update({
				points: {
					text: points.text.toString(),
					value: parseFloat(points.value)
				},
				voteHistory: angular.copy(storyFactory.user.voteHistory)
			}, storyFactory.errorCallback);
		};

		storyFactory.revealVotes = function() {
			var session = ref.child('sessions').child(storyFactory.sessionID);

			session.update({
				voteStatus: 1
			}, storyFactory.errorCallback);
		};

		storyFactory.clearVotes = function() {
			var session = ref.child('sessions').child(storyFactory.sessionID),
				points = {
					text: -1,
					value: -1
				};

			session.update({
				voteStatus: 0
			}, storyFactory.errorCallback);

			session.child('users').child(storyFactory.user.key).update({
				points: points, voteHistory: []
			}, storyFactory.errorCallback);

			storyFactory.user.points = points;
			storyFactory.user.voteHistory = [];
		};

		storyFactory.getVoteStatistics = function() {
			return storyFactory.statistics;
		};

		storyFactory.getStoryPointSet = function() {
			return storyFactory.storyPointSet;
		};



		/*
			SETTINGS
		*/
		storyFactory.changeName = function(name) {
			var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key);
			name = name.toString();
			user.update({
				name: name
			}, storyFactory.errorCallback);
			storyFactory.user.name = name;
			if (utilsFactory.hasStorage()) {
				localStorage[storyFactory.user.key] = name;
			}
		};

		storyFactory.changePasscode = function(passcode) {
			var session = ref.child('sessions').child(storyFactory.sessionID);
			session.update({
				passcode: passcode
			}, function(error) {
				$timeout(function() {
					viewFactory.setErrors('changePasscode', true);
					viewFactory.setLoading('changePasscode', false);
				});
				storyFactory.errorCallback(error);
			});
		};

		storyFactory.removePasscode = function() {
			ref.child('sessions').child(storyFactory.sessionID).child('passcode').remove();
			viewFactory.setErrors('removePasscode', true);
			viewFactory.setLoading('removePasscode', false);
		};

		storyFactory.leadSession = function() {
			var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key);
			storyFactory.user.leader = !storyFactory.user.leader;
			user.update({
				leader: storyFactory.user.leader
			}, storyFactory.errorCallback);
		};

		storyFactory.resetSession = function() {
			var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key),
				session = ref.child('sessions').child(storyFactory.sessionID);

			user.update({
				resetSession: true
			}, storyFactory.errorCallback);

			session.update({
				activeStory: null,
				score: 0,
				stories: null,
				timer: null,
				voteStatus: 0
			}, storyFactory.errorCallback);
		};



		/*
			TIMER
		*/
		storyFactory.setTimer = function(timer) {
			return ref.child('sessions').child(storyFactory.sessionID).update({
				timer: timer
			}, storyFactory.errorCallback);
		};

		storyFactory.getTimer = function(id) {
			return ref.child('sessions').child(id).child('timer');
		};



		/*
			STORIES
		*/
		storyFactory.addStory = function(story) {
			var newStory = {
				name: story,
				points: -999
			};

			ref.child('sessions').child(storyFactory.sessionID).child('stories').push(newStory);
		};

		storyFactory.getStories = function(id) {
			return ref.child('sessions').child(id).child('stories');
		};

		storyFactory.setActiveStory = function(story) {
			ref.child('sessions').child(storyFactory.sessionID).update({
				activeStory: story
			}, storyFactory.errorCallback);
		};

		storyFactory.saveStory = function(id, story) {
			story.points = parseFloat(story.points, 10); // convert points to Integer
			ref.child('sessions').child(storyFactory.sessionID).child('stories').child(id).set(story);
		};

		storyFactory.deleteStory = function(id) {
			ref.child('sessions').child(storyFactory.sessionID).child('stories').child(id).remove();
		};



		/* CHAT */
		storyFactory.chatChanged = function(childSnap, prevChildKey) {
			var chat = childSnap.val(),
				result, regex, emo;

			// child_added event is fired twice, so don't show the last message again
			if (prevChildKey !== lastChatMessageID) {
				//console.log(chat.message);
				lastChatMessageID = prevChildKey;

				for(emo in storyFactory.chatEmoticons) {
					regex = new RegExp(emo.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi');
					result = chat.message.replace(regex, function (match) {
						var smiley = storyFactory.chatEmoticons[match.toLowerCase()],
							smileyElem;

						if(typeof(smiley) !== 'undefined') {
							smileyElem = '<span class="fontelico-emo-' + smiley + '"></span>';
							chat.message = chat.message.replace(match, smileyElem);
						}

					});
				}

				//console.log(chat.message);

				storyFactory.chatLog.push(chat);

				// scroll chatbox
				$timeout(function() {
					if(chatbox) {
						chatbox.scrollTop = chatbox.scrollHeight;
					}
				}, 500);
			}
		};

		storyFactory.getChatLog = function () {
			return storyFactory.chatLog;
		};



		/* OTHER */
		storyFactory.errorCallback = function(error) {
			if (error !== null && error.code === 'PERMISSION_DENIED') {
				viewFactory.setErrors('permission', true);
			}
		};



		return {
			createSession: storyFactory.createSession,
			joinSession: storyFactory.enterSession,
			joinSessionWithPasscode: storyFactory.joinSessionWithPasscode,
			sessionExists: storyFactory.sessionExists,
			getSession: storyFactory.getSession,
			isLoggedIn: storyFactory.isLoggedIn,
			anonymousLogin: storyFactory.anonymousLogin,
			user: storyFactory.user,

			getSessionRef: storyFactory.getSessionRef,

			setVote: storyFactory.setVote,
			revealVotes: storyFactory.revealVotes,
			clearVotes: storyFactory.clearVotes,
			getVoteStatistics: storyFactory.getVoteStatistics,
			getStoryPointSet: storyFactory.getStoryPointSet,

			setTimer: storyFactory.setTimer,
			getTimer: storyFactory.getTimer,

			addStory: storyFactory.addStory,
			getStories: storyFactory.getStories,
			setActiveStory: storyFactory.setActiveStory,
			saveStory: storyFactory.saveStory,
			deleteStory: storyFactory.deleteStory,

			getChatLog: storyFactory.getChatLog,

			changeName: storyFactory.changeName,
			changePasscode: storyFactory.changePasscode,
			removePasscode: storyFactory.removePasscode,
			leadSession: storyFactory.leadSession,
			resetSession: storyFactory.resetSession,

			participateStatus: storyFactory.participateStatus
		};

	});
