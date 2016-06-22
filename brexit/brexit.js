(function(){
  var containerGraph1 = '.count-chart';
  var containerGraph2 = '.percentage-chart';
  var labels = [
  ];

  function jsonWithRetry(url, retries, success){
    var load = function(){
      d3.json(url, function(error, json) {
        error = error || json.errorMessage;
        retries--;
        if(error){
          console.log(error);
          if(retries > 0){
            load();
          }
        }else {
          success(json);
        }
      });
    }
    load();
  }

drawGraph(containerGraph1);
drawGraph(containerGraph2, updateToPercentage, function(n){ return n + "%"; });


var rawData;



function drawGraph(containerGraph, updateData, tickFormat)
{
  var loaded;

  // Set the dimensions of the canvas / graph
  var margin = {top: 30, right: 20, bottom: 30, left: 55},
      width = 700 - margin.left - margin.right,
      height = 370 - margin.top - margin.bottom;

  // Set the ranges
  var x = d3.time.scale().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var labelElements;

  // Define the axes
  var xAxis = d3.svg.axis().scale(x)
                  .orient("bottom");

  var yAxis = d3.svg.axis().scale(y)
              .orient("left")
              .ticks(6);

    if (tickFormat != undefined)
    {
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


  var desc = d3.select(containerGraph);
  // .append("div")
  //   .attr("class", "graph-description");
  //
  //   desc.append("h4");
  //   desc.append("p");

  var data;
  var zoom = d3.behavior.zoom();
  var maxDate, minDate;

  function loadGraph()
  {
      loaded = true;

      maxDate = d3.min(data.time);
      minDate = d3.max(data.time);

      var length = data.time.length;

      // Scale the range of the data
      x.domain([maxDate, minDate]);
      y.domain([d3.min([d3.min(data.remain), d3.min(data.leave)]) - 4, d3.max([d3.max(data.remain), d3.max(data.leave)]) + 4]);

      zoom.x(x);

      var thick = 1;

        if (tickFormat != undefined)
        {
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
              .attr("class", "line-remain")
              .attr("clip-path", "url(#clip-all-brexit)")
              .attr("d", valueline(data.remain));

        svg.append("path")
              .attr("class", "line-leave")
              .attr("clip-path", "url(#clip-all-brexit)")
              .attr("d", valueline(data.leave));

        // labelElements  = svg.selectAll(".graph-label").data(labels);
        // var labelGroups = labelElements.enter()
        //   .append("g")
        //     .attr("class", "label-group")
        //     .attr("clip-path", "url(#clip-all-brexit)");

        // labelGroups.append("path")
        //       .attr("class", "label-left")
        //       .attr("clip-path", "url(#clip-all-brexit)")
        //       .attr("d", line([[0,0], [0,height]]));
        // labelGroups.append("path")
        //       .attr("class", "label-right")
        //       .attr("clip-path", "url(#clip-all-brexit)")
        //       .attr("d", line([[0,0], [0,height]]));
        // labelGroups.append("path")
        //       .attr("class", "label-bottom")
        //       .attr("clip-path", "url(#clip-all-brexit)")
        //       .attr("d", line([[0,0], [0,0]]));

        //updateLabels();

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

       var focusCircle = focusGroup.append("g");
       focusCircle.append("circle").attr("r", 3);

       var focusLabel = focusCircle
        .append("text")
        .attr("dx", 5)
        .attr("dy",-5)
        .text("");

        var focusLabelTime = focusCircle
         .append("text")
         .style("stroke", "#999")
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
           .call(zoom.scaleExtent([1, 8]).on("zoom", mousezoom))
           .on("mousewheel.zoom", mousezoom);

         function mousemove() {

            var mouseX = d3.mouse(this)[0]
            var dataX = x.invert(mouseX);

        //    if(!data.balance[dataX]){
        //      focusGroup.style("display", "none");
        //    } else {
        //      focusGroup.style("display", null);
        //      var circleX = x(dataX);
        //      var circleY = y(data.balance[dataX] || 0)
        //      focusLabel.text(Math.round(data.balance[dataX]) + " %")
        //      focusLine.attr("transform", "translate(" + circleX + ",0)");
        //      focusCircle.attr("transform", "translate(" + circleX + "," + circleY + ")");
        //    }

            var activeLabel = labels.filter(function(label){
              return  label.start < dataX && dataX < label.end
            })[0];

            desc.selectAll("h4").text(activeLabel ? activeLabel.title : "");
            desc.selectAll("p").text(activeLabel? activeLabel.text : "");
         }

         function mousezoom(){

            var currentTranstate = zoom.translate();

            var length = x(minDate)-  x(maxDate);
            var min = -(length - width);
            //console.log("min",min, length);
            //console.log("currentTranstate", currentTranstate[0])

            if(currentTranstate[0] > 0){
              zoom.translate([0, currentTranstate[1]]);
            }

            if(currentTranstate[0] < min){
                zoom.translate([min, currentTranstate[1]]);
            }
            redraw();
         }
  }

  function redraw(){
    //var svg = d3.select(containerGraph).transition();

    // Add the valueline path.
    svg.select(".line-leave").attr("d", valueline(data.leave));
    svg.select(".line-remain").attr("d", valueline(data.remain));

    // Add the Y Axis
    svg.select(".y.axis").call(yAxis);
    svg.select(".x.axis").call(xAxis);

    //updateLabels();
  }

  function getDateX(date){
     return x(date);
  }

  function updateLabels(){

     labelElements.selectAll(".label-left")
       .attr("d", function(data){
          var start = getDateX(data.start);
          return line([[start,0], [start,height-4]])
       });

     labelElements.selectAll(".label-right")
       .attr("d", function(data){
          var start = getDateX(data.end);
          return line([[start,0], [start,height-4]])
       });

     labelElements.selectAll(".label-bottom")
       .attr("d", function(data){
         return line([[getDateX(data.start),height-4], [ getDateX(data.end),height-4]])
       });
  }

  loadPastData();
  function loadPastData()
  {
      jsonWithRetry("https://ps4ez07vul.execute-api.eu-west-1.amazonaws.com/v1/brexit/graph", 3, function(json) {
          data = json;

          if (updateData != undefined)
          {
            updateData(data);
          }
          parseTimeValues(data);

          // todo change - super dirty caches first graf data load...
          if(!updateData){
            rawData = data;
            createSlider();
          }

          // todo: update will break it :)
          if(loaded) {
            redraw()
          } else {
            loadGraph();
          }
      });
  }

  //setInterval(loadPastData, 1800000);

  function parseTimeValues()
  {
      data.time.forEach(function(element, i, arr) {
          arr[i] = moment(element)._d;
      });
  }
}

function updateToPercentage(data)
{
    for(i=0; i< data.leave.length; i++)
    {
          data.leave[i] = 100 * data.leave[i] / (data.leave[i] + data.remain[i]);
          data.remain[i] = 100 - data.leave[i];
    }
}


function createSlider(){

   var remain = rawData.remain[rawData.remain.length - 1];
   var leave = rawData.leave[rawData.leave.length - 1];

   var remainP = remain / (remain + leave) * 100;

   var container = d3.select('.slider-chart');
   var slider = container.append('div')
      .attr('class', 'slider')

  slider.append('div')
      .attr('class', 'slider-remain')
      .style('width', remainP + '%')
}













})();
