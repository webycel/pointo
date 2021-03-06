'use strict';

/**
 * @ngdoc overview
 * @name pointoApp
 * @description
 * # pointoApp
 *
 * Main module of the application.
 */
angular
  .module('pointoApp', [
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'firebase',
    'chart.js'
  ])
  .constant('FIREBASE_URL', 'https://pointo.firebaseio.com/')
  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/account', {
        templateUrl: 'views/account.html',
        controller: 'AccountCtrl'
      })
      .when('/forgotpassword', {
        templateUrl: 'views/forgotpassword.html',
        controller: 'PasswordResetCtrl'
      })
      .when('/:sessionID', {
        templateUrl: 'views/story.html',
        controller: 'StoryCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

angular.module('pointoApp')
  .filter('num', function() {
    return function(input) {
      return parseInt(input, 10);
    };
  });