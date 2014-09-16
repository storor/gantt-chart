/*
Based on jQuery.ganttView v.0.8.8
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
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
            cellMinWidth: 31
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
                
                var w = jQuery("div.ganttview-vtheader", container).outerWidth() +
                    jQuery("div.ganttview-slide-container", container).outerWidth();
                container.css("width", (w + 2) + "px");
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
        console.log((opts.cellMinWidth > newWidth) + ' '+ opts.cellMinWidth + ' '+ newWidth);
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
            addVtHeader(div, opts.data, opts.cellHeight);

            var slideDiv = jQuery("<div>", {
                "class": "ganttview-slide-container",
                "css": { "width": opts.slideWidth + "px" }
            });
            
            dates = getDatesWithHours(opts.start, opts.end);
            addHzHeaderWithHours(slideDiv, dates, opts.cellWidth);
            addGrid(slideDiv, opts.data, dates, opts.cellWidth, opts.showWeekends);
            addBlockContainers(slideDiv, opts.data);
            addBlocksWithHours(slideDiv, opts.data, opts.cellWidth, opts.start);
            div.append(slideDiv);
            applyLastClass(div.parent());
        }
        
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        
        // Creates a 3 dimensional array [year][month][day][hour] of every hour 
        // between the given start and end dates
        function getDatesWithHours(start, end) {
            window.start = start;
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
                dates[next.getFullYear()][next.getMonth()][next.getDate()].push(next);
                last = next;
            }
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
                                "css": { "width": cellWidth  - 1 + "px" }                              
                             }).append(dates[y][m][d][h].getHours()+':00'));
                        }
                        var size = realSize(dates[y][m][d]);
                        var w = size * cellWidth;
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

        function addVtHeader(div, data, cellHeight) {
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
                }).append(data[i].name));
                headerDiv.append(itemDiv);
            }
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
                                 "css": { "width": cellWidth  - 1 + "px" }});
                            rowDiv.append(cellDiv);
                        }                       
                    }
                }
            }
            var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * cellWidth;
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

        function addBlocksWithHours(div, data, cellWidth, start) {
            var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", div);
            var rowIdx = 0;
            var minuetsRatio =  ( cellWidth )/60.0;
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    var series = data[i].series[j];

                    var sizeMinuets =  DateUtils.minutesBetween(series.start, series.end);
                    var offsetMinuets = DateUtils.minutesBetween(start, series.start);

                    //console.log(offsetMinuets*minuetsRatio+' where offset: '+offsetMinuets+' minuetsRatio: '+minuetsRatio);
                    var size = Math.round(sizeMinuets*minuetsRatio);
                    var offset = Math.round(offsetMinuets*minuetsRatio);

                    var block = jQuery("<div>", {
                        "class": "ganttview-block",
                        "title": series.name + ", status : " +series.status + ', time spent :' + (size == 0 ? 'less that 1 minute' : size + " minutes")+ ' , Started at : '+series.start,
                        "css": {
                            "width": (size===0?1:size) + "px",
                            "margin-left": offset +5+ "px"
                        }
                    });
                    addBlockData(block, data[i], series);
                    if (opts.colors) {
                        block.css("background-color", opts.colors[data[i].series[j].status]);
                    }
                    //block.append(jQuery("<div>", { "class": "ganttview-block-text" }).text(size == 0 ? '' : Math.round(sizeMinuets)));
                    jQuery(rows[rowIdx]).append(block);                    
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

    var ArrayUtils = {
    
        contains: function (arr, obj) {
            var has = false;
            for (var i = 0; i < arr.length; i++) { if (arr[i] == obj) { has = true; } }
            return has;
        }
    };

    var DateUtils = {
        
        hoursBetween: function (start, end) {
            if (!start || !end) { return 0; }
            start = Date.parse(start); end = Date.parse(end);
            if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
            var count = 0, date = start.clone();
            while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
            return count;
        },
        
        minutesBetween: function (start, end) {
            if (!start || !end) { return 0; }
            start = Date.parse(start); end = Date.parse(end);
            if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
            var result = (end.getTime() - start.getTime())/(1000*60);//in minutes
            return result;
        },

        isWeekend: function (date) {
            return date.getDay() % 6 == 0;
        },

        getBoundaryDatesFromData: function (data, minDays) {
            var minStart = new Date(); maxEnd = new Date();
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    var start = Date.parse(data[i].series[j].start);
                    var end = Date.parse(data[i].series[j].end)
                    if (i == 0 && j == 0) { minStart = start; maxEnd = end; }
                    if (minStart.compareTo(start) == 1) { minStart = start; }
                    if (maxEnd.compareTo(end) == -1) { maxEnd = end; }
                }
            }
            
            // Insure that the width of the chart is at least the slide width to avoid empty
            // whitespace to the right of the grid
            if (DateUtils.daysBetween(minStart, maxEnd) < minDays) {
                maxEnd = minStart.clone().addDays(minDays);
            }
            
            return [minStart, maxEnd];
        },

        getBoundaryDatesFromDataWithHours: function (data) {
            var minStart = new Date(); maxEnd = new Date();
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
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