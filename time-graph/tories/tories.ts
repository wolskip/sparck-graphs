declare var moment: any;

jsonWithRetry("http://37.26.94.90/response.json", 1, function(json) {

    function mapData(data: any): TimeValue[]{
        return data.balance.map((v,i) => {
            return {
                value: v * 100,
                time: moment(data.time[i]).add(1, 'hours')._d
            };
        });
    }

    var lines = [
        {
            color: "red",
            data: mapData(json.corbyn_tweets)
        },
        {
            color: "blue",
            data: mapData(json.smith_tweets)
        },
    ]

    var graph = new TimeGraph(".tory-chart", lines);
});
