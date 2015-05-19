'use strict';

angular.module('pointoApp')
    .factory('accountFactory', function($firebaseObject, $rootScope, FIREBASE_URL, storyFactory) {
    
    	var accountFactory = {},
            ref = new Firebase(FIREBASE_URL);

    	accountFactory.register = function(email, pwd) {
            console.log(email, pwd);

                ref.createUser({
                    email: email, password: pwd
                }, function(error, userData) {
                    if(error) {
                        console.log('Error creating user: ', error);
                        storyFactory.setErrors('registerError', error.message);
                    } else {
                        console.log('Successfully created user with uid: ', userData.uid);
                    }

                    $rootScope.$apply(function(){
                        storyFactory.setLoading('register', false);
                    });
                });

        };

        return {
        	register: accountFactory.register
        };

    });