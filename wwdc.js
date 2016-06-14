(function(){
  var containerGraph = '.chart-graph';
  var labels = [
    {
      "start": "2016-06-13 17:45",
      "end": "2016-06-13 17:55",
      "title": "Expectations were high, but sentiment dropped after the event started.",
      "text": "Right up until 6PM, a significant positive spike in the way people were talking about WWDC was apparent. There was a real sense of excitement, largely provoked by months of rumours about what was about to drop. However, when the event started, sentiment peaked, and took a steady decline right up until it moved into MacOS and iOS territory. "
    },
    {
      "start": "2016-06-13 18:27",
      "end": "2016-06-13 18:36",
      "title": "TVOS just didn’t go down well.",
      "text": "This whole section of the Keynote fared pretty badly: Twitter was alive with tweets describing the presenter as patronising and boring, and the new features as deeply uninspiring."
    },
    {
      "start": "2016-06-13 18:42",
      "end": "2016-06-13 19:7",
      "title": "iOS was the most popular updates. ",
      "text": "This should come as no surprise, but people found the iOS section of the Keynote the most engaging. Pundits were overjoyed to hear about new emoji and updates to Apple Music - but it was clear from both the audience reaction and SPARCK analysis that developers being asked to ‘rap along to their favourite tunes’ was an unpopular request."
    },
    {
      "start": "2016-06-13 19:15",
      "end": "2016-06-13 19:23",
      "title": "HomeKit, Messages and new features in the Phone app went down a treat.",
      "text": "New features in iOS let you see who’s at your door intercom from your phone, see your voicemail messages as text, and a whole host of new messaging features such as emoji, live backgrounds and stickers were really well received."
    },
    {
      "start": "2016-06-13 19:38",
      "end": "2016-06-13 20:20",
      "title": "Kids learning to code was popular amongst the developer community. ",
      "text": "Apple's announcement to offer a free learning tool for kids to learn their programming language, Swift, could have been met with some cynicism. However, SPARCK analysis shows that this news was warmly welcomed."
    }
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

  // Set the dimensions of the canvas / graph
  var margin = {top: 30, right: 20, bottom: 30, left: 50},
      width = 900 - margin.left - margin.right,
      height = 370 - margin.top - margin.bottom;

  // Set the ranges
  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var timeToX = d3.time.scale()
    .range([0, 960])
    .domain([new Date(2016, 5, 13, 17, 0, 0, 0), new Date(2016, 5, 13, 21, 0, 0, 0)])


  var xTime = d3.time.scale().range([0, width]);
  var now;
  var labelElements;

  function updateTimeDomain(){
    var max = now;

    var xDomain = x.domain()
    xTime.domain([timeToX.invert(xDomain[0]),timeToX.invert(xDomain[1])]);
  }

  // Define the axes
  var xAxis = d3.svg.axis().scale(xTime)
                  .orient("bottom")
                  .tickFormat(d3.time.format("%H:%M"));

  var yAxis = d3.svg.axis().scale(y)
              .orient("left").ticks(5)
              .tickFormat(function(n){
                  return n + "%";
              });

  // Define the lin
  var valueline = d3.svg.line()
      .interpolate("monotone")
      .x(function(v,i) { return x(i); })
      .y(function(v) { return y(v); });

  var _movingSum;
  var valuelineaverage = d3.svg.line()
          .interpolate("basic")
          .x(function(v,i) { return x(i); })
          .y(function(v,i) {

            var range = 8;

            var values = data.balance.slice(Math.max(0, i - range), Math.min( data.balance.length-1, i + range) )
            var average = d3.mean(values);

            return y(average);
          });

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

  var desc = d3.select(containerGraph).append("div")
    .attr("class", "graph-description");

    desc.append("h4");
    desc.append("p");


  var data;
  var zoom = d3.behavior.zoom();

  function loadGraph()
  {
       while(data.balance.length < 480){
          data.balance.unshift(0);
      }

      // Scale the range of the data
      x.domain([0,480]);
      updateTimeDomain();
      y.domain([d3.min(data.balance), d3.max(data.balance)]);

      zoom.x(x);


      var thick = 1;
      svg.append("path")
          .attr("class", "xaxis")
          .style('stroke-width', thick)
          .attr("d", line([[x(0),y(0)],[x(480), y(0)]]));

      svg.append("clipPath")
          .attr("id", "clip-positive")
          .append("rect")
          .attr("x", x(0))
          .attr("y", 0)
          .attr("width", x(480) - x(0))
          .attr("height", y(0));

        svg.append("clipPath")
          .attr("id", "clip-negative")
          .append("rect")
          .attr("x", x(0))
          .attr("y", y(0))
          .attr("width", x(480) - x(0))
          .attr("height", Math.max(0, height - y(0)));

          svg.append("clipPath")
              .attr("id", "clip-all")
              .append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", width)
              .attr("height", height);

        svg.append("path")
              .attr("class", "line-vals")
              .attr("clip-path", "url(#clip-positive)")
              .attr("d", valueline(data.balance));

        svg.append("path")
              .attr("class", "line-vals-negative")
              .attr("clip-path", "url(#clip-negative)")
              .attr("d", valueline(data.balance));

        svg.append("path")
              .attr("class", "line-vals-average")
              .attr("clip-path", "url(#clip-all)")
              .attr("d", valuelineaverage(data.balance));


        labelElements  = svg.selectAll(".graph-label").data(labels);
        var labelGroups = labelElements.enter()
          .append("g")
            .attr("class", "label-group")
            .attr("clip-path", "url(#clip-all)");

        labelGroups.append("path")
              .attr("class", "label-left")
              .attr("clip-path", "url(#clip-all)")
              .attr("d", line([[0,0], [0,height]]));
        labelGroups.append("path")
              .attr("class", "label-right")
              .attr("clip-path", "url(#clip-all)")
              .attr("d", line([[0,0], [0,height]]));
        labelGroups.append("path")
              .attr("class", "label-bottom")
              .attr("clip-path", "url(#clip-all)")
              .attr("d", line([[0,0], [0,0]]));


        updateLabels();


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
           .call(zoom.scaleExtent([.5, 8]).on("zoom", mousezoom))
           .on("mousewheel.zoom", mousezoom);

         function mousemove() {

           var mouseX = d3.mouse(this)[0]
           var dataX = Math.round(x.invert(mouseX))

           if(!data.balance[dataX]){
             focusGroup.style("display", "none");
           } else {
             focusGroup.style("display", null);
             var circleX = x(dataX);
             var circleY = y(data.balance[dataX] || 0)
             focusLabel.text(Math.round(data.balance[dataX]) + " %")
             focusLine.attr("transform", "translate(" + circleX + ",0)");
             focusCircle.attr("transform", "translate(" + circleX + "," + circleY + ")");
           }

            var activeLabel = labels.filter(function(label){
              var start = getDateX(label.start);
              var end = getDateX(label.end);
              return  start < circleX && circleX < end
            })[0];

            desc.selectAll("h4").text(activeLabel ? activeLabel.title : "");
            desc.selectAll("p").text(activeLabel? activeLabel.text : "");
         }

         function mousezoom(){

            var currentTranstate = zoom.translate();
            var min = -(x(960) - x(0) - width);

            if(currentTranstate[0] > 0){
              zoom.translate([0, currentTranstate[1]]);
            }
            if(currentTranstate[0] < min){
              zoom.translate([min, currentTranstate[1]]);
            }
            updateTimeDomain();
             redraw();
             console.log(zoom.scale(), zoom.translate(), min);
         }
  }


  function redraw(){
    //var svg = d3.select(containerGraph).transition();

    // Add the valueline path.
    //vg.select(".line-total").attr("d", valueline(data.total));
    svg.select(".line-vals").attr("d", valueline(data.balance));
    svg.select(".line-vals-negative").attr("d", valueline(data.balance));
    svg.select(".line-vals-average").attr("d", valuelineaverage(data.balance));

    // Add the Y Axis
    svg.select(".y.axis").call(yAxis);
    svg.select(".x.axis").call(xAxis);

    updateLabels();
  }

  function getDateX(date){
     var offset = timeToX(new Date(date));
     return x(offset);
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
      jsonWithRetry("https://ps4ez07vul.execute-api.eu-west-1.amazonaws.com/test/tweets/keynote", 3, function(json) {
          data = json;
          loadGraph();
      });
  }

})();
