'use strict';

angular.module('pointoApp')
    .factory('accountFactory', function($firebaseObject, $rootScope, $timeout, FIREBASE_URL, viewFactory) {
    
    	var accountFactory = { user: { data: null, logout: null, account: false } },
            ref = new Firebase(FIREBASE_URL);

        //public
        accountFactory.init = function() {
            ref.onAuth(accountFactory.authDataCallback);

            accountFactory.user.data = ref.getAuth();
            accountFactory.user.logout = accountFactory.logout;
            accountFactory.user.account = accountFactory.user.data !== null && accountFactory.user.data.auth.provider === 'password' ? true : false;
        };

        accountFactory.getUser = function() {
            return accountFactory.user;
        };

    	accountFactory.register = function(email, pwd) {

            ref.createUser({
                email: email, password: pwd
            }, function(error, userData) {
                if(error) {
                    console.log('Error creating user: ', error);
                    viewFactory.setErrors('registerError', error.message);
                } else {
                    ref.authWithPassword({
                        email    : email,
                        password : pwd
                    }, accountFactory.authHandler);

                    console.log('Successfully created user with uid: ', userData.uid);
                }

                $rootScope.$apply(function(){
                    viewFactory.setLoading('register', false);
                });
            });

        };

        accountFactory.login = function(email, pwd) {
            ref.authWithPassword({
                email    : email,
                password : pwd
            }, accountFactory.authHandler);
        };

        accountFactory.logout = function() {
            console.log('bye');
            ref.unauth();
            accountFactory.user.account = false;
        };

        //private
        accountFactory.setUser = function(data) {
            $timeout(function(){
                accountFactory.user.data = data;
                accountFactory.user.account = data ? true : false;
            });
        };
        accountFactory.authDataCallback = function(authData) {
            if (authData) {
                console.log('User ' + authData.uid + ' is logged in with ' + authData.provider);
                accountFactory.setUser(authData);
            } else {
                console.log('User is logged out');
                accountFactory.setUser(null);
            }
        };

        accountFactory.authHandler = function(error, authData) {
            if (error) {
                console.log('Login Failed!', error);
                accountFactory.setUser(null);
            } else {
                console.log('Authenticated successfully with payload:', authData);
                accountFactory.setUser(authData);
            }
            viewFactory.setLoading('login', false);
        };

        //return
        return {
            init: accountFactory.init,
            getUser: accountFactory.getUser,
            login: accountFactory.login,
        	register: accountFactory.register
        };

    });