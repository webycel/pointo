'use strict';

angular.module('pointoApp')
    .factory('storyFactory', function($firebaseObject, $window, FIREBASE_URL) {

        var storyFactory = {},
            ref = new Firebase(FIREBASE_URL);

        storyFactory.user = {
            key: null, name: null
        };

        storyFactory.createSession = function(name) {
            var id  = storyFactory.randomID(100000000, 999999999);
            var sessionsRef = ref.child('sessions').child(id);
            
            sessionsRef.set({ users: '', voteStatus: 0 }, function(error) {
                if(!error) {
                    storyFactory.joinSession(id, name);
                } else {
                    console.log(error);
                }
            });
        };

        storyFactory.joinSession = function(id, name) {

            ref.authAnonymously(function(error, authData) {
                if(error) {
                    console.log('Login Failed!', error);
                } else {
                    console.log('Authenticated successfully with payload:', authData);

                    var usersRef = new Firebase(FIREBASE_URL + 'sessions/' + id + '/users');

                    usersRef.child(authData.uid).set({ name: name, points: -1 }, function (error) {
                        if(!error) {
                            storyFactory.user.key = authData.uid;
                            storyFactory.user.name = name;

                            localStorage[authData.uid] = name;

                            usersRef.child(authData.uid).onDisconnect().remove();

                            $window.location.assign('#/' + id);
                        } else {
                            console.log(error);
                        }
                    });
                }
            });
            
        };

        storyFactory.sessionExists = function(id) {
            ref.child('sessions').child(id).once('value', function(snapshot) {
                if(!snapshot.exists()) {
                    $window.location.assign('#/');
                }
            });
        };

        storyFactory.isLoggedIn = function() {
            var authData = ref.getAuth();
            if (authData) {
                storyFactory.user.key = authData.uid;
                storyFactory.user.name = localStorage[authData.uid] || 'Anonymous';
                console.log('Authenticated user with name:', localStorage[authData.uid]);
                return true;
            } else {
                return false;
            }
        };

        storyFactory.getSession = function(id) {
            var session = $firebaseObject(ref.child('sessions').child(id)),
                users = $firebaseObject(ref.child('sessions').child(id).child('users'));

            return { session: session, participants: users};
        };

        storyFactory.randomID = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        return {
            createSession: storyFactory.createSession,
            joinSession: storyFactory.joinSession,
            sessionExists: storyFactory.sessionExists,
            getSession: storyFactory.getSession,
            isLoggedIn: storyFactory.isLoggedIn,
            user: storyFactory.user
        };

    });