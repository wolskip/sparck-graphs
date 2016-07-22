var customMultiDateFormat = d3.time.format.multi([
    [".%L", function (d) { return d.getMilliseconds(); }],
    [":%S", function (d) { return d.getSeconds(); }],
    ["%_H:%M", function (d) { return d.getMinutes(); }],
    ["%_H:00", function (d) { return d.getHours(); }],
    ["%a %d", function (d) { return d.getDay() && d.getDate() != 1; }],
    ["%b %d", function (d) { return d.getDate() != 1; }],
    ["%B", function (d) { return d.getMonth(); }],
    ["%Y", function () { return true; }]
]);
function jsonWithRetry(url, retries, success) {
    var load = function () {
        d3.json(url, function (error, json) {
            error = error || json.errorMessage;
            retries--;
            if (error) {
                console.log(error);
                if (retries > 0) {
                    load();
                }
            }
            else {
                success(json);
            }
        });
    };
    load();
}
var TimeGraph = (function () {
    function TimeGraph(elementSelector, lines) {
        var _this = this;
        this.elementSelector = elementSelector;
        this.lines = lines;
        this.id = (Math.random() * 1e16).toFixed(0) + "";
        this.x = d3.time.scale();
        this.y = d3.scale.linear();
        this.xAxis = d3.svg.axis().scale(this.x);
        this.yAxis = d3.svg.axis().scale(this.y);
        this.zoom = d3.behavior.zoom();
        this.valueline = d3.svg.line()
            .interpolate("monotone")
            .x(function (v) { return _this.x(v.date); })
            .y(function (v) { return _this.y(v.value); });
        this.render();
    }
    TimeGraph.prototype.render = function () {
        this.updateDomain();
        var margin = { top: 30, right: 20, bottom: 30, left: 55 };
        var margin = { top: 30, right: 20, bottom: 30, left: 55 };
        this.width = 700 - margin.left - margin.right;
        this.height = 370 - margin.top - margin.bottom;
        this.x.range([0, this.width]);
        this.y.range([this.height, 0]);
        this.zoom
            .x(this.x);
        this.xAxis
            .orient("bottom")
            .tickFormat(customMultiDateFormat);
        this.yAxis
            .orient("left")
            .ticks(6);
        this.svg = d3.select(this.elementSelector)
            .append("svg")
            .attr("width", this.width + margin.left + margin.right)
            .attr("height", this.height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        this.svg.append("clipPath")
            .attr("id", "clip" + this.id)
            .append("rect")
            .attr("width", this.width)
            .attr("height", this.height);
        this.linesSvg = this.svg.append("g")
            .attr("class", "lines")
            .attr("clip-path", "url(#clip" + this.id + ")");
        this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + this.height + ")")
            .call(this.xAxis);
        this.svg.append("g")
            .attr("class", "y axis")
            .call(this.yAxis);
        var self = this;
        var overlay = this.svg.append("rect")
            .attr("class", "graph-overlay")
            .attr("width", this.width)
            .attr("height", this.height)
            .on("mousemove", function () {
            self.mousemove(d3.mouse(this));
        })
            .call(this.zoom.scaleExtent([1, 10]).on("zoom", this.mousezoom.bind(this)))
            .on("mousewheel.zoom", this.mousezoom.bind(this));
        this.update();
    };
    TimeGraph.prototype.update = function () {
        var _this = this;
        var currentLines = this.linesSvg
            .selectAll("path")
            .data(this.lines);
        currentLines.enter()
            .append("path");
        currentLines.exit()
            .remove();
        currentLines
            .style("stroke", function (line) { return line.color; })
            .attr("d", function (line) { return _this.valueline(line.data); });
        this.svg.select(".y.axis").call(this.yAxis);
        this.svg.select(".x.axis").call(this.xAxis);
    };
    TimeGraph.prototype.mousezoom = function () {
        var length = this.x(this.MaxDomainX[1]) - this.x(this.MaxDomainX[0]);
        var min = -(length - this.width);
        var currentTranstate = this.zoom.translate();
        if (currentTranstate[0] > 0) {
            this.zoom.translate([0, currentTranstate[1]]);
        }
        if (currentTranstate[0] < min) {
            this.zoom.translate([min, currentTranstate[1]]);
        }
        this.update();
    };
    TimeGraph.prototype.mousemove = function (_a) {
        var _this = this;
        var mouseX = _a[0], mouseY = _a[1];
        var values = this.lines.map(function (l) {
            var point = _this.getClosestScreenValue(l, mouseX);
            console.log(point.date, point.value);
        });
    };
    TimeGraph.prototype.updateDomain = function () {
        var allTImeValues = this.lines
            .map(function (l) { return l.data; })
            .reduce(function (a, b) { return a.concat(b); });
        var times = allTImeValues.map(function (i) { return i.date; });
        var values = allTImeValues.map(function (v) { return v.value; });
        this.MaxDomainX = [d3.min(times), d3.max(times)];
        this.MaxDomainY = [d3.min(values), d3.max(values)];
        this.x.domain(this.MaxDomainX);
        this.y.domain(this.MaxDomainY);
    };
    TimeGraph.prototype.getClosestScreenValue = function (line, xScreen) {
        var close = this.getClosePoints(line, xScreen);
        if (!close.left || !close.right) {
            return close.left || close.right;
        }
        return close.right.date.getTime() - close.exactX.getTime() < close.exactX.getTime() - close.left.date.getTime() ?
            close.right : close.left;
    };
    TimeGraph.prototype.getInterpolatedScreenValue = function (line, xScreen) {
        var close = this.getClosePoints(line, xScreen);
        return this.interpolate(close.left, close.right, close.exactX);
    };
    TimeGraph.prototype.getClosePoints = function (line, xScreen) {
        var xData = this.x.invert(xScreen);
        var rightIndex = d3.bisector(function (i) { return i.date; }).right(line.data, xData);
        return {
            left: line.data[rightIndex - 1],
            right: line.data[rightIndex],
            exactX: xData
        };
    };
    TimeGraph.prototype.interpolate = function (a, b, xData) {
        if (!a || !b) {
            return a || b;
        }
        var value = d3.time.scale()
            .domain([a.date, b.date])
            .range([a.value, b.value])(xData);
        return {
            value: value,
            date: xData
        };
    };
    return TimeGraph;
}());
