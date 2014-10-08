/*
Based on jQuery.ganttView v.0.8.8
*/
(function (jQuery) {
    
    jQuery.fn.ganttView = function () {
        
        var args = Array.prototype.slice.call(arguments);
        
        if (args.length == 1 && typeof(args[0]) == "object") {
            build.call(this, args[0]);
        }
        
        if (args.length == 2 && typeof(args[0]) == "string") {
            handleMethod.call(this, args[0], args[1]);
        }
    };
    
    function build(options) {
        
        var els = this;
        var defaults = {
            showWeekends: true,
            cellWidth: 121,
            cellHeight: 31,
            slideWidth: 500,
            vHeaderWidth: 100,
            cellMinWidth: 91,
            showEmpty: false
        };
        
        var opts = jQuery.extend(true, defaults, options);

        if (opts.data) {
            build();
        } else if (opts.dataUrl) {
            jQuery.getJSON(opts.dataUrl, function (data) { opts.data = data; build(); });
        }

        function build() {
            
            var startEnd = DateUtils.getBoundaryDatesFromDataWithHours(opts.data);
            opts.start = startEnd[0];
            opts.end = startEnd[1];
            
            els.each(function () {
                var container = jQuery(this);
                var div = jQuery("<div>", { "class": "ganttview" });
                var chart = new Chart(div, opts);
                chart.render();
                container.append(div);                
                
                var w = jQuery("div.ganttview-vtheader", container).width() +
                    jQuery("div.ganttview-slide-container", container).width();
                $('div.ganttview',container).css("width", (w + 3) + "px");
                handleScroll(jQuery("div.ganttview-slide-container", container),els,opts);                
            });
        }
    }

    function handleScroll($element,els,opts){
        //Firefox
         $element.onDelayed('DOMMouseScroll',200, function(e){
            rerender(e.originalEvent.detail < 0,els,opts);
             //prevent page fom scrolling
             return false;
         });

         //IE, Opera, Safari
        $element.onDelayed('mousewheel',200, function(e){
            rerender(e.originalEvent.wheelDelta > 0,els,opts);
             //prevent page fom scrolling
             return false;
         });
    }

    function rerender(increase,els,opts){
        var newWidth = opts.cellWidth + (increase?10:-10);
        if(opts.cellMinWidth >= newWidth){ return;}
        opts.cellWidth = newWidth;
        $(els).empty();
        build.call(els,opts);
    }

    function handleMethod(method, value) {
        
        if (method == "setSlideWidth") {
            var div = $("div.ganttview", this);
            div.each(function () {
                var vtWidth = $("div.ganttview-vtheader", div).outerWidth();
                $(div).width(vtWidth + value + 1);
                $("div.ganttview-slide-container", this).width(value);
            });
        }
    }

    var Chart = function(div, opts) {
        
        function render() {
            addVtHeader(div, opts.data, opts.cellHeight,opts.link,opts.link_title);

            var slideDiv = jQuery("<div>", {
                "class": "ganttview-slide-container",
                "css": { "width": opts.slideWidth + "px" }
            });
            var last = {};
            var first = new Date(opts.start.getFullYear(),opts.start.getMonth(),opts.start.getDate(),opts.start.getHours());
            dates = getDatesWithHours(first, opts.end, last, opts.data, opts.showEmpty);

            var cellWidthCalculated = Math.round((opts.slideWidth / (DateUtils.minutesBetween(first, last.value)-
                (opts.showEmpty ? 0 
                        : DateUtils.emptyMinutesCompensation(dates,first, last.value))))*60);

            opts.cellWidth = opts.cellMinWidth > cellWidthCalculated ? opts.cellMinWidth : cellWidthCalculated;

            addHzHeaderWithHours(slideDiv, dates, opts.cellWidth);
            addGrid(slideDiv, opts.data, dates, opts.cellWidth, opts.showWeekends);
            addBlockContainers(slideDiv, opts.data);
            addBlocksWithHours(slideDiv, opts.data, opts.cellWidth, first, last.value,dates, opts.showEmpty);
            div.append(slideDiv);
            
            
            applyLastClass(div.parent());
        }
        
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        
        // Creates a 3 dimensional array [year][month][day][hour] of every hour 
        // between the given start and end dates
        function getDatesWithHours(start, end, lastest,data, showEmpty) {
            var dates = [];
            dates[start.getFullYear()] = [];
            dates[start.getFullYear()][start.getMonth()] = [];
            dates[start.getFullYear()][start.getMonth()][start.getDate()] = [start];
            var last = start;
            while (last.compareTo(end) == -1) {
                var next = last.clone().addHours(1);
                if (!dates[next.getFullYear()]) { dates[next.getFullYear()] = []; }
                
                if (!dates[next.getFullYear()][next.getMonth()]) { 
                    dates[next.getFullYear()][next.getMonth()] = []; 
                }
                if (!dates[next.getFullYear()][next.getMonth()][next.getDate()]) { 
                    dates[next.getFullYear()][next.getMonth()][next.getDate()] = []; 
                }
                if(showEmpty || !DateUtils.isEmpty(data, next)){
                    dates[next.getFullYear()][next.getMonth()][next.getDate()].push(next);
                }
                last = next;
            }
            lastest.value = last.clone().addMinutes(60 -last.getMinutes());
            lastest.value.setSeconds(0);
            lastest.value.setMilliseconds(0);
            console.log(lastest.value);
            return dates;
        }

        function realSize(array){
            return  array.filter(function(value) { return value !== undefined }).length;
        }

        function addHzHeaderWithHours(div, dates, cellWidth) {
            var headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" });
            var daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days" });
            var hoursDiv = jQuery("<div>", { "class": "ganttview-hzheader-hours" });
            var totalW = 0;
            for (var y in dates) {
                for (var m in dates[y]) {
                    for (var d in dates[y][m]) {
                        for (var h in dates[y][m][d]) {
                            hoursDiv.append(jQuery("<div>", { 
                                "class": "ganttview-hzheader-hour",
                                "css": { "width": cellWidth  - 2 + "px" }                              
                             }).append(dates[y][m][d][h].getHours()+':00'));
                        }
                        var size = realSize(dates[y][m][d]);
                        var w = size * (cellWidth-1);
                        totalW = totalW + w;
                        daysDiv.append(jQuery("<div>", {
                            "class": "ganttview-hzheader-day",
                            "css": { "width": (w - 1) + "px" }
                        }).append(d+"/"+monthNames[m] + "/" + y));
                    }
                }
            }
            daysDiv.css("width", totalW + "px");
            hoursDiv.css("width", totalW + "px");
            headerDiv.append(daysDiv).append(hoursDiv);
            div.append(headerDiv);
        }

        function addVtHeader(div, data, cellHeight,link,title) {
            var headerDiv = jQuery("<div>", { "class": "ganttview-vtheader" });
            var headerInfoDiv = jQuery("<div>", { "class": "ganttview-vtheader-info" });
            headerInfoDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-info-tables" }));
            headerInfoDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-info-timeline" }));
            headerInfoDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-info-tables-text" }).append('Tables'));
            headerInfoDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-info-timeline-text" }).append('Timeline'));
            headerDiv.append(headerInfoDiv);
            for (var i = 0; i < data.length; i++) {
                var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                itemDiv.append(jQuery("<div>", {
                    "class": "ganttview-vtheader-item-name",
                    "css": { "height": ( cellHeight) + "px" }
                }).append(jQuery("<a>", {
                    name : "link",
                    target:"_blank",
                    href : link+data[i].name,
                    text : data[i].name,
                    title : title
                })));
                
                headerDiv.append(itemDiv);
            }
            var statusess = jQuery("<div>", {
                "class": "ganttview-statusses-info"                
            });
            /*for(var i in opts.colors){
                statusess.append(jQuery("<div>", {
                "class": "ganttview-statuss-info",
                "css":{"background-color": opts.colors[i]}
                }).append(i));

            }*/
            var that = this;
            statusess.append(jQuery('<input>',{
                type: 'checkbox',
                id: 'show-empty-chbx',
                change: function(){
                    opts.showEmpty = this.checked;
                    $(div).empty();
                    render();
                    console.log('Changed');
                }
            }).attr('checked',opts.showEmpty)).append(jQuery('<lable>',{
                text: 'show',
                 'class': 'show-empty-chbx-lbl',
                'for': 'show-empty-chbx',

            }));
            headerDiv.append(statusess);
            div.append(headerDiv);
        }        

        function addGrid(div, data, dates, cellWidth, showWeekends) {
            var gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
            var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" });
            for (var y in dates) {
                for (var m in dates[y]) {
                    for (var d in dates[y][m]) {
                        for (var d in dates[y][m][d]) {
                            var cellDiv = jQuery("<div>", { 
                                "class": "ganttview-grid-row-cell",
                                 "css": { "width": cellWidth  - 2 + "px" }});
                            rowDiv.append(cellDiv);
                        }                       
                    }
                }
            }
            var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * (cellWidth-1);
            rowDiv.css("width", w + "px");
            gridDiv.css("width", w + "px");
            for (var i = 0; i < data.length; i++) {
                gridDiv.append(rowDiv.clone());
            }
            div.append(gridDiv);
        }

        function addBlockContainers(div, data) {
            var blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" });
            for (var i = 0; i < data.length; i++) {
                blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));
            }
            div.append(blocksDiv);
        }

        function addBlocksWithHours(div, data, cellWidth, start, maxDate,dates, showEmpty) {
            var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", div);
            var rowIdx = 0;
            var minuetsRatio =  ( cellWidth-1 )/60.0;
            for (var i = 0; i < data.length; i++) {
                var slaHours = data[i].sla.split(':')[0];
                var slaMinutes = data[i].sla.split(':')[1];
                //date for which SLA is already rendered
                var lastSLADate = undefined;
                for (var j = 0; j < data[i].series.length; j++) {
                    var series = data[i].series[j];
                    
                    var sizeMinuets =  DateUtils.minutesBetween(series.start, series.end || maxDate) ;
                    var offsetMinuets = DateUtils.minutesBetween(start, series.start) - 
                        (showEmpty ? 0 
                        : DateUtils.emptyMinutesCompensation(dates,series.start, start));
                    
                    var offset =  Math.round(offsetMinuets*minuetsRatio) ;
                    var size = Math.round(sizeMinuets*minuetsRatio);
                
                    var block = jQuery("<div>", {
                        "class": "ganttview-block",
                        "title": series.name + ", status : " +series.status + ', time spent: ' + (series.end ? (size == 0 ? 'less that 1 minute' : Math.round(sizeMinuets) + " minutes") : 'still running')+ '\nStarted at : '+series.start.toString("HH:mm:ss")+ (series.end?', ended at ' +series.end.toString("HH:mm:ss"):''),
                        "css": {
                            "width": (size===0?1:size - 1) + "px",
                            "margin-left": offset + "px"
                        }
                    });
                    
                    addBlockData(block, data[i], series);

                    //Set color of the job
                    if (opts.colors) {
                        block.css("background-color", opts.colors[data[i].series[j].status]);
                    }

                    jQuery(rows[rowIdx]).append(block); 

                    if(lastSLADate === undefined || (lastSLADate.getDate() !== series.start.getDate()||
                        lastSLADate.getMonth() !== series.start.getMonth() || 
                        lastSLADate.getYear() !== series.start.getYear())){                        
                        
                        var sla = series.start.clone();
                        sla.setHours(slaHours);
                        sla.setMinutes(slaMinutes);
                        sla.setSeconds(0);
                        if(maxDate.isAfter(sla)){
                            var slaOffsetMinuets = DateUtils.minutesBetween(start, sla) - 
                            (showEmpty ? 0 
                            : DateUtils.emptyMinutesCompensation(dates,sla, start));;
                            
                            var slaOffset =  Math.round(slaOffsetMinuets*minuetsRatio) ;
        
                            var slaBlock = jQuery("<div>", {
                                "class": "ganttview-block-sla",
                                "title": 'SLA is ' + data[i].sla,
                                "css": {
                                    "width": "2px",
                                    "margin-left": slaOffset + "px"
                                }
                            });
                            jQuery(rows[rowIdx]).append(slaBlock); 
                        }
                        lastSLADate = series.start.clone();
                    }
                }
                rowIdx = rowIdx + 1;
            }
        }

        function addBlockData(block, data, series) {
            // This allows custom attributes to be added to the series data objects
            // and makes them available to the 'data' argument of click, resize, and drag handlers
            var blockData = { id: data.id, name: data.name };
            jQuery.extend(blockData, series);
            block.data("block-data", blockData);
        }

        function applyLastClass(div) {
            jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-hours div.ganttview-hzheader-hour:last-child", div).addClass("last");
        }
        
        return {
            render: render
        };
    }    

    var DateUtils = {
        
        emptyMinutesCompensation: function(dates, date, start){
            var hours = -1;
            for (var y in dates) {
                for (var m in dates[y]) {
                    for (var d in dates[y][m]) {
                        for (var h in dates[y][m][d]) {
                            if(dates[y][m][d][h].isBefore(date) ||  dates[y][m][d][h].equals(date)){
                                hours++;
                            }
                        }
                    }
                }
            }
            var dateWithoutMinutes = date.clone();
            dateWithoutMinutes.setMinutes(0);
            dateWithoutMinutes.setSeconds(0);
            dateWithoutMinutes.setMilliseconds(0);
            return (dateWithoutMinutes.getTime() - start.getTime())/(1000*60)- hours*60;
        },

        isEmpty: function(data, date){
            var nextHour = date.clone();
            nextHour.addHours(1);
            for (var i = data.length - 1; i >= 0; i--) {
                var slaDate = date.clone();
                slaDate.setHours(0);
                slaDate.setMinutes(0);
                slaDate.setSeconds(0);
                slaDate.setMilliseconds(0);  
                var time = slaDate.getTime();              
                if(data[i].slas[time] && data[i].slas[time].between(date,nextHour)){
                    return false;
                }
                for (var j = 0; j < data[i].series.length; j++) {
                    if(data[i].series[j].start.between(date,nextHour)||
                        data[i].series[j].end.between(date,nextHour) || 
                        (data[i].series[j].start.isAfter(date) && 
                            data[i].series[j].end.isBefore(nextHour))){
                        return false;
                    }
                };
            };
            return true;
        },

        minutesBetween: function (start, end) {
            if (!start || !end) { return 0; }
            start = Date.parse(start); end = Date.parse(end);
            if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
            var result = (end.getTime() - start.getTime())/(1000*60);//in minutes
            return result;
        },        

        getBoundaryDatesFromDataWithHours: function (data) {
            var minStart = new Date(); maxEnd = new Date();
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    if(!data[i].series[j].end || !data[i].series[j].start){
                        continue;
                    }
                    var start = Date.parse(data[i].series[j].start);
                    var end = Date.parse(data[i].series[j].end)
                    if (i == 0 && j == 0) { minStart = start; maxEnd = end; }
                    if (minStart.compareTo(start) == 1) { minStart = start; }
                    if (maxEnd.compareTo(end) == -1) { maxEnd = end; }
                }
            }
            return [minStart, maxEnd];
        }
    };

})(jQuery);