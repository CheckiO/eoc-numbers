var CONFIG = {
	data: '../data/',
	maxLevel: 10,
	maxUnitLevel: 6
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
        s: 's '
    };

    hours   = Math.floor(secondsDelta / 3600);
    minutes = Math.floor((secondsDelta - (hours * 3600)) / 60);
    seconds = Math.floor(secondsDelta - (hours * 3600) - (minutes * 60));

    if (hours != 0) {
        time = hours + options.h + ' ';
    }

    if (minutes != 0 || time !== '') {
        minutes = (minutes < 10 && time !== '') ? '0' + minutes : String(minutes);
        time += minutes + options.m + ' ';
    }

    if (hours === 0) {
        if (time === '') {
            time = seconds + options.s;
        } else {
            time += (seconds < 10) ? '0' + seconds : String(seconds);
            time += options.s;
        }
    }

    return time;
}

function formatPrice(amount) {
	return String(amount).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
}

function appedLog(line) {
	$('#log').append($('<div></div>').text(line));
}

function getDataConfig(fn) {
	$.getJSON('../config.json', function(data){
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
				$.getJSON(requestPath, function(data){
					appedLog('Used ' + requestPath);
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
		$.getJSON(requestPath, function(data){
			appedLog('Used ' + requestPath);
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
		var lvl = data.BUILDING_LEVEL || data.REQUIRED_BUILDING_LEVEL;
		if (lvl > buildLvl) {
			return;
		}
		if (lvl < closesLvl) {
			return;
		}
		closesLvl = lvl;
		resultVal = data.max_count || data.required_building_level;
	});
	return resultVal;
}

function outLevels() {
	getDataConfig(function(){
		getBuildingsData(['building_level_requirement', 'building_count'], processDataLevels);
	});
}

function processDataLevels() {
	var $out = $('#out');
	_.each(DATA.config.categories, function(catData, catSlug){

		// Show the category
		var $table = $('<table border="1"></table>'),
			$trNames = $('<tr><th rowspan="2">LvL</th></tr>'),
			$trCats = $('<tr></tr>');
		$out.append('<h2>' + catSlug + '</h2>');
		$out.append($table);
		$table.append($trNames);
		$table.append($trCats);

		_.each(DATA.config.buildings, function(buildData){

			// Show the table header for each building in the category
			if (buildData.category !== catSlug) {
				return;
			}
			$trNames.append('<th colspan="2">' + buildData.name + '</th>');
			$trCats.append('<th>CC</th>');
			$trCats.append('<th>Am</th>');
		});

		_.each(_.range(1, CONFIG.maxLevel + 1), function(lvl) {

			// Show the data in the table
			var $trData = $('<tr><td>' + lvl + '</td></tr>');
			$table.append($trData);

			_.each(DATA.config.buildings, function(buildData, buildingSlug){
				if (buildData.category !== catSlug) {
					return;
				}
				$trData.append('<td>'+
					getClosesValue(DATA.B[buildingSlug].building_level_requirement, lvl)+
					'</td>');
				$trData.append('<td>'+
					getClosesValue(DATA.B[buildingSlug].building_count, lvl)+
					'</td>');
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

	$out.append('<h1>' + generalData.title + '</h1>');
	$out.append($('<div class="description"></div>').text(generalData.description));

	var specData = DATA.B[buildingSlug],
		specTypeData = specData[configData.type];

	//CC level open
	var $table = $('<table border="1">').appendTo($out),
		$trCC = $('<tr><th>CC</th></tr>').appendTo($table),
		$trLevel = $('<tr><th>LVL</th></tr>').appendTo($table),
		$trCount = $('<tr><th>Count</th></tr>').appendTo($table);

	_.each(_.range(1, CONFIG.maxLevel + 1), function(lvl) {
		$trCC.append('<th>' + lvl + '</th>');
		$trLevel.append('<td>' + getClosesValue(specData.building_level_requirement, lvl) + '</td>');
		$trCount.append('<td>' + getClosesValue(specData.building_count, lvl) + '</td>');
	});

	// Upgrades
	var typeData = DATA.config.types[configData.type],
		thTypeData = typeData.keysDescription.length? '<th>' +
				typeData.keysDescription.join('</th><th>') +
				'</th>':'';

	$table = $('<table border="1"><tr><th>LVL</th><th>Time</th><th>HP</th><th>XP</th><th>Cost</th>' + thTypeData + '</tr></table>').appendTo($out);

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
	});

	// Improvements

	var missionLevels = _.sortBy(specData.mission_building_level, function(data){
		return data.building_number;
	});
	var missions = DATA.B.missions;
	var impTypeData = specData[configData.type + '_improvement'];

	$table = $('<table border="1"><tr><th>Num</th><th>Lvl</th><th>Mission</th><th>Improvement</th><th>Imp.Value</th><th>XP</th></tr></table>').appendTo($out);
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

	$('.out__name').text(generalData.title);
	$('.out__img').attr('src', '../img/' + unitSlug + '.png');

	$table = $('.out__general');
	$table.append(
			'<tr><th>Fire Range</th><td>' + generalData.fire_range + '</td></tr>' +
			'<tr><th>Fire Rate</th><td>' + generalData.fire_rate + '</td></tr>' + 
			'<tr><th>Movement Speed</th><td>' + generalData.movement_speed + '</td></tr>' + 
			'<tr><th>Craft Space</th><td>' + generalData.occupied_space + '</td></tr>' + 
			'<tr><th>CC Required</th><td>' + specData.unit_level_requirement[0].required_building_level + '</td></tr>');

	$table = $('.out__levels');
	$table.append('<tr><th>LvL</th><th>Cost</th><th>Time</th><th>Demage per Shot</th><th>HP</th><th>Upgrade Cost</th><th>Upgrade Time</th></tr>');

	_.each(_.range(1, CONFIG.maxUnitLevel), function(lvl){
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
		$('<td>' + formatPrice(unitLevel.amount_resource_upgrade) + '</td>').appendTo($tr);
		$('<td>' + formatTime(unitLevel.time_upgrade) + '</td>').appendTo($tr);
	});

	console.log(unitSlug);
	console.log(DATA);
}

