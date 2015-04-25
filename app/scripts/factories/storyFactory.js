'use strict';

angular.module('pointoApp')
    .factory('storyFactory', function($firebaseArray) {

        var ref = new Firebase('https://pointo.firebaseio.com/'),
            session = $firebaseArray(ref);

        this.createSession = function(name) {
            console.log(name);
            session.$add({ id: 1 });
        };

        this.joinSession = function(id) {
            console.log(id);
        };

        return {
            createSession: this.createSession,
            joinSession: this.joinSession
        };

    });