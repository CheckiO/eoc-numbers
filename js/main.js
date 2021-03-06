var CONFIG = {
	data: 'data/',
	maxLevel: 10,
	maxUnitLevel: 10,
	dataLink: 'https://github.com/CheckiO/eoc-game/tree/gh-pages/data/',
	title: ' EoC Numbers'
};
var DATA = {
	B: {}
};

var TIERS = {
	1: '*',
	2: '*.*',
	3: '*.*.*'
};

function formatTime(secondsDelta) {
	var hours,
        minutes,
        seconds,
        time = '';

    var options = {
        m: 'm',
        h: 'h',
        s: 's ',
        d: 'd '
    };

    hours   = Math.floor(secondsDelta / 3600);
    minutes = Math.floor((secondsDelta - (hours * 3600)) / 60);
    seconds = Math.floor(secondsDelta - (hours * 3600) - (minutes * 60));

    days = Math.floor(hours / 24);

    if (days) {
    	hours = hours - days * 24;
    	time += days + options.d + ' ';
    }

    if (hours) {
        time += hours + options.h + ' ';
    }

    if (minutes) {
        minutes = (minutes < 10 && time !== '') ? '0' + minutes : String(minutes);
        time += minutes + options.m + ' ';
    }

    if (hours === 0) {
        if (time === '') {
            time = seconds + options.s;
        } else {
        	if (seconds) {
        		time += (seconds < 10) ? '0' + seconds : String(seconds);
            	time += options.s;
        	}
            
        }
    }

    return time;
}

function formatPrice(amount) {
	if (amount >= 1000) {
		return (amount / 1000) + 'k';
	}
	return amount;
	//return String(amount).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ').replace(/\s000$/, 'k');
}

function appedLog(line) {
	var url = line.replace('data/', CONFIG.dataLink);
	$('#log').append($('<div><a href="' + url + '">' + url + '</a></div>'));
}

function getDataConfig(fn) {
	$.getJSON('config.json?_='+Math.random(), function(data){
		DATA.config = data;
		fn();
	});
}

function getBuildingsData(keys, fn) {
	var buildingSlugs = _.keys(DATA.config.buildings),
		requestCount = buildingSlugs.length * keys.length;

	var getSuccess = function(buildingSlug, key, data){
		if (!DATA.B[buildingSlug]) {
			DATA.B[buildingSlug] = {};
		}
		DATA.B[buildingSlug][key] = data;
		
		requestCount--;
		if (!requestCount) {
			fn();
		}
	};

	_.each(keys, function(key){
		_.each(buildingSlugs, function(buildingSlug) {
			if (buildingSlug === "command_center") {
				getSuccess(buildingSlug, key, []);
			} else {
				var requestPath = CONFIG.data + buildingSlug + '/' + key + '.json';
				$.getJSON(requestPath + '?_='+Math.random(), function(data){
					appedLog(requestPath);
					getSuccess(buildingSlug, key, data);
				});
			}
		});
	});
}

function getData(keys, fn) {
	var requestCount = keys.length;

	var getSuccess = function(key, data){
		var addToData = DATA.B;

		if (key.indexOf('/') + 1) {
			var buildingSlug = key.split('/')[0];
			if (!addToData[buildingSlug]) {
				addToData[buildingSlug] = {};
			}
			addToData = addToData[buildingSlug];
			key = key.split('/')[1];
		}
		addToData[key] = data;
	};

	_.each(keys, function(key){
		var requestPath = CONFIG.data + key + '.json';
		$.getJSON(requestPath + '?_='+Math.random(), function(data){
			appedLog(requestPath);
			getSuccess(key, data);
		}).always(function(){
			requestCount--;
			if (!requestCount) {
				fn();
			}
		});
	});
}

function getClosesValue(list, buildLvl) {
	var resultVal = 0,
		closesLvl = 0;
	_.each(list, function(data){
		var lvl = data.REQUIRED_BUILDING_LEVEL || data.required_building_level;
		if (lvl > buildLvl) {
			return;
		}
		if (lvl < closesLvl) {
			return;
		}
		closesLvl = lvl;
		resultVal = data.BUILDING_LEVEL || data.max_count;
	});
	return resultVal;
}

function outIndex() {
	getDataConfig(function(){
		var $out = $('#out');
		$out.append('<h2>Buildings</h2>');

		var $ul = $('<ul></ul>').appendTo($out);
		$ul.append('<li><b><a href="building.html?command_center">Command Center</a></b></li>');
		_.each(DATA.config.categories, function(_d, categorySlug) {
			$ul.append('<li><a href="levels.html"><b>' + categorySlug + '</b></a></li>');
			var $ulBuilding = $('<ul></ul>').appendTo($ul);
			_.each(DATA.config.buildings, function(data, buildingSlug){
				if (data.category !== categorySlug) {
					return;
				}
				$ulBuilding.append('<li><a href="building.html?' + buildingSlug + '">' + data.name + '</a></li>');
			});
		});
		$out.append('<h2>Units</h2>');
		$ul = $('<ul></ul>').appendTo($out);
		_.each(DATA.config.units, function(data, unitSlug) {
			$ul.append('<li><a href="unit.html?' + unitSlug + '">' + data.name + '</a></li>');
		});
	});
}

function outLevels() {
	getDataConfig(function(){
		getBuildingsData(['building_level_requirement', 'building_count', 'building_level'], processDataLevels);
	});
}

function processDataLevels() {
	var $out = $('#out');
	$('title').text('Buildings. ' + CONFIG.title);
	_.each(DATA.config.categories, function(catData, catSlug){
		if (catSlug === 'other') {
			return;
		}

		// Show the category
		var $table = $('<table class="table table-striped"></table>'),
			$trNames = $('<tr><th rowspan="2">CC Lvl</th></tr>'),
			$trCats = $('<tr></tr>');
		$out.append('<div class="page-header"><h2>' + catSlug + '</h2></div>');
		$out.append($table);
		$table.append($trNames);
		$table.append($trCats);

		_.each(DATA.config.buildings, function(buildData, buildingKey){

			// Show the table header for each building in the category
			if (buildData.category !== catSlug) {
				return;
			}
			$trNames.append('<th colspan="4"><a href="building.html?' + buildingKey + '">' + buildData.name + '</a></th>');
			$trCats.append('<th>Lvl</th>');
			$trCats.append('<th>Am.</th>');
			$trCats.append('<th>Time</th>');
			$trCats.append('<th>Cost</th>');
		});

		_.each(_.range(1, CONFIG.maxLevel + 1), function(lvl) {

			// Show the data in the table
			var $trData = $('<tr><td>' + lvl + '</td></tr>');
			$table.append($trData);

			_.each(DATA.config.buildings, function(buildData, buildingSlug){
				if (buildData.category !== catSlug) {
					return;
				}
				var maxLvl = getClosesValue(DATA.B[buildingSlug].building_level_requirement, lvl);
				$trData.append('<td>' + maxLvl + '</td>');

				var maxCount = getClosesValue(DATA.B[buildingSlug].building_count, lvl);
				$trData.append('<td>' + maxCount + '</td>');

				if (maxCount) {
					var lvlData = _.find(DATA.B[buildingSlug].building_level, function(d) {return d.LEVEL === maxLvl;}),
						upTime = lvlData.time_upgrade,
						cost = lvlData.amount_resource_construction;
					$trData.append('<td>'+
						formatTime(upTime) +
						'</td>');
					$trData.append('<td>'+
						formatPrice(cost) +
						'</td>');
				} else {
					$trData.append('<td> 0 </td>');	
					$trData.append('<td> 0 </td>');	
				}
				
			});

		});
	});
}

function outBuilding(buildingSlug) {
	getDataConfig(function(){
		var buildingConfig = DATA.config.buildings[buildingSlug];
		if (!buildingConfig){
			alert('WRONG URL.');
			return;
		}
		getData([
			'missions',
			'building',
			buildingSlug + '/building_count',
			buildingSlug + '/building_level',
			buildingSlug + '/building_level_requirement',
			buildingSlug + '/mission_building_level',
			buildingSlug + '/' + buildingConfig.type,
			buildingSlug + '/' + buildingConfig.type + '_improvement',
		], processDataBuilding.bind(this, buildingSlug));
	});
}


function processDataBuilding(buildingSlug) {
	var $out = $('#out');
	// General Description
	var generalData = _.find(DATA.B.building, function(data) {
		return data.SLUG === buildingSlug;
	});
	var configData = DATA.config.buildings[buildingSlug];

	$('title').text(generalData.title + '. ' + CONFIG.title);
	$('.out__name').text(generalData.title);
	$('.out__description').text(generalData.description);
	$('.out__img').attr('src', 'img/' + buildingSlug + '.png');

	var specData = DATA.B[buildingSlug],
		specTypeData = specData[configData.type],
		typeData = DATA.config.types[configData.type];

	//CC level open
	var $table = $('.out__lvl_count'),
		$trCC = $('<tr><th>CC Lvl.</th></tr>').appendTo($table),
		$trLevel = $('<tr><th>Max. Lvl.</th></tr>').appendTo($table),
		$trCount = $('<tr><th>Max. Am.</th></tr>').appendTo($table),
		$trAdditioanal = [];

	if (typeData.calcViewDescription) {
		$trAdditioanal = _.map(typeData.calcViewDescription, function(name){
			return $('<tr><th>' + name + '</th></tr>').appendTo($table);
		});
	}

	var funcsLvl = {
		"maxCapacity": function(lvl) {
			var maxLvl = getClosesValue(specData.building_level_requirement, lvl),
				maxCount = getClosesValue(specData.building_count, lvl),
				lvlData = _.find(specTypeData, function(d){return d.BUILDING_LEVEL === maxLvl;});
			if (!maxLvl) {
				return 0;
			}
			return formatPrice(maxCount * lvlData.limit_resource_storage);
		},
		"maxProduct": function(lvl) {
			var maxLvl = getClosesValue(specData.building_level_requirement, lvl),
				maxCount = getClosesValue(specData.building_count, lvl),
				lvlData = _.find(specTypeData, function(d){return d.BUILDING_LEVEL === maxLvl;});
			if (!maxLvl) {
				return 0;
			}
			return formatPrice(maxCount * lvlData.amount_resource_production);
		},
		"maxCapacityProduct": function(lvl) {
			var maxLvl = getClosesValue(specData.building_level_requirement, lvl),
				maxCount = getClosesValue(specData.building_count, lvl),
				lvlData = _.find(specTypeData, function(d){return d.BUILDING_LEVEL === maxLvl;});
			if (!maxLvl) {
				return 0;
			}
			return formatPrice(maxCount * lvlData.limit_resource_production);
		}
	};

	_.each(_.range(1, CONFIG.maxLevel + 1), function(lvl) {
		$trCC.append('<th>' + lvl + '</th>');
		$trLevel.append('<td>' + getClosesValue(specData.building_level_requirement, lvl) + '</td>');
		$trCount.append('<td>' + getClosesValue(specData.building_count, lvl) + '</td>');

		if (typeData.calcViewFunc) {
			_.map(typeData.calcViewFunc, function(funcName, i) {
				$trAdditioanal[i].append('<td>' + funcsLvl[funcName](lvl) + '</td>');
			});
		}
	});

	// Upgrades

	var funcBuildLvls = {
		"timeToFill": function(lvl, specTypeLevelData, buildingLevel){
			return formatTime(specTypeLevelData.limit_resource_production * 3600 / specTypeLevelData.amount_resource_production);
		}
	};
	var thTypeData = typeData.keysDescription.length? '<th>' +
				typeData.keysDescription.join('</th><th>') +
				'</th>':'',
		thCalcData = typeData.calcLvlDescription ? '<th>' +
				typeData.calcLvlDescription.join('</th><th>') +
				'</th>':'';
	$table = $('.out__levels');
	$table = $table.append('<tr><th>LVL</th><th>Time</th><th>HP</th><th>XP</th><th>Cost</th>' + thTypeData + thCalcData + '</tr>');

	_.each(_.range(1, CONFIG.maxLevel + 1), function(lvl) {
		var buildingLevel = _.find(specData.building_level, function(data){
			return data.LEVEL === lvl;
		});
		if (!buildingLevel) {
			return;
		}
		var $tr = $('<tr><td>' + lvl + '</td></tr>').appendTo($table);
		$tr.append('<td>' + formatTime(buildingLevel.time_upgrade) + '</td>');
		$tr.append('<td>' + formatPrice(buildingLevel.hit_points) + '</td>');
		$tr.append('<td>' + formatPrice(buildingLevel.xp_gain) + '</td>');
		$tr.append('<td>' + formatPrice(buildingLevel.amount_resource_construction) + '</td>');

		var specTypeLevelData = _.find(specTypeData, function(data) {
			return data.BUILDING_LEVEL === lvl;
		});
		_.each(typeData.keys, function(key){
			$tr.append('<td>' + formatPrice(specTypeLevelData[key]) + '</td>');
		});

		if (typeData.calcLvlFunc) {
			_.map(typeData.calcLvlFunc, function(funcName) {
				$tr.append('<td>' + funcBuildLvls[funcName](lvl, specTypeLevelData, buildingLevel) + '</td>');
			});
		}
	});

	// Improvements

	var missionLevels = _.sortBy(specData.mission_building_level, function(data){
		return data.building_number;
	});
	var missions = DATA.B.missions;
	var impTypeData = specData[configData.type + '_improvement'];

	$table = $('.out__development');

	$table.append('<tr><th>Num</th><th>Lvl</th><th>Mission</th><th>Improvement</th><th>Imp.Value</th><th>XP</th></tr>');
	_.each(missionLevels, function(missionLevel){
		var $tr = $('<tr></tr>').appendTo($table);
		$tr.append('<td>' + missionLevel.building_number + '</td>');
		$tr.append('<td>' + missionLevel.building_level + '</td>');

		var missionSlug = missionLevel.MISSION_SLUG,
			missionData = _.find(missions, function(data){return data.MISSION_SLUG === missionSlug;});

		$tr.append('<td><a href="'+missionData.repository_url + '">' + missionSlug + '</a></td>');

		var lvlImpData = _.filter(impTypeData, function(data){return data.MISSION_SLUG === missionSlug;});
		$tr.append('<td>' + typeData.improvementTypes[lvlImpData[0].type_improvement - 1] + '</td>');

		if (lvlImpData.length === 1) {
			$tr.append('<td>' + formatPrice(lvlImpData[0].value) + '</td>');
			$tr.append('<td>' + lvlImpData[0].xp_gain + '</td>');
		} else {
			$tr.append('<td>' + _.map(lvlImpData, function(data){
				return formatPrice(data.value) + ' (' + TIERS[data.TIER] + ')';
			}).join('<br>'));
			$tr.append('<td>' + _.map(lvlImpData, function(data){
				return data.xp_gain + ' (' + TIERS[data.TIER] + ')';
			}).join('<br>'));
		}
	});
}


function outUnit(unitSlug) {
	getDataConfig(function(){
		var unitConfig = DATA.config.units[unitSlug];
		if (!unitConfig){
			alert('WRONG URL.');
			return;
		}
		getData([
			'unit',
			unitSlug + '/laboratory_research',
			unitSlug + '/unit_level',
			unitSlug + '/unit_level_requirement'
		], processDataUnit.bind(this, unitSlug));
	});
}


function processDataUnit(unitSlug) {
	var $out = $('#out');
	// General Description
	var generalData = _.find(DATA.B.unit, function(data) {
		return data.SLUG === unitSlug;
	}),
		specData = DATA.B[unitSlug],
		$table;

	$('title').text(generalData.title + '. ' + CONFIG.title);

	$('.out__name').text(generalData.title);
	$('.out__img').attr('src', 'img/' + unitSlug + '.png');

	$table = $('.out__general');
	$table.append(
			'<tr><th>Fire Range</th><td>' + generalData.fire_range + '</td></tr>' +
			'<tr><th>Fire Rate</th><td>' + generalData.fire_rate + '</td></tr>' + 
			'<tr><th>Movement Speed</th><td>' + generalData.movement_speed + '</td></tr>' + 
			'<tr><th>Craft Space</th><td>' + generalData.occupied_space + '</td></tr>' + 
			'<tr><th>CC Required</th><td>' + specData.unit_level_requirement[0].required_building_level + '</td></tr>');

	$table = $('.out__levels');
	$table.append('<tr><th>LvL</th><th>Cost</th><th>Time</th><th>Demage per Shot</th><th>HP</th><th>Lab. Level</th><th>Upgrade Cost</th><th>Upgrade Time</th><th>XP</th></tr>');

	_.each(_.range(1, CONFIG.maxUnitLevel + 1), function(lvl){
		var unitLevel = _.find(specData.unit_level, function(data){
			return data.LEVEL === lvl;
		}),
			laboratoryResearch = _.find(specData.laboratory_research, function(data){
			return data.OBJECT_LEVEL === lvl;
		});
		if (!unitLevel) {
			return;
		}

		var $tr = $('<tr></tr>').appendTo($table);
		$('<td>' + lvl + '</td>').appendTo($tr);
		$('<td>' + formatPrice(unitLevel.amount_resource_production) + '</td>').appendTo($tr);
		$('<td>' + formatTime(unitLevel.time_production) + '</td>').appendTo($tr);
		$('<td>' + formatPrice(unitLevel.damage_per_shot) + '</td>').appendTo($tr);
		$('<td>' + formatPrice(unitLevel.hit_points) + '</td>').appendTo($tr);
		$('<td>' + (laboratoryResearch?laboratoryResearch.BUILDING_LEVEL:'0') + '</td>').appendTo($tr);
		$('<td>' + formatPrice(unitLevel.amount_resource_upgrade) + '</td>').appendTo($tr);
		$('<td>' + formatTime(unitLevel.time_upgrade) + '</td>').appendTo($tr);
		$('<td>' + (laboratoryResearch?laboratoryResearch.xp_gain:'0') + '</td>').appendTo($tr);
	});

	console.log(unitSlug);
	console.log(DATA);
}

