var CONFIG = {
	data: '../data/'
};
var DATA = {
	B: {}
};

function appedLog(line) {
	$('#log').append($('<div></div>').text(line));
}

function getDataConfig(fn) {
	$.getJSON(CONFIG.data + 'config.json', function(data){
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
			var requestPath = CONFIG.data + buildingSlug + '/' + key + '.json';
			$.getJSON(requestPath, function(data){
				appedLog('Used ' + requestPath);
				getSuccess(buildingSlug, key, data);
			});
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

		_.each(_.range(1, 11), function(lvl) {

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

	console.log(DATA);
}