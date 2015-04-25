'use strict';

angular.module('pointoApp')
    .factory('storyFactory', function($firebaseArray, $location, FIREBASE_URL) {

        var storyFactory = {},
            ref = new Firebase(FIREBASE_URL);

        storyFactory.user = {
            key: '', name: ''
        };

        storyFactory.session = {

        };

        storyFactory.createSession = function(name) {
            var id  = storyFactory.randomID(100000000, 999999999);
            var sessionsRef = $firebaseArray(ref.child('sessions').child(id));
            
            sessionsRef.$add().then(function() {
                storyFactory.joinSession(id, name);
            });
        };

        storyFactory.joinSession = function(id, name) {
            console.log(id);
            var usersRef = new Firebase(FIREBASE_URL + 'sessions/' + id);
            var users = $firebaseArray(usersRef.child('users'));

            users.$add({ name: name, points: -1 }).then(function (snap) {
                storyFactory.user.key = snap.key();
                storyFactory.user.name = name;

                $location.path(id);
            });
        };

        storyFactory.getSession = function(id) {
            var session = $firebaseArray(ref.child('sessions').child(id));
            console.log(session);
        };

        storyFactory.randomID = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        };

        return {
            createSession: storyFactory.createSession,
            joinSession: storyFactory.joinSession,
            getSession: storyFactory.getSession
        };

    });