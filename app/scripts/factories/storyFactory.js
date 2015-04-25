'use strict';

angular.module('pointoApp')
    .factory('storyFactory', function($firebaseObject, $window, FIREBASE_URL) {

        var storyFactory = {},
            ref = new Firebase(FIREBASE_URL);

        storyFactory.user = {
            key: null, name: null, points: {}, 'new': false
        };

        storyFactory.sessionID = null;

        storyFactory.createSession = function(name) {
            var id = storyFactory.randomID(100000, 999999);
            var sessionsRef = ref.child('sessions').child(id);

            ref.child('sessions').once('value', function(snapshot) {
                if(snapshot.child(id).exists()) {
                    storyFactory.createSession(name);
                } else {
                    sessionsRef.set({ users: '', voteStatus: 0 }, function(error) {
                        if(!error) {
                            storyFactory.joinSession(id, name, true);
                        } else {
                            console.log(error);
                        }
                    });
                }
            });

        };

        storyFactory.joinSession = function(id, name, redirect) {

            if(!storyFactory.user.key) {
                ref.unauth();
                ref.authAnonymously(function(error, authData) {
                    if(error) {
                        console.log('Login Failed!', error);
                    } else {
                        storyFactory.addUser(id, name, authData, redirect);                        
                    }
                });
            } else {
                var authData = ref.getAuth();
                storyFactory.addUser(id, name, authData, redirect);                        
            }

            storyFactory.sessionID = id;
            
        };

        storyFactory.addUser = function(id, name, authData, redirect) {
            var usersRef = new Firebase(FIREBASE_URL + 'sessions/' + id + '/users'),
                points = { text: -1, value: -1 };

            usersRef.child(authData.uid).set({ name: name, points: points }, function (error) {
                if(!error) {
                    storyFactory.user.key = authData.uid;
                    storyFactory.user.name = name;
                    storyFactory.user.redirect = redirect;
                    storyFactory.user.points = points;

                    localStorage[authData.uid] = name;

                    usersRef.child(authData.uid).onDisconnect().remove();

                    //on vote status change
                    ref.child('sessions').child(id).child('voteStatus').on('value', function(snap) {
                        if(snap.val() === 0) {
                            ref.child('sessions').child(id).child('users').child(storyFactory.user.key).update({points: { text: -1, value: -1 }});
                        }
                    });

                    $window.location.assign('#/' + id);
                } else {
                    console.log(error);
                }
            }); 
        };

        storyFactory.sessionExists = function() {
            var text = ref.child('sessions');
            return text;
        };

        storyFactory.isLoggedIn = function() {
            var authData = ref.getAuth();
            if (authData) {
                storyFactory.user.key = authData.uid;
                storyFactory.user.name = localStorage[authData.uid] || 'Anonymous';
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

        storyFactory.setVote = function(points) {
            var user = ref.child('sessions').child(storyFactory.sessionID).child('users').child(storyFactory.user.key);
            user.update({points: { text: points.text, value: points.value }});
            storyFactory.user.points = points;
        };

        storyFactory.revealVotes = function() {
            var session = ref.child('sessions').child(storyFactory.sessionID);
            session.update({ voteStatus: 1 });
        };

        storyFactory.clearVotes = function() {
            var session = ref.child('sessions').child(storyFactory.sessionID),
                points = { text: -1, value: -1 };
            session.update({ voteStatus: 0 });
            session.child('users').child(storyFactory.user.key).update({points: points});
            storyFactory.user.points = points;
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
            setVote: storyFactory.setVote,
            revealVotes: storyFactory.revealVotes,
            clearVotes: storyFactory.clearVotes,
            user: storyFactory.user
        };

    });