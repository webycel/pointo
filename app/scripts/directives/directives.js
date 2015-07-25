'use strict';

angular.module('pointoApp')
	.directive('focusOn', function($timeout) { // set focus on an element on condition in attribute
		return function(scope, elem, attr) {
			scope.$on(attr.focusOn, function() {
				$timeout(function() {
					elem[0].focus();
				});
			});
		};
	}).directive("fileSelect", function() {
		return {
			link: function(scope, el) {
				el.bind("change", function(e) {
					var file = (e.srcElement || e.target).files[0];
					scope.getFile(file);
				});
			}
		};

	});