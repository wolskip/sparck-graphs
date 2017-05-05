(function() {
  var containerGraph1 = '.count-chart';
  var containerGraph2 = '.percentage-chart';
  var labels = [];


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
      }
      // load();
    success();
  }

  drawGraph(containerGraph1);
  drawGraph(containerGraph2, updateToPercentage, function(n) {
    return n + "%";
  });

  var rawData;

  function drawGraph(containerGraph, updateData, tickFormat) {
    var start = new Date(2016, 5, 15, 0, 0, 0, 0);
    var end = new Date(2016, 5, 25, 1, 0, 0, 0);

    var loaded;

    // Set the dimensions of the canvas / graph
    var margin = {
        top: 30,
        right: 20,
        bottom: 30,
        left: 55
      },
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
        [".%L", function(d) {
          return d.getMilliseconds();
        }],
        [":%S", function(d) {
          return d.getSeconds();
        }],
        ["%_H:%M", function(d) {
          return d.getMinutes();
        }],
        ["%_H:00", function(d) {
          return d.getHours();
        }],
        ["%a %d", function(d) {
          return d.getDay() && d.getDate() != 1;
        }],
        ["%b %d", function(d) {
          return d.getDate() != 1;
        }],
        ["%B", function(d) {
          return d.getMonth();
        }],
        ["%Y", function() {
          return true;
        }]
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
      .x(function(v, i) {
        return x(data.time[i]);
      })
      .y(function(v) {
        return y(v);
      });

    // Define the line
    var line = d3.svg.line()
      .x(function(v) {
        return v[0];
      })
      .y(function(v) {
        return v[1];
      });

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
        .attr("class", "percentage-chart-label")

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

      maxYValue = d3.max([d3.max(data.labour), d3.max(data.tory), d3.max(data
        .libDem), d3.max(data.snp)]);

      // Scale the range of the data
      var minDate = new Date(minDate);
      minDate.setDate(minDate.getDate());

      x.domain([minDate, moment(maxDate).add(1, "hours")._d]);

      y.domain([d3.min([d3.min(data.labour), d3.min(data.tory), d3.min(data.libDem),
        d3.min(data.snp)
      ]), maxYValue]);
    }


    function loadGraph() {
      loaded = true;

      updateDomain();
      zoom.x(x);

      var thick = 1;

      if (tickFormat != undefined) {
        svg.append("path")
          .attr("class", "x-axis-election-2017")
          .style('stroke-width', thick)
          .attr("d", line([
            [0, y(50)],
            [width, y(50)]
          ]));
      }

      svg.append("clipPath")
        .attr("id", "clip-all-election-2017")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

      svg.append("path")
        .attr("class", "line-labour")
        .attr("clip-path", "url(#clip-all-election-2017)")
        .attr("d", valueline(data.labour));

      svg.append("path")
        .attr("class", "line-tory")
        .attr("clip-path", "url(#clip-all-election-2017)")
        .attr("d", valueline(data.tory));


      svg.append("path")
        .attr("class", "line-libDem")
        .attr("clip-path", "url(#clip-all-election-2017)")
        .attr("d", valueline(data.libDem));

      svg.append("path")
        .attr("class", "line-snp")
        .attr("clip-path", "url(#clip-all-election-2017)")
        .attr("d", valueline(data.snp));

      labelElements = svg.selectAll(".percentage-chart-label").data(labels);
      var labelGroups = labelElements.enter()
        .append("g")
        .attr("class", "label-group")
        .attr("clip-path", "url(#clip-all-election-2017)");

      labelGroups.append("path")
        .attr("class", "label-left")
        .attr("clip-path", "url(#clip-all-election-2017)")
        .attr("d", line([
          [0, 0],
          [0, height]
        ]));
      labelGroups.append("path")
        .attr("class", "label-right")
        .attr("clip-path", "url(#clip-all-election-2017)")
        .attr("d", line([
          [0, 0],
          [0, height]
        ]));
      labelGroups.append("path")
        .attr("class", "election-2017-label-bottom")
        .attr("clip-path", "url(#clip-all-election-2017)")
        .attr("d", line([
          [0, 0],
          [0, 0]
        ]));

      if (updateData) {
        updateLabels();
      }

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
        .attr("d", line([
          [0, 0],
          [0, height]
        ]));

      var focusCircleLabour = focusGroup.append("g");
      focusCircleLabour.append("circle").attr("r", 3);

      var focusLabelLabour = focusCircleLabour
        .append("text")
        .attr("class", "focus-label-labour")
        .attr("dx", 5)
        .attr("dy", -5)
        .text("");


      var focusCircleTory = focusGroup.append("g");
      focusCircleTory.append("circle").attr("r", 3);

      var focusLabelTory = focusCircleTory
        .append("text")
        .attr("class", "focus-label-tory")
        .attr("dx", 5)
        .attr("dy", -5)
        .text("");


      var focusCircleLibDem = focusGroup.append("g");
      focusCircleLibDem.append("circle").attr("r", 3);

      var focusLabelLibDem = focusCircleLibDem
        .append("text")
        .attr("class", "focus-label-libDem")
        .attr("dx", 5)
        .attr("dy", -5)
        .text("");


      var focusCircleSNP = focusGroup.append("g");
      focusCircleSNP.append("circle").attr("r", 3);

      var focusLabelSNP = focusCircleSNP
        .append("text")
        .attr("class", "focus-label-snp")
        .attr("dx", 5)
        .attr("dy", -5)
        .text("");

      svg.append("rect")
        .attr("class", "graph-overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() {
          focusGroup.style("display", null);
        })
        .on("mouseout", function() {
          focusGroup.style("display", "none");
        })
        .on("mousemove", mousemove)
        .call(zoom.scaleExtent([1, 10]).on("zoom", mousezoom))
        .on("mousewheel.zoom", mousezoom);

      function mousemove() {

        var mouseX = d3.mouse(this)[0]
        var dataX = x.invert(mouseX);


        index = 0;
        while (data.time[index] && dataX.getTime() > data.time[index].getTime()) {
          index++
        }
        index--;

        if (index < 0 || index > length - 1) {
          focusGroup.style("display", "none");
        } else {
          focusGroup.style("display", null);
          var circleX = x(dataX);

          // var parties = [
          //   {name:'labour', value: data.labour[dataX]},
          //   {name:'tory', value: data.tory[dataX]},
          //   {name:'libDem', value: data.libDem[dataX]},
          //   {name:'snp', value: data.snp[dataX]}
          // ];
          // parties.sort(function(a,b){
          //   return a.
          // })
          // TODO: Order labels by number of tweets
          // var compare = x[dataX] > data.remain[dataX];
          // var topPosition = y(d3.max([d3.max(data.leave), d3.max(data.remain)]));
          // var bottomPosition = topPosition + 30;
          //
          // var circleYRemain = data.leave[dataX] > data.remain[dataX] ?
          //   topPosition : bottomPosition;
          // var circleYLeave = data.leave[dataX] <= data.remain[dataX] ?
          //   bottomPosition : topPosition;

          // var textLeave = tickFormat != undefined ? tickFormat(Math.round(
          //   data.leave[index])) : Math.round(data.leave[index]);
          // focusLabelLeave.text(textLeave);
          //
          // var textRemain = tickFormat != undefined ? tickFormat(Math.round(
          //   data.remain[index])) : Math.round(data.remain[index]);
          // focusLabelRemain.text(textRemain);

          var textLabour = tickFormat != undefined ? tickFormat(Math.round(
            data.labour[index])) : Math.round(data.labour[index]);
          focusLabelLabour.text(textLabour);

          var textTory = tickFormat != undefined ? tickFormat(Math.round(
            data.tory[index])) : Math.round(data.tory[index]);
          focusLabelTory.text(textTory);

          var textLibDem = tickFormat != undefined ? tickFormat(Math.round(
            data.libDem[index])) : Math.round(data.libDem[index]);
          focusLabelLibDem.text(textLibDem);

          var textSNP = tickFormat != undefined ? tickFormat(Math.round(
            data.snp[index])) : Math.round(data.snp[index]);
          focusLabelSNP.text(textSNP);

          focusLine.attr("transform", "translate(" + circleX + ",0)");

          focusCircleLabour.attr("transform", "translate(" + circleX + ",0)")
            .attr("cy", data.labour[index]);
          focusCircleTory.attr("transform", "translate(" + circleX + ",0)");
          focusCircleLibDem.attr("transform", "translate(" + circleX + ",0)");
          focusCircleSNP.attr("transform", "translate(" + circleX + ",0)");
        }

        var activeLabel = labels.filter(function(label) {
          return label.start < dataX && dataX < label.end
        })[0];

        desc.selectAll("p").text(activeLabel ? activeLabel.title : "");
      }

      function mousezoom() {
        updatePosition();
        redraw();
      }

    }

    function updatePosition() {

      var minDate = d3.min(data.time);
      var maxDate = d3.max(data.time);


      var length = x(maxDate) - x(minDate);
      var min = -(length - width);
      //console.log("min",min, length);
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
      for (var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i].toString() === searchDate.toString()) return i;
      }
      return -1;
    }

    function redraw() {

      // Add the valueline path.
      svg.select(".line-labour").attr("d", valueline(data.labour));
      svg.select(".line-tory").attr("d", valueline(data.tory));
      svg.select(".line-libDem").attr("d", valueline(data.libDem));
      svg.select(".line-snp").attr("d", valueline(data.snp));

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
          return line([
            [start, 0],
            [start, height - 4]
          ])
        });

      labelElements.selectAll(".label-right")
        .attr("d", function(data) {
          var start = getDateX(data.end);
          return line([
            [start, 0],
            [start, height - 4]
          ])
        });

      labelElements.selectAll(".election-2017-label-bottom")
        .attr("d", function(data) {
          return line([
            [getDateX(data.start), height - 4],
            [getDateX(data.end), height - 4]
          ])
        });
    }

    loadPastData();

    function loadPastData() {
      jsonWithRetry(
        "https://ps4ez07vul.execute-api.eu-west-1.amazonaws.com/v1/election-2017/static-graph-data",
        3,
        function(json) {

          // data = json;
          data = {
            "labour": [1221.0, 724.0, 593.0, 499.0, 934.0, 2229.0, 3645.0,
              4521.0, 4755.0
            ],
            "tory": [682.0, 352.0, 328.0, 299.0, 448.0, 983.0, 2203.0,
              3039.0, 2795.0
            ],
            "libDem": [100, 200, 300, 400, 500, 600, 700, 800, 900],
            "snp": [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500, 0],
            "time": ["2016-06-15 00:00:00", "2016-06-15 01:00:00",
              "2016-06-15 02:00:00",
              "2016-06-15 03:00:00", "2016-06-15 04:00:00",
              "2016-06-15 05:00:00",
              "2016-06-15 06:00:00", "2016-06-15 07:00:00",
              "2016-06-15 08:00:00"
            ]
          };


          updateDataSet(data);
          if (updateData) {
            updateData(data);

            var resultsIndex = indexOfDate(data.time, new Date(2016, 5, 23,
              1, 0, 0, 0));
          }

          loadGraph();

          if (!updateData) {
            rawData = data;
          }
        });
    }

    function updateDataSet() {
      data.time.forEach(function(element, i, arr) {
        arr[i] = moment(element).add(1, 'hours')._d; // convert from UTC - to UK summer + hour interval start -> interval end
      });
    }
  }

  function updateToPercentage(data) {
    for (i = 0; i < data.labour.length; i++) {
      var total = data.labour[i] + data.tory[i] + data.libDem[i] + data.tory[i];
      data.labour[i] = 100 * data.labour[i] / total;
      data.tory[i] = 100 * data.tory[i] / total;
      data.libDem[i] = 100 * data.libDem[i] / total;
      data.snp[i] = 100 * data.snp[i] / total;
    }
  }

})();
