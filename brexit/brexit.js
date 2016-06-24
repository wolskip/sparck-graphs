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
  var minDate, maxDate;
  var length, maxYValue;

  function updateDomain()
  {
      minDate = d3.min(data.time);
      maxDate = d3.max(data.time);
      
      length = data.time.length;      
      
      maxYValue = d3.max([d3.max(data.remain), d3.max(data.leave)]);

      // Scale the range of the data      
      var minDate = new Date(maxDate);
      minDate.setDate(minDate.getDate() - 3);
      
      x.domain([minDate, moment(maxDate).add(1, "hours")._d]);      
      
      y.domain([d3.min([d3.min(data.remain), d3.min(data.leave)]) - 4, maxYValue + 4]);
  }
  
  
  function loadGraph()
  {
      loaded = true;
     
      updateDomain();
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
           .call(zoom.scaleExtent([0.2, 10]).on("zoom", mousezoom))
           .on("mousewheel.zoom", mousezoom);

         function mousemove() {

            var mouseX = d3.mouse(this)[0]
            var dataX = x.invert(mouseX);
            
            
            index = 0;
            while(data.time[index] && dataX.getTime() > data.time[index].getTime()){
              index ++
            } 
            //index --;
            
           if(index < 0 || index > length -1){
             focusGroup.style("display", "none");
           } else {
             focusGroup.style("display", null);
             var circleX = x(dataX);
             
             var compare = data.leave[dataX] > data.remain[dataX];
             var topPosition = y(d3.max([d3.max(data.leave), d3.max(data.remain)]));
             var bottomPosition = topPosition + 30;
             
             var circleYRemain = data.leave[dataX] > data.remain[dataX] ? topPosition : bottomPosition;
             var circleYLeave = data.leave[dataX] <= data.remain[dataX] ? bottomPosition : topPosition;
             
             var textLeave = tickFormat != undefined ? tickFormat(Math.round(data.leave[index])) : Math.round(data.leave[index]);
             focusLabelLeave.text(textLeave);
             
             var textRemain = tickFormat != undefined ? tickFormat(Math.round(data.remain[index])) : Math.round(data.remain[index]);
             focusLabelRemain.text(textRemain);
             
             focusLine.attr("transform", "translate(" + circleX + ",0)");
             
             focusCircleRemain.attr("transform", "translate(" + circleX + "," + circleYRemain  + ")");
             focusCircleLeave.attr("transform", "translate(" + circleX + "," + circleYLeave  + ")");
           }

            // var activeLabel = labels.filter(function(label){
            //   return  label.start < dataX && dataX < label.end
            // })[0];

            // desc.selectAll("h4").text(activeLabel ? activeLabel.title : "");
            // desc.selectAll("p").text(activeLabel? activeLabel.text : "");
         }

         function mousezoom(){
            updatePosition();
            redraw();
         }          
         
  }
  
  function updatePosition(){
    
    minDate = d3.min(data.time);
    maxDate = d3.max(data.time);
    
    var minDate = new Date(maxDate);
    minDate.setDate(minDate.getDate() - 3);
    
    var currentTranstate = zoom.translate();

    var length = x(maxDate)-  x(minDate);
    var min = -(length - width);
    //console.log("min",min, length);
    //console.log("currentTranstate", currentTranstate[0])

    // if(currentTranstate[0] > 0){
    //   zoom.translate([0, currentTranstate[1]]);
    // }

    //if(currentTranstate[0] < min){
    zoom.translate([min, currentTranstate[1]]);
  }
  
  function indexOfDate(myArray, searchDate) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i].toString() === searchDate.toString()) return i;
    }
    return -1;
  }

  function redraw(){
    
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
      jsonWithRetry("https://ps4ez07vul.execute-api.eu-west-1.amazonaws.com/v1/brexit/graph2", 3, function(json) {
          
          data = json;
         
          parseTimeValues(data);
          if (updateData)
          {
            updateData(data);
             
          }


          loadGraph();
          
          if(!updateData){
            rawData = data;
            createSlider(false);
          }
      });
  }
  
  function loadCurrentData()
  {
      jsonWithRetry("https://ps4ez07vul.execute-api.eu-west-1.amazonaws.com/v1/brexit/graph-latest", 3, function(json) {
          
          if (updateData)
          {
            updateData(json);
            //json.remain *= 12;
            //json.leave *= 12;
          }
          
          var newDate = moment(json.time[0]).add(1, 'hours')._d;
          
          if (newDate.getTime() !== data.time[length -1].getTime())
          {
             data.time.push(newDate);
             data.leave.push(data.leave[length -1]);
             data.remain.push(data.remain[length -1]);             
          }
                 
            d3.select(containerGraph1).transition();
            d3.select(containerGraph2).transition();
            
            //updateDomain();
            
            updatePosition();
            redraw()
            
            if (!updateData)
            {
              createSlider(true);
            }           
      });
  }

  setInterval(loadCurrentData, 60000);  
  
  function parseTimeValues()
  {
     var midnight = new Date(2016, 5, 23, 0, 0, 0, 0);
      data.time.forEach(function(element, i, arr) {
          arr[i] = moment(element).add(1, 'hours')._d; // convert from UTC - to UK summer + hour interval start -> interval end
          // if(arr[i] >= midnight){
          //   data.remain[i] *= 12;
          //   data.leave[i] *= 12;
          // }
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


function createSlider(updateOnly){

   var remain = rawData.remain[rawData.remain.length - 1];
   var leave = rawData.leave[rawData.leave.length - 1];

   var remainP = Math.round(remain / (remain + leave) * 100);
   var leaveP =  Math.round(leave / (remain + leave) * 100);

    if (updateOnly === false)
    {
      var container = d3.select('.slider-chart');
      var slider = container.append('div')
          .attr('class', 'slider')

      slider.append('div')
          .attr('class', 'slider-remain')
          .style('width', remainP + '%')
          .text(remainP + '%')

      slider.append('div')
          .attr('class', 'slider-leave')
          .style('width', leaveP + '%')
          .text(leaveP + '%')

      container.append('div')
        .attr('class', 'slider-time')
        .text(moment(rawData.time[rawData.time.length -1]).add(5, 'minutes').format('MMMM Do YYYY, H:mm'))
    }
    else
    {
      d3.select('.slider-remain')
        .style('width', remainP + '%')
        .text(remainP + '%');
      
      d3.select('.slider-leave')
        .style('width', leaveP + '%')
        .text(leaveP + '%');
        
        d3.select('.slider-time')
         .text(moment(rawData.time[rawData.time.length -1]).add(5, 'minutes').format('MMMM Do YYYY, H:mm'))
    }
}
})();
