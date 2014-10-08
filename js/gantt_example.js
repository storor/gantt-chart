$( document ).ready(function() {
	var slas = {
	    AIR_TCKT_TRANS_FACT : '7:30',
	    BUSINESS_PARTNR_DIM : '7:30',
	    CAR_RENTL_TRANS_FACT : '7:30',
	    CRUIS_CABN_TRANS_FACT : '7:30',
	    DEST_SVC_TCKT_TRANS_FACT : '7:30',
	    INS_ITM_TRANS_FACT : '7:30',
	    LODG_RM_NIGHT_TRANS_FACT : '7:30',
	    MGMT_UNIT_DIM : '4:00',
	    PKG_TRANS_FACT : '7:30',
	    TRAIN_BKG_TRANS_FACT : '7:30',
	    NOT_AIR_TCKT_TRANS_FACT : '6:00'

	}
     var parseData = function(rawData){
        if(!rawData){
            return [];
        }
		var groups = {};
		rawData.map( function (element) { 
			var group = element.TabName;
			groups[group] = groups[group] || {};
			groups[group].name = element.TabName;
			groups[group].sla = slas[element.TabName];
			groups[group].series = groups[group].series || [];
			
			var slaDate = new Date(element.RunStart);
			slaDate.setHours(0);
			slaDate.setMinutes(0);
			slaDate.setSeconds(0);
			slaDate.setMilliseconds(0);
			groups[group].slas = groups[group].slas || [];
			
			var slaTime = slaDate.clone();
			slaTime.setHours(slas[element.TabName].split(':')[0]);
            slaTime.setMinutes(slas[element.TabName].split(':')[1]);
			groups[group].slas[slaDate.getTime()] = slaTime;

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
	window.parsedData = parseData(data);

	if(parsedData.length == 0){
	    return;
	}
   $('.content').ganttView({ 
		data: parsedData,
		slideWidth: $('.content').width()-280,
		cellWidth: 101,
		colors: {
			Success: '#DFF2BF',
			Running: '#BDE5F8',
			Invalid: '#FC5059',
			Failed: '#FFBABA'
		},
		link: ' http://chc-utldwh01/cgi-bin/ctmdshbrd.pl?search=',
        link_title:  'Show Jobs in Contor-M'
	});

	$('.ganttview-statuss-info').on('click',function(evt){
		console.log(evt);
		console.log(this);
	})	
});