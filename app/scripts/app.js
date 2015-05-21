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
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
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
  .directive('globalHeader', function() {

    return {
      templateUrl: '../views/_header.html'
    };

});