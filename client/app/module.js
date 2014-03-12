'use strict';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define(['angular', 'angular-resource', 'angular-route', 'angular-animate', 'angular-bootstrap', 'ng-grid', 'angular-recursion'], function
		(ng) {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


	var Ric = ng.module('Ric', ['ngResource', 'ngRoute', 'ngAnimate', 'ui.bootstrap', 'ngGrid', 'RecursionHelper']);


	Ric.config(function ($locationProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
	});


	return Ric;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
