// js/services/mainService.js

var app = angular.module('mainService', []);

// I should probably keep my api key more secure somewhere (tell me if you know how!)
var key = '2f89bda6-7788-47b6-9bc0-8d11287f63ce'

app.factory('Static', function($http){
	return{
		getPatch: function(region){
			return $http.get('https://na.api.pvp.net/api/lol/static-data/' + region + '/v1.2/versions?api_key=' + key);
		},
		getChamps: function(region){
			return $http.get('https://' + region + '.api.pvp.net/api/lol/static-data/' + region + '/v1.2/champion?champData=all&api_key=' + key);
		},
	};
});
