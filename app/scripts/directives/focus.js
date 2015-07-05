'use strict';

angular.module('pointoApp')
	.directive('focusOn', function ($timeout) {
		return function (scope, elem, attr) {
			scope.$on(attr.focusOn, function () {
				$timeout(function () {
					elem[0].focus();
				});
			});
		};
	});