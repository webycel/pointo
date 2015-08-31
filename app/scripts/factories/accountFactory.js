'use strict';

angular.module('pointoApp')
	.factory('accountFactory', function($firebaseObject, $rootScope, $window, $timeout, FIREBASE_URL, viewFactory) {

		var accountFactory = {
				user: {
					data: null,
					name: '',
					logout: null,
					account: false,
					resetSession: false,
					sessions: []
				},
				inited: false
			},
			ref = new Firebase(FIREBASE_URL),
			isNewUser = false,
			userRef, sessionRef;

		//public
		accountFactory.init = function(force) {
			if (force || !accountFactory.inited) {
				ref.onAuth(accountFactory.authDataCallback);

				accountFactory.user.data = ref.getAuth();
				accountFactory.user.logout = accountFactory.logout;
				accountFactory.user.account = accountFactory.user.data !== null && accountFactory.user.data.auth.provider === 'password' ? true : false;

				accountFactory.inited = true;
			}
		};

		accountFactory.getUser = function() {
			return accountFactory.user;
		};

		accountFactory.register = function(email, pwd) {

			isNewUser = true;

			ref.createUser({
				email: email,
				password: pwd
			}, function(error) {
				if (error) {
					viewFactory.setErrors('registerError', error.message);
				} else {
					ref.authWithPassword({
						email: email,
						password: pwd
					}, accountFactory.authHandler);
				}

				$rootScope.$apply(function() {
					viewFactory.setLoading('register', false);
				});
			});

		};

		accountFactory.login = function(email, pwd) {
			ref.authWithPassword({
				email: email,
				password: pwd
			}, accountFactory.authHandler);
		};

		accountFactory.logout = function(noRedirect) {
			ref.unauth();
			accountFactory.user.account = false;
			if (!noRedirect) {
				$window.location.assign('#/');
			}
		};

		//private
		accountFactory.setUser = function(data, user) {
			$timeout(function() {
				accountFactory.user.data = data;
				accountFactory.user.account = data ? true : false;
				accountFactory.user.name = user.name;
			});
		};
		accountFactory.authDataCallback = function(authData) {
			if (authData) {

				userRef = ref.child('users').child(authData.uid);
				userRef.once('value', function(snap) {
					var user = snap.val();
					if (!user) {
						return;
					}

					$timeout(function() {
						accountFactory.setUser(authData, user);
					});
				});

				sessionRef = ref.child('sessions');
				sessionRef.on('value', function(snap) {
					var sessions = snap.val();
					if (!sessions) {
						return;
					}

					$timeout(function() {
						accountFactory.user.sessions = []; //reset
						angular.forEach(sessions, function(val, key) {
							if (val.owner === authData.uid) {
								val.sessionId = key;
								accountFactory.user.sessions.push(val);
							}
						});
					});
				});

			} else {
				//accountFactory.anonymousLogin();
				accountFactory.setUser(null, '');

				if (accountFactory.inited) {
					accountFactory.inited = false;
					$window.location.assign('#/');
				}
			}
		};

		accountFactory.authHandler = function(error, authData) {
			if (error) {
				viewFactory.setErrors('loginError', error.message);
				accountFactory.setUser(null, '');
			} else {
				if (isNewUser) {
					ref.child('users').child(authData.uid).set({
						name: authData.password.email.replace(/@.*/, '')
					});
				}

				accountFactory.authDataCallback(authData);
				accountFactory.setUser(authData, '');
			}
			viewFactory.setLoading('login', false);
		};

		accountFactory.anonymousLogin = function() {
			ref.authAnonymously(function(error) {
				if (error) {
					// console.log('Login Failed!', error);
				} else {
					// console.log('Logged in as Anonymous');
				}
			});
		};

		accountFactory.getUserName = function() {
			return ref.child('users').child(accountFactory.user.data.uid);
		};

		accountFactory.setLocalUserName = function(name) {
			accountFactory.user.name = name;
		};

		accountFactory.updateAccount = function(userName) {
			if (userName) {
				return ref.child('users').child(accountFactory.user.data.uid);
			} else {
				return ref;
			}
		};

		accountFactory.sendFeedback = function() {
			return ref.child('feedback');
		};

		//return
		return {
			init: accountFactory.init,
			getUser: accountFactory.getUser,
			getUserName: accountFactory.getUserName,
			setUserName: accountFactory.setLocalUserName,
			login: accountFactory.login,
			logout: accountFactory.logout,
			register: accountFactory.register,
			updateAccount: accountFactory.updateAccount,
			sendFeedback: accountFactory.sendFeedback
		};

	});
