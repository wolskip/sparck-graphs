(function() {
    var graphContainer = '.tory-chart';

    function jsonWithRetry(url, retries, success) {
        var load = function() {
            d3.json(url, function(error, json) {
                error = error || json.errorMessage;
                retries--;
                
                if (error) {
                    console.log(error);
                    if (retries > 0) {
                        load();
                    }
                } else {
                    success(json);
                }
            });
        };
        
        load();
    }
    
    drawGraph(graphContainer, null, function(n) { return n + "%"; });
    
//    var containerGraph1 = '.count-chart';
//    var containerGraph2 = '.percentage-chart';
//
//
//    drawGraph(containerGraph1);
//    drawGraph(containerGraph2, updateToPercentage, function(n){ return n + "%"; });

    var rawData;
    var keys;

    function drawGraph(containerGraph, updateData, tickFormat) {
        var start = new Date(2016, 5, 15, 0, 0, 0, 0);
        var end = new Date(2016, 5, 25, 1, 0, 0, 0);

        var loaded;

        // Set the dimensions of the canvas / graph
        var margin = {top: 30, right: 20, bottom: 30, left: 55},
            width = 700 - margin.left - margin.right,
            height = 370 - margin.top - margin.bottom;

        // Set the ranges
        var x = d3.time.scale().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);

//        var labelElements;

        // Define the axes
        var xAxis = d3.svg.axis().scale(x)
                    .orient("bottom")
                    .tickFormat(d3.time.format.multi([
                        [".%L", function(d) { return d.getMilliseconds(); }],
                        [":%S", function(d) { return d.getSeconds(); }],
                        ["%_H:%M", function(d) { return d.getMinutes(); }],
                        ["%_H:00", function(d) { return d.getHours(); }],
                        ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
                        ["%b %d", function(d) { return d.getDate() != 1; }],
                        ["%B", function(d) { return d.getMonth(); }],
                        ["%Y", function() { return true; }]
                    ]));

        var yAxis = d3.svg.axis().scale(y)
                    .orient("left")
                    .ticks(6);

        if (tickFormat != undefined) {
            yAxis.tickFormat(tickFormat);
        }

        // Define the line
        var valueline = d3.svg.line()
                    .interpolate("monotone")
                    .x(function(v,i) {  return x(data.time[i]); })
                    .y(function(v) {return y(v); });

        // Define the line
        var line = d3.svg.line()
                    .x(function(v) { return v[0]; })
                    .y(function(v) { return v[1]; });

        // Adds the svg canvas
        var svg = d3.select(containerGraph)
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("clipPath")
                    .attr("id", "clip")
                    .append("rect")
                    .attr("width", width)
                    .attr("height", height);

        var desc = d3.select(containerGraph)

        if (updateData) {
            desc.append("div")
                .attr("class", "percentage-chart-label");

            var div = d3.select('.percentage-chart-label');
        
            div.append("p");
        }

        var data;
        var zoom = d3.behavior.zoom();
        var minDate, maxDate;
        var length, maxYValue;

        function updateDomain() {
            minDate = d3.min(data.time);
            maxDate = d3.max(data.time);

            length = data.time.length;      

            maxYValue = 0;
            
            keys.forEach(function(element, i, arr) {
                var maxBalance = d3.max(data[element].balance);
                if (maxBalance > maxYValue) {
                    maxYValue = maxBalance;
                }
            })
            
//            maxYValue = d3.max([d3.max(data.smith_tweets.balance), d3.max(data.corbyn_tweets.balance)]);

            // Scale the range of the data      
            var minDate = new Date(minDate);
            minDate.setDate(minDate.getDate());

            x.domain([minDate, moment(maxDate).add(1, "hours")._d]);      

            y.domain([d3.min([d3.min(data[keys[0]].balance), d3.min(data[keys[1]].balance)]), maxYValue]);
        }
  
  
        function loadGraph() {
            loaded = true;

            updateDomain();
            zoom.x(x);

            var thick = 1;

            if (tickFormat != undefined) {
                svg.append("path")
                    .attr("class", "xaxisbrexit")
                    .style('stroke-width', thick)
                    .attr("d", line([[0,y(50)],[width, y(50)]]));
            }

            svg.append("clipPath")
                .attr("id", "clip-all-brexit")
                .append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height);

            svg.append("path")
                .attr("class", "line-corbyn")
                .attr("clip-path", "url(#clip-all-brexit)")
                .attr("d", valueline(data.corbyn_tweets.balance));

            svg.append("path")
                .attr("class", "line-smith")
                .attr("clip-path", "url(#clip-all-brexit)")
                .attr("d", valueline(data.smith_tweets.balance));

//            var labelElements  = svg.selectAll(".percentage-chart-label").data(labels);
//            var labelGroups = labelElements.enter()
//                        .append("g")
//                        .attr("class", "label-group")
//                        .attr("clip-path", "url(#clip-all-brexit)");
//
//            labelGroups.append("path")
//                .attr("class", "label-left")
//                .attr("clip-path", "url(#clip-all-brexit)")
//                .attr("d", line([[0,0], [0,height]]));
//            labelGroups.append("path")
//                .attr("class", "label-right")
//                .attr("clip-path", "url(#clip-all-brexit)")
//                .attr("d", line([[0,0], [0,height]]));
//            labelGroups.append("path")
//                .attr("class", "brexit-label-bottom")
//                .attr("clip-path", "url(#clip-all-brexit)")
//                .attr("d", line([[0,0], [0,0]]));
//
//            if (updateData) {
//                updateLabels();
//            } 
        
            // Add the X Axis
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            // Add the Y Axis
            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            var focusGroup = svg.append("g");

            var focusLine = focusGroup.append("path")
                .attr("class", "focus-line")
                .attr("d", line([[0,0], [0,height]]));

            var focusCircleRemain = focusGroup.append("g");
            focusCircleRemain.append("circle").attr("r", 3);

            var focusLabelRemain = focusCircleRemain
                .append("text")
                .attr("class", "focus-label-remain")
                .attr("dx", 5)
                .attr("dy",-5)
                .text("");

            var focusCircleLeave = focusGroup.append("g");
            focusCircleLeave.append("circle").attr("r", 3);

            var focusLabelLeave = focusCircleLeave
                .append("text")
                .attr("class", "focus-label-leave")
                .attr("dx", 5)
                .attr("dy",-5)
                .text("");

            svg.append("rect")
                .attr("class", "graph-overlay")
                .attr("width", width)
                .attr("height", height)
                .on("mouseover", function() { focusGroup.style("display", null);})
                .on("mouseout", function() { focusGroup.style("display", "none");})
                .on("mousemove", mousemove)
                .call(zoom.scaleExtent([1, 10]).on("zoom", mousezoom))
                .on("mousewheel.zoom", mousezoom);

            function mousemove() {
                var mouseX = d3.mouse(this)[0]
                var dataX = x.invert(mouseX);
            
                index = 0;
                while (data.time[index] && dataX.getTime() > data.time[index].getTime()) {
                    index ++
                }

                index --;

                if (index < 0 || index > length -1) {
                    focusGroup.style("display", "none");
                } else {
                    focusGroup.style("display", null);
                    var circleX = x(dataX);

                    var compare = data.corbyn_tweets.balance[dataX] > data.smith_tweets.balance[dataX];
                    var topPosition = y(d3.max([d3.max(data.corbyn_tweets.balance), d3.max(data.smith_tweets.balance)]));
                    var bottomPosition = topPosition + 30;

                    var circleYRemain = data.corbyn_tweets.balance[dataX] > data.smith_tweets.balance[dataX] ? topPosition : bottomPosition;
                    var circleYLeave = data.corbyn_tweets.balance[dataX] <= data.smith_tweets.balance[dataX] ? bottomPosition : topPosition;

                    var textLeave = tickFormat != undefined ? tickFormat(Math.round(data.corbyn_tweets.balance[index])) : Math.round(data.corbyn_tweets.balance[index]);
                    focusLabelLeave.text(textLeave);

                    var textRemain = tickFormat != undefined ? tickFormat(Math.round(data.smith_tweets.balance[index])) : Math.round(data.smith_tweets.balance[index]);
                    focusLabelRemain.text(textRemain);

                    focusLine.attr("transform", "translate(" + circleX + ",0)");

                    focusCircleRemain.attr("transform", "translate(" + circleX + "," + circleYRemain  + ")");
                    focusCircleLeave.attr("transform", "translate(" + circleX + "," + circleYLeave  + ")");
                }

//                var activeLabel = labels.filter(function(label) {
//                    return  label.start < dataX && dataX < label.end
//                })[0];
//
//                desc.selectAll("p").text(activeLabel ? activeLabel.title : "");
            }

            function mousezoom(){
                updatePosition();
                redraw();
            }
        }
  
        function updatePosition() {
    
            var minDate = d3.min(data.time);
            var maxDate = d3.max(data.time);


            var length = x(maxDate)-  x(minDate);
            var min = -(length - width);
            //console.log("min", min, length);
            //console.log("currentTranstate", currentTranstate[0])
            var currentTranstate = zoom.translate();

            if (currentTranstate[0] > 0) {
                zoom.translate([0, currentTranstate[1]]);
            }


            if (currentTranstate[0] < min) {
                zoom.translate([min, currentTranstate[1]]);
            }    
        }
  
        function indexOfDate(myArray, searchDate) {
            for(var i = 0, len = myArray.length; i < len; i++) {
                if (myArray[i].toString() === searchDate.toString()) return i;
            }
            return -1;
        }

        function redraw() {
    
            // Add the valueline path.
            svg.select(".line-leave").attr("d", valueline(data.corbyn_tweets.balance));
            svg.select(".line-remain").attr("d", valueline(data.smith_tweets.balance));

            // Add the Y Axis
            svg.select(".y.axis").call(yAxis);
            svg.select(".x.axis").call(xAxis);

            if (updateData) {
                updateLabels();
            }
        }

        function getDateX(date) {
            return x(date);
        }

        function updateLabels() {
            labelElements.selectAll(".label-left")
                .attr("d", function(data) {
                    var start = getDateX(data.start);
                    return line([[start,0], [start,height-4]])
                });

            labelElements.selectAll(".label-right")
                .attr("d", function(data){
                    var start = getDateX(data.end);
                    return line([[start,0], [start,height-4]])
                });

            labelElements.selectAll(".brexit-label-bottom")
                .attr("d", function(data){
                    return line([[getDateX(data.start),height-4], [ getDateX(data.end),height-4]])
                });
        }

        loadPastData();
        function loadPastData() {
//            jsonWithRetry("http://tory-race.cf.skyscapecloud.com/tory", 0, function(json) {
            jsonWithRetry("http://37.26.94.90/response.json", 0, function(json) {
                console.log("Fetching data");
                data = json;
                
                console.log(data)
                
                // use the first time array as the base for the whole graph
                keys = Object.keys(data)
                data.time = data[keys[0]].time
                
                updateDataSet(data);

                if (updateData) {
                    updateData(data); 

                    var resultsIndex =  indexOfDate(data.time, new Date(2016, 5, 23, 1, 0, 0, 0));
                    createSlider(resultsIndex);
                }

                loadGraph();

                if (!updateData) {
                    rawData = data;        
                }
            });
        }
  
        function updateDataSet(data) {
            data.time.forEach(function(element, i, arr) {
                    arr[i] = moment(element).add(1, 'hours')._d; // convert from UTC - to UK summer + hour interval start -> interval end    
                });
        }
    }

    function updateToPercentage(data) {
        for (i = 0; i < data.corbyn_tweets.balance.length; i++) {
            data.corbyn_tweets.balance[i] = 100 * data.corbyn_tweets.balance[i] / (data.corbyn_tweets.balance[i] + data.smith_tweets.balance[i]);
            data.smith_tweets.balance[i] = 100 - data.corbyn_tweets.balance[i];
        }
    }
    
})();
