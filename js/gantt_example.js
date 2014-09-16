$( document ).ready(function() {
     var parseData = function(rawData){
        if(!rawData){
            return [];
        }
		var groups = {};
		rawData.map( function (element) { 
			var group = element.TabName;
			groups[group] = groups[group] || {};
			groups[group].name = element.TabName;
			groups[group].series = groups[group].series || [];
			groups[group].series[groups[group].series.length] = {
				name: element.job,
				status: element.Status,
				start: new Date(element.RunStart),
				end: new Date(element.RunEnd)
			};			
		});
		var array = $.map(groups, function(value, index) {
		    return [value];
		});
		return array;
	}
	var parsedData = parseData(data);
	if(parsedData.length == 0){
	    return;
	}
   $('.content').ganttView({ 
		data: parsedData,
		slideWidth: $('.content').width()-280,
		cellWidth: 61,
		colors: {
			Success: '#DFF2BF',
			Running: '#BDE5F8',
			Invalid: '#D8000C',
			Failed: '#FFBABA'
		}
	});	
});
