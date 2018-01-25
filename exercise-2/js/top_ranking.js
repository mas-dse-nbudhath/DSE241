var data, gdata;
var defaultCountryValue = "United States";
var defaultYear = "2006";

function getFlagCode() {
    var j = $.ajax({
        type: "GET", dataType: 'json',
        url: 'data/flag.json',
        cache: false,
        async: false
    }).responseJSON;
    return j;
}

function dropdown(data) {
    function onchange() {
        selectValue = d3.select('select').property('value')
        // console.log(selectValue);
        var d = filterByCountry(gdata, selectValue);
        updateChart(d);

        defaultCountryValue = selectValue;
        var result2 = getTableResult(gdata);
        var table = tabulate(result2, gFlagData, ['Rank', 'Country', 'G', 'S', 'B', 'Score'], "tbl1");


    }


    var countries = Enumerable.From(data)
        .GroupBy("{ country: $.Country }", null,
        function (key, g) {
            var result = {
                country: key.country
            }
            return result;
        }, function (x) { return x.country })
        .OrderBy("$.Year")
        .Select(function (x) {

            if (x.country.indexOf('Germany') > -1) {
                x.country = 'Germany';
            }

            return x.country;
        })
        .ToArray();

    countries = (Array.from(new Set(countries)));


    // var mergedCountries = Enumerable.From(countries)
    //                 .GroupBy("{ country: $.country }", null,
    //                         function (key, g) {
    //                             var result = {
    //                                 country: key.country
    //                             }
    //                             return result;
    //                             }, function (x) { return x.country })
    //                     .Select(function(x){
    //                         return x.country;
    //                     })     
    //                     .ToArray();

    // console.log(mergedCountries);



    var select = d3.select('#dd')
        .append('select')
        .attr('class', 'select')
        .attr('id', 'ddCountryList')
        .on('change', onchange)

    var options = select
        .selectAll('option')
        .data(countries).enter()
        .append('option')
        .text(function (d) {
            return d;
        })
        .property("selected", function (d) {
            // console.log(defaultCountryValue);
            return d === defaultCountryValue;
        });
}


function tabulate(data, fdata, columns, id) {
    var table = d3.select('#' + id);
    //   table.attr("class","table table-striped table-hover");
    //   table.attr("style","height : 35px;")

    table.select('thead').remove();
    table.select('tbody').remove();

    var thead = table.append('thead');
    var tbody = table.append('tbody');

    // append the header row
    thead.append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .text(function (column) { return column; });

    // create a row for each object in the data
    var rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr')
        .on("click", function (elem) {
            // console.log(elem);
        })
        .attr("style", function (x) {
            console.log("this is where I should look")
            console.log(x);

            selectedCountry = ($("#ddCountryList").val());

            if (x.Country == selectedCountry) {
                var color='#FFFF00'
                if(x.Score>60) {
                    color='#BDB76B'
                }

                return "height : 5px; font-size: 80%;background-color: "+color;
            }
            return "height : 5px; font-size: 80%;";
        });

    // create a cell in each row for each column
    var cells = rows.selectAll('td')
        .data(function (row) {
            return columns.map(function (column) {
                return { column: column, value: row[column] };
            });
        })
        .enter()
        .append('td')
        //   .text(function (d) { return d.value; });
        .html(function (d) {
            if (d.column == 'Country') {
                var code = fdata[d.value];
                return '<img src="data/4x3/' + code + '.svg" style="width : 18px; height : 14.5px;">&nbsp;<span>' + d.value + '</span>';
            }
            else {
                return d.value;
            }
        });
    return table;
}




function getTableResult(data) {
    console.log("data");
    console.log(data);

    var q = Enumerable.From(
        Enumerable.From(data)
            .Where(function (x) {
                return x.Year == defaultYear;
            })
            .Select(function (x) {
                if (x.Medal == 'Gold') {
                    x.Value = 1;
                    x.MedalValue = 3;
                }
                else if (x.Medal == 'Silver') {
                    x.Value = 1;
                    x.MedalValue = 2;
                }
                else {
                    x.Value = 1;
                    x.MedalValue = 1;
                }

                if (x.Country.indexOf('Germany') > -1) {
                    x.Country = 'Germany';
                }

                return x;
            })
    )
        .GroupBy("{ country: $.Country, year: $.Year, medal: $.Medal }",
        null,
        function (key, g) {
            var qr = {
                country: key.country,
                year: key.year,
                medal: key.medal,
                count: g.Count($.Medal),
                total: g.Sum("$.MedalValue")
            }
            return qr;
        },
        function (x) {
            return x.country + ':' + x.year + ':' + x.medal;
        })
        .Select(function (x) {
            return {
                'Country': x.country,
                'Medal': x.medal,
                'Count': x.count,
                'Point': x.total
            };
        })
        .ToArray();

    var result = Enumerable.From(q)
        .Where(function (x) {
            return x.Country != 'Soviet Union';
        })
        .OrderBy("$.Country")
        // .Take(10)
        .ToArray();

    var unique = Enumerable.From(result)
        .GroupBy("{ country: $.Country }", null,
        function (key, g) {
            var result = {
                country: key.country
            }
            return result;
        }, function (x) { return x.country })
        .Select(function (x) {
            return { Country: x.country };
        }).ToArray();

    var medals = Enumerable.From(q)
        .Where(function (x) { return x.Country == "United States" })
        .OrderBy("$.Year", "$.Medal")
        .ToArray();

    var nObj = {};
    medals.map(function (r2, i2) {
        console.log(r2);
        nObj[r2.Medal] = { Count: r2.Count, Point: r2.Point };
    });

    var result2 = unique.map(function (r, i) {
        //console.log(r.Country); 
        var medals = Enumerable.From(q)
            .Where(function (x) { return x.Country == r.Country })
            .OrderBy("$.Year", "$.Medal")
            .ToArray();
        //console.log(medals);

        var nObj = {};
        var TotalPoints = 0;
        medals.map(function (r2, i2) {
            console.log(r2);
            nObj[r2.Medal] = r2.Count;
            // console.log(nObj);
            TotalPoints = TotalPoints + r2.Point;
        });

        var gold = 0, silver = 0, bronze = 0;

        if (Object.keys(nObj).indexOf('Gold') > -1) {
            gold = nObj.Gold;
        }

        if (Object.keys(nObj).indexOf('Silver') > -1) {
            silver = nObj.Silver;
        }

        if (Object.keys(nObj).indexOf('Bronze') > -1) {
            bronze = nObj.Bronze;
        }

        r.G = gold;
        r.S = silver;
        r.B = bronze;
        r.Score = TotalPoints;

        return r;

    });

    result3 = Enumerable.From(result2)
        .OrderByDescending("$.Score")
        .ToArray();

    result4 = result3.map(function (r, i) {
        r.Rank = i + 1;
        return r;
    });

    return result4;
}

function generateTable(data) {

    d3.json('data/flag.json', function (error, fdata) {
        gFlagData = fdata;
        var result4 = getTableResult(data);
        console.log(result4);
        var table = tabulate(result4, fdata, ['Rank', 'Country', 'G', 'S', 'B', 'Score'], "tbl1");
    });

}

var gFlagData;

function getMedalCount(x) {
    function extend(obj, src) {
        for (var key in src) {
            if (src.hasOwnProperty(key)) obj[key] = src[key];
        }
        return obj;
    }
    var y = Enumerable.From(x)
        .GroupBy("{ year: $.Year }",
        null,
        function (key, g) {
            var result = {
                year: key.year
            }
            return result;
        },
        function (yx) {
            return yx.year;
        })
        .Select(function (yx) {
            var a = Enumerable.From(x)
                .Where(function (ax) {
                    return ax.Year == yx.year;
                })
                .Select(function (ax) {
                    var j = {};
                    j[ax.Medal] = ax.Total;

                    return j;
                })
                .ToArray();

            var m = {};
            m.Year = yx.year;
            m.Medals = a;

            c = {};
            for (var idx in a) {
                //console.log(idx);
                var obj = (a[idx]);
                //console.log(obj);
                //Object.assign({}, obj, c);
                extend(c, obj);
            }
            //console.log(c);


            return { Year: yx.year, Medals: c };
        })
        .ToArray();
    return y;
}


function generateChartOld(data) {
    function getMedalCount(x) {
        function extend(obj, src) {
            for (var key in src) {
                if (src.hasOwnProperty(key)) obj[key] = src[key];
            }
            return obj;
        }

        var y = Enumerable.From(x)
            .GroupBy("{ year: $.Year }",
            null,
            function (key, g) {
                var result = {
                    year: key.year
                }
                return result;
            },
            function (yx) {
                return yx.year;
            })
            .Select(function (yx) {
                var a = Enumerable.From(x)
                    .Where(function (ax) {
                        return ax.Year == yx.year;
                    })
                    .Select(function (ax) {
                        var j = {};
                        j[ax.Medal] = ax.Total;

                        return j;
                    })
                    .ToArray();

                var m = {};
                m.Year = yx.year;
                m.Medals = a;

                c = {};
                for (var idx in a) {
                    var obj = (a[idx]);
                    //Object.assign({}, obj, c);
                    extend(c, obj);
                }
                // console.log(c);


                return { Year: yx.year, Medals: c };
            })
            .ToArray();
        return y;
    }

    var svg = d3.select("#chart"),
        margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.05)
        .align(0.1);

    var y = d3.scaleLinear()
        .rangeRound([height, 0]);

    var z = d3.scaleOrdinal()
        .range(colorbrewer.Set1[3]);  //(["#FFDF00", "#c0c0c0", "#cd7f32"]);


    var medals = Enumerable.From(data)
        .Where(function (x) { return x.Country == defaultCountryValue })
        .GroupBy(null, null, "{Country:$.Country, Year:$.Year, Medal: $.Medal, Total: $$.Count() }",
        "'' + $.Year + '-' + $.Medal")
        .OrderBy("$.Year", "$.Medal")
        .ToArray();

    // console.log(medals);

    var md = getMedalCount(medals);

    // console.log(md);

    var d = md.map(function (d) {
        var gold = 0, silver = 0, bronze = 0;

        // console.log(Object.keys(d.Medals).indexOf('Gold') > -1);

        if (Object.keys(d.Medals).indexOf('Gold') > -1) {
            gold = d.Medals.Gold;
        }

        if (Object.keys(d.Medals).indexOf('Silver') > -1) {
            silver = d.Medals.Silver;
        }

        if (Object.keys(d.Medals).indexOf('Bronze') > -1) {
            bronze = d.Medals.Bronze;
        }

        return {
            Year: d.Year,
            Gold: gold,
            Silver: silver,
            Bronze: bronze,
            total: gold + silver + bronze
        };
    });

    data = d; //d has now the structure wanted by data, easier to assign data as d instead of changing everywhere in code

    var keys = ['Gold', 'Silver', 'Bronze'];

    x.domain(data.map(function (d) { return d.Year; }));
    y.domain([0, d3.max(data, function (d) { return d.total; })]).nice();
    z.domain(keys);

    g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(data))
        .enter().append("g")
        .attr("fill", function (d) { return z(d.key); })
        .selectAll("rect")
        .data(function (d) { return d; })
        .enter().append("rect")
        .attr("x", function (d) { return x(d.data.Year); })

        .attr("y", function (d) { return y(d[1]); })
        .attr("height", function (d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth());

    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 8)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");


    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))

        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()) + 0.5)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Olympics Medals");

    var legend = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(-100," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function (d) { return d + ' ' + 'Medal'; });

}


function filterByCountry(data, defaultCountryValue) {
    var medals = Enumerable.From(data)
        .Where(function (x) { return x.Country == defaultCountryValue })

        .GroupBy(null, null, "{Country:$.Country, Year:$.Year, Medal: $.Medal, Total: $$.Count() }",
        "'' + $.Year + '-' + $.Medal")
        .OrderBy("$.Year", "$.Medal")

        .ToArray();

    var years = Enumerable.From(data)
        .GroupBy("{ year: $.Year }", null,
        function (key, g) {
            var result = {
                year: key.year
            }
            return result;
        }, function (x) { return x.year })
        .OrderBy("$.Year")
        .Select(function (x) {
            return x.year;
        })
        .ToArray();

    //var years=["1924","1928","1932","1936","1948","1952","1956","1960","1964","1968","1972","1976","1980","1984","1988","1992","1994","1998","2002","2006"];


    var md = getMedalCount(medals);

    console.log(md);

    var d = md.map(function (d) {
        var gold = 0, silver = 0, bronze = 0;
        //console.log(Object.keys(d.Medals).indexOf('Gold') > -1);
        if (Object.keys(d.Medals).indexOf('Gold') > -1) {
            gold = d.Medals.Gold;
        }
        if (Object.keys(d.Medals).indexOf('Silver') > -1) {
            silver = d.Medals.Silver;
        }

        if (Object.keys(d.Medals).indexOf('Bronze') > -1) {
            bronze = d.Medals.Bronze;
        }



        return {
            Year: d.Year,
            Gold: gold,
            Silver: silver,
            Bronze: bronze,
            total: gold + silver + bronze
        };

    });

    return d;



}


var svg, margin, width, height, g, x, y, z;

function generateChart(data) {
    svg = d3.select("#chart"),
        margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.05)
        .align(0.1);

    y = d3.scaleLinear()
        .rangeRound([height, 0]);

    //var r = [colorbrewer.Set1coll[6]]

    z = d3.scaleOrdinal()
        .range(colorbrewer.Set1[3]); 


    var d = filterByCountry(data, defaultCountryValue);

    return d;



}

function updateChart(data) {
    // svg = d3.select("#chart");

    svg.select("g").selectAll("g").remove();

    var keys = ['Gold', 'Silver', 'Bronze'];
    x.domain(data.map(function (d) { return d.Year; }));
    y.domain([0, d3.max(data, function (d) { return d.total; })]).nice();
    z.domain(keys);



    g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(data))
        .enter().append("g")
        .attr("fill", function (d) { return z(d.key); })
        .selectAll("rect")
        .data(function (d) { return d; })
        .enter().append("rect")
        .attr("x", function (d) { return x(d.data.Year); })
        .attr("y", function (d) { return y(d[1]); })
        .attr("height", function (d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth())
        .attr("style", "cursor: pointer")
        .on("click", function (x) {
            defaultYear = x.data.Year;
            d3.select("#yearId").text("Year: " + defaultYear);
            var result2 = getTableResult(gdata);
            var table = tabulate(result2, gFlagData, ['Rank', 'Country', 'G', 'S', 'B', 'Score'], "tbl1");
        });



    g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 8)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()) + 0.5)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Olympics Medals");
    var legend = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .enter().append("g")
        .attr("transform", function (d, i) { return "translate(-300," + i * 20 + ")"; });
    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function (d) { return d; });
}




d3.json('data/exercise2-olympics.json', function (error, rawData) {
    d3.select("#yearId").text("Year: " + defaultYear);
    gdata = rawData;

    generateTable(gdata);
    dropdown(gdata);
    var chartValues = generateChart(gdata);
    // console.log(chartValues);
    updateChart(chartValues);
});