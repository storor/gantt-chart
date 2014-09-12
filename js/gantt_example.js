$( document ).ready(function() {
     var ganttData = [
		{
			id: 1, name: "Table 1", series: [
				{ name: "Job 1", start: new Date(2010,00,01,0), end: new Date(2010,00,01,2) },
				{ name: "Job 2", start: new Date(2010,00,01,3), end: new Date(2010,00,01,4), color: "#f0f0f0" }
			]
		}, 
		{
			id: 2, name: "Table 2", series: [
				{ name: "Job 1", start: new Date(2010,00,01,1), end: new Date(2010,00,01,5) },
				{ name: "Job 2", start: new Date(2010,00,01,6), end: new Date(2010,00,01,7), color: "#f0f0f0" },
				{ name: "Job 3", start: new Date(2010,00,01,9), end: new Date(2010,00,01,11), color: "#e0e0e0" }
			]
		}, 
		{
			id: 3, name: "Table 3", series: [
				{ name: "Job 1", start: new Date(2010,00,01,1), end: new Date(2010,00,01,2) },
				{ name: "Job 2", start: new Date(2010,00,01,3), end: new Date(2010,00,01,4), color: "#f0f0f0" },
				{ name: "Job 3", start: new Date(2010,00,01,5), end: new Date(2010,00,01,7), color: "#e0e0e0" }
			]
		}
	];
	$('.content').ganttView({ 
		data: ganttData,
		slideWidth: 900		
	});		
});
