'use strict';

angular.module('pointoApp')
	.factory('accountFactory', function ($firebaseObject, $rootScope, $timeout, FIREBASE_URL, viewFactory) {

		var accountFactory = {
				user: {
					data: null,
					name: '',
					logout: null,
					account: false,
					sessions: []
				},
				inited: false
			},
			ref = new Firebase(FIREBASE_URL),
			isNewUser = false,
			userRef, sessionRef;

		//public
		accountFactory.init = function () {
			ref.onAuth(accountFactory.authDataCallback);

			accountFactory.user.data = ref.getAuth();
			accountFactory.user.logout = accountFactory.logout;
			accountFactory.user.account = accountFactory.user.data !== null && accountFactory.user.data.auth.provider === 'password' ? true : false;
		};

		accountFactory.getUser = function () {
			return accountFactory.user;
		};

		accountFactory.register = function (email, pwd) {

			isNewUser = true;

			ref.createUser({
				email: email,
				password: pwd
			}, function (error, userData) {
				if (error) {
					console.log('Error creating user: ', error);
					viewFactory.setErrors('registerError', error.message);
				} else {
					ref.authWithPassword({
						email: email,
						password: pwd
					}, accountFactory.authHandler);

					console.log('Successfully created user with uid: ', userData.uid);
				}

				$rootScope.$apply(function () {
					viewFactory.setLoading('register', false);
				});
			});

		};

		accountFactory.login = function (email, pwd) {
			ref.authWithPassword({
				email: email,
				password: pwd
			}, accountFactory.authHandler);
		};

		accountFactory.logout = function () {
			ref.unauth();
			accountFactory.user.account = false;
		};

		//private
		accountFactory.setUser = function (data, user) {
			$timeout(function () {
				accountFactory.user.data = data;
				accountFactory.user.account = data ? true : false;
				accountFactory.user.name = user.name;
			});
		};
		accountFactory.authDataCallback = function (authData) {
			if (authData) {

				if (!accountFactory.inited) {

					userRef = ref.child('users').child(authData.uid);
					userRef.once('value', function (snap) {
						var user = snap.val();
						if (!user) {
							return;
						}

						console.log('User ' + authData.uid + ' is logged in with ' + authData.provider);
						accountFactory.setUser(authData, user);
					});

					sessionRef = ref.child('sessions');
					sessionRef.on('value', function (snap) {
						var sessions = snap.val();
						if (!sessions) {
							return;
						}

						accountFactory.user.sessions = []; //reset

						angular.forEach(sessions, function (val, key) {
							if (val.owner === authData.uid) {
								val.sessionId = key;
								accountFactory.user.sessions.push(val);
							}
						});
					});

					accountFactory.inited = true;
				}

			} else {
				console.log('User is logged out');
				accountFactory.setUser(null, '');
			}
		};

		accountFactory.authHandler = function (error, authData) {
			if (error) {
				console.log('Login Failed!', error);
				accountFactory.setUser(null, '');
			} else {
				console.log('Authenticated successfully with payload:', authData);

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

		accountFactory.getUserName = function () {
			return ref.child('users').child(accountFactory.user.data.uid);
		};

		accountFactory.updateAccount = function (data) {
			ref.child('users').child(accountFactory.user.data.uid).set({
				name: data.name
			});
			$timeout(function () {
				accountFactory.user.name = data.name;
				viewFactory.setLoading('updateAccount', false);
			}, 250);
		};

		//return
		return {
			init: accountFactory.init,
			getUser: accountFactory.getUser,
			getUserName: accountFactory.getUserName,
			login: accountFactory.login,
			register: accountFactory.register,
			updateAccount: accountFactory.updateAccount
		};

	});