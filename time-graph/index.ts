declare var d3:any;

interface TimeValue
{
    date: Date,
    value: number
}

interface DataLine{
    color: string,
    data: TimeValue[]
}

var customMultiDateFormat = d3.time.format.multi([
    [".%L", function(d) { return d.getMilliseconds(); }],
    [":%S", function(d) { return d.getSeconds(); }],
    ["%_H:%M", function(d) { return d.getMinutes(); }],
    ["%_H:00", function(d) { return d.getHours(); }],
    ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
    ["%b %d", function(d) { return d.getDate() != 1; }],
    ["%B", function(d) { return d.getMonth(); }],
    ["%Y", function() { return true; }]
])

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

class TimeGraph {

    private id = (Math.random() * 1e16).toFixed(0) + "";

    x = d3.time.scale();
    y = d3.scale.linear();

    xAxis = d3.svg.axis().scale(this.x);
    yAxis = d3.svg.axis().scale(this.y);

    zoom = d3.behavior.zoom();

    width: number;
    height: number;

    svg: any;
    linesSvg: any;

    MaxDomainX: [Date, Date];
    MaxDomainY: [number, number];

    constructor(
        private elementSelector: string,
        private lines: DataLine[]
    ){
        this.render();
    }


    render(){

        this.updateDomain();

        var margin = {top: 30, right: 20, bottom: 30, left: 55};
        var margin = {top: 30, right: 20, bottom: 30, left: 55};

        this.width = 700 - margin.left - margin.right;
        this.height = 370 - margin.top - margin.bottom;

        // Set the ranges
        this.x.range([0, this.width]);
        this.y.range([this.height, 0]);

        this.zoom
            .x(this.x)

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
            .attr("clip-path", `url(#clip${this.id})`);

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
            //.on("mouseover", function() { focusGroup.style("display", null);})
            //.on("mouseout", function() { focusGroup.style("display", "none");})
            .on("mousemove", function() {

                self.mousemove(d3.mouse(this))
            })
            .call(this.zoom.scaleExtent([1, 10]).on("zoom", this.mousezoom.bind(this)))
            .on("mousewheel.zoom", this.mousezoom.bind(this));

        this.update();
    }

    update(){

        var currentLines = this.linesSvg
            .selectAll("path")
            .data(this.lines);

        currentLines.enter()
            .append("path");

        currentLines.exit()
            .remove();

        currentLines
            .style("stroke", line => line.color)
            .attr("d", line => this.valueline(line.data));

        this.svg.select(".y.axis").call(this.yAxis);
        this.svg.select(".x.axis").call(this.xAxis);
    }

    mousezoom(){

        var length = this.x(this.MaxDomainX[1])-  this.x(this.MaxDomainX[0]);
        var min = -(length - this.width);
        //console.log("min", min, length);
        //console.log("currentTranstate", currentTranstate[0])
        var currentTranstate = this.zoom.translate();

        if (currentTranstate[0] > 0) {
            this.zoom.translate([0, currentTranstate[1]]);
        }

        if (currentTranstate[0] < min) {
            this.zoom.translate([min, currentTranstate[1]]);
        }
        this.update()
    }

    mousemove([mouseX,mouseY]){
        var values = this.lines.map(l => {
            var point = this.getClosestScreenValue(l, mouseX)
            console.log(point.date, point.value);
        });
    }

    updateDomain(){
        var allTImeValues = this.lines
            .map(l => l.data)
            .reduce((a,b) => a.concat(b));

        var times = allTImeValues.map(i => i.date);
        var values = allTImeValues.map(v => v.value)

        this.MaxDomainX = [d3.min(times), d3.max(times)];
        this.MaxDomainY = [d3.min(values), d3.max(values)];

        this.x.domain(this.MaxDomainX);
        this.y.domain(this.MaxDomainY);
    }

    valueline = d3.svg.line()
        .interpolate("monotone")
        .x((v:TimeValue) => this.x(v.date))
        .y((v:TimeValue) => this.y(v.value));

    getClosestScreenValue(line: DataLine, xScreen){
        var close = this.getClosePoints(line, xScreen);
        if(! close.left || !close.right ){
            return close.left || close.right;
        }
        return close.right.date.getTime() - close.exactX.getTime() < close.exactX.getTime() - close.left.date.getTime() ?
            close.right : close.left;
    }

    getInterpolatedScreenValue(line:DataLine, xScreen){
        var close = this.getClosePoints(line, xScreen);
        return this.interpolate(close.left, close.right, close.exactX);
    }

    getClosePoints(line: DataLine, xScreen){
        var xData = this.x.invert(xScreen);
        var rightIndex = d3.bisector((i:TimeValue) => i.date).right(line.data, xData);

        return {
            left: line.data[rightIndex - 1],
            right: line.data[rightIndex],
            exactX: xData
        }
    }

    interpolate(a:TimeValue, b: TimeValue, xData: Date){
        if(! a || !b ){
            return a || b;
        }
        var value = <number>d3.time.scale()
            .domain([a.date, b.date])
            .range([a.value, b.value]) (xData);

        return {
            value: value,
            date: xData
        }
    }

}
