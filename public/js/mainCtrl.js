// js/controllers/mainCtrl.js

var app = angular.module('mainController', []);

app.controller('mainController', function($scope, $http, Static){
	// Default region = NA (NA > EU 5ever amirite)
	$scope.region="na";
	$scope.champions = [];

	// Init function
	$scope.onLoad = function(){
		// Load current patch number
		Static.getPatch($scope.region)
			.success(function(data){
				$scope.patch = data[0];
			})
			.error(function(data, status, headers, config){
				console.log(status);
			});
	};

	$scope.onLoad();

	$scope.getData = function(){
		start();

		// Load all champions
		Static.getChamps($scope.region)
			.success(function(data){
				var champs = data.data;
				var keys = Object.keys(champs);
				keys.forEach(function(key){
					$scope.champions.push(champs[key]);
				});
				processData();
			})
			.error(function(data, status, headers, config){
				console.log(status);
				end();
			});

	};

	function processData(){
		console.log($scope.champions);
		end();
	}

	function start(){
		$scope.inProgress = true;
		$scope.done = false;
		$scope.errMsg = "";
	}

	function end(){
		$scope.inProgress = false;
		$scope.done = true;
	}

	$scope.test = function(){
		
	};

});