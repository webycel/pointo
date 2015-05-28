'use strict';

angular.module('pointoApp')
    .factory('viewFactory', function() {
    
    	var viewFactory = {};

        viewFactory.errors = {
            noSession: false, registerError: false
        };

        viewFactory.loading = {
            create: false, join: false, joinSpectator: false, login: false, register: false
        };

        //public
        viewFactory.getErrors = function() {
            return viewFactory.errors;
        };

        viewFactory.setErrors = function(e, v) {
            viewFactory.errors[e] = v;
        };

        viewFactory.getLoading = function() {
            return viewFactory.loading;
        };
        viewFactory.setLoading = function(t, v) {
            viewFactory.loading[t] = v;
        };


        //return
        return {
            getErrors: viewFactory.getErrors,
            setErrors: viewFactory.setErrors,
            getLoading: viewFactory.getLoading,
            setLoading: viewFactory.setLoading
        };

    });