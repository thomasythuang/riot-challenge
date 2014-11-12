// js/controllers/mainCtrl.js

var app = angular.module('mainController', []);

app.controller('mainController', function($scope, $http, Static){
	// Default region = NA (NA > EU 5ever amirite)
	$scope.region="na";
	$scope.champions = [];
	$scope.spells = [];
	$scope.ap = 200;
	$scope.ad = 200;

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

	// Load spell data from Riot API and analyze 
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

	// For each champion, load each spell into an array and analyze it
	function processData(){
		for (var i=0; i<$scope.champions.length; i++){
			for (var j=0; j<$scope.champions[i].spells.length; j++){
				var spell = $scope.champions[i].spells[j];
				ratios(spell);
				effects(spell);
				evaluate(spell);
				spell.champ = $scope.champions[i].name;
				$scope.spells.push(spell);
			}
		}
		end();
	}

	// Assign the AD/AP/etc ratios of spells
	function ratios(spell){
		spell.ad = 0;
		spell.ap = 0;
		spell.bonusAd = 0;
		spell.mana = 0;
		var result = "";
		var existingRatios = [];
		if (spell.vars){
			for (var i=0; i<spell.vars.length; i++){
				parseRatio(spell.vars[i].link, spell.vars[i].coeff[0], spell);
			}

			if (spell.ad > 0)
				result += "(+ " + spell.ad.toString() + " AD)";
			if (spell.ap > 0)
				result += "(+ " + spell.ap.toString() + " AP)";
			if (spell.bonusAd > 0)
				result += "(+ " + spell.bonusAd.toString() + " Bonus AD)";
			if (spell.mana > 0)
				result += "(+ " + spell.mana.toString() + " Mana)";
		}
		spell.ratios = result;
	}
	
	// Assign the correct type of ratio to a spell
	function parseRatio(str, coeff, spell){
		switch(str){
			case "spelldamage":
				spell.ap = coeff;
				break;
			case "attackdamage":
				spell.ad = coeff;
				break;
			case "bonusattackdamage":
				spell.bonusAd = coeff;
				break;
			case "mana":
				spell.mana = coeff;
				break;
			default:
				return false;
		}
	} 

	// Assign a spell its effects based on given effect labels
	// Categories are damage, heal, shield, and crowd control
	// It was difficult to properly assign every single effect for every spell because effects were index in different patterns for various spells
	// The most common pattern was the effect label (in spell.leveltip.label) having index i, and the effect value (in spell.effect or spell.effectBurn) having index i+1
	function effects(spell){
		var dmgLabels = ["Damage" , "Damage ", "Bonus Damage", "Base Damage", "Current Health %", "Bonus Magic Damage", "Magic Damage", "Bite Damage", "Percent Maximum Health Damage", "Minimum Damage", "Primary Damage", "True Damage", "Total Damage", "Explosion Damage", "Damage per Second", "Damage Per Second", "Damage per Sec", "Damage dealt per second", "Base Damage per Second", "Max Damage", "Max Health Damage", "Venomous Bite Damage", "Collision Damage", "Maximum Damage", "Passive Damage", "Mark Detonation Damage", "Beam Damage"];
		var healLabels = ["Heal", "Base Heal", "Health Restored", "Bonus Health"];
		var shieldLabels = ["Shield Absorption", "Damage Absorption", "Shield Amount", "Shield Health", "Shield Health "];
		var ccLabels = ["Attack Damage Reduction", "Movement Speed Slow", "Movement Speed Reduction", "Slow", "Slow Amount"];
		var allLabels = [dmgLabels, healLabels, shieldLabels, ccLabels];
		var label = spell.leveltip.label;
		var index = -1;
		spell.eff = [];
		
		for (var j=0; j < allLabels.length; j++){
			for (var i=0; i < allLabels[j].length; i++){
				index = label.indexOf(allLabels[j][i]);
				if (index > -1 && norm(spell)){
					spell.eff.push({
						label: label[index],
						valBurn: spell.effectBurn[index+1],
						val: spell.effect[index+1],
						type: j,
					});
					if (j < 3)
						break;
				}else if (index > -1){
					spell.eff.push({
						label: label[index],
						valBurn: spell.effectBurn[index+2],
						val: spell.effect[index+2],
						type: j,
					});
					if (j < 3)
						break;
				}
			}
		}
	}

	// Special case spells where effect values are indexed +2 more than
	// the effect labels instead of +1
	function norm(spell){
		var spells = ["Wall of Pain", "Permafrost",];

		return (spells.indexOf(spell.name) < 0);
	}

	// Calculate the efficiency rating of a spell
	function evaluate(spell){
		if (spell.name == "Wild Cards")
			spell.range = 1450; // API provides wrong range

		spell.base = 0;
		var multiplier = 0;
		var val = 0;
		var range = spell.range[0];
		var cd;
		var cost;

		// Get base values for effects
		for (var i=0; i<spell.eff.length; i++){
			multiplier = getMultiplier(spell.eff[i].type);
			val = spell.eff[i].val;
			if (val)
				spell.base += val[val.length-1] * multiplier;
		}

		// Add ap and ad ratio calculations
		spell.base += $scope.ad * spell.ad + ($scope.ad-100) * spell.bonusAd + $scope.ap * spell.ap;

		// Calculate score modifier for range
		spell.rangeMod = 1 
		if (range > 2000)
			range = 2000;
		if (!isNaN(range)){
			spell.rangeMod += Math.log(1 + (range / 2000));
			spell.rangeMod *= 1.5
		}

		// Calculate score modifier for cooldown
		cd = spell.cooldown;
		cd = cd[cd.length-1];
		if (cd < 2.5)
			cd += 20;
		spell.cdMod = 3 / Math.log(cd);

		// Calculate score modifier for energy/mana costs
		cost = spell.cost;
		cost = cost[cost.length-1];
		if (cost < 20){
			spell.costMod = 1;
		}else if(spell.costType == "Energy"){
			spell.costMod = 3.5 / Math.log(cost);
		}else{
			spell.costMod = 3.5 / Math.log(cost);
		}

		spell.rating = spell.base * spell.rangeMod * spell.cdMod * spell.costMod;
	}

	function getMultiplier(n){
		switch (n){
			case 0:
				return 1;
				break;
			case 1: 
				return 1.5;
				break;
			case 2:
				return 0.8;
				break;
			case 3: 
				return 1;
				break;
			default:
				return 0;
		}
	}

	function start(){
		$scope.inProgress = true;
		$scope.done = false;
		$scope.errMsg = "";
		$scope.champions = [];
		$scope.spells = [];
	}

	function end(){
		$scope.inProgress = false;
		$scope.done = true;
	}

	$scope.test = function(spell){
		console.log(spell);
	};

});