var leftLevel = [{},{},{}];
var rightLevel = [{},{},{},{}];
var wires =
[
	{
		'sources':[leftLevel[0],leftLevel[1]],
		'sinks':[rightLevel[0],rightLevel[2]]
	},
	{
		'sources':[leftLevel[2]],
		'sinks':[rightLevel[1],rightLevel[3]]
	}
];
leftLevel[0].wire = wires[0];
leftLevel[1].wire = wires[0];
leftLevel[2].wire = wires[1];
rightLevel[0].wire = wires[0];
rightLevel[1].wire = wires[1];
rightLevel[2].wire = wires[0];
rightLevel[3].wire = wires[1];


function yRange(wire)
{
	var ret = {};
	wire.sources.forEach(function(s)
	{
		if (ret.min == undefined || s.y < ret.min)
		{
			ret.min = s.y+20;
		}
		if (ret.max == undefined || s.y > ret.max)
		{
			ret.max = s.y+20;
		}
	});
	wire.sinks.forEach(function(s)
	{
		if (ret.min == undefined || s.y < ret.min)
		{
			ret.min = s.y+20;
		}
		if (ret.max == undefined || s.y > ret.max)
		{
			ret.max = s.y+20;
		}
	});
	return ret;
}

function xMean(wire)
{
	var sum = 0;
	wire.sources.forEach(function(s)
	{
		sum+=s.x+20;
	});
	wire.sinks.forEach(function(s)
	{
		sum+=s.x+20;
	});
	return sum/(wire.sources.length + wire.sinks.length);
}

var EDGE_NODE_GAP = 20;
var NODE_GAP = 80;

nodeScale = d3.scale.linear()
    .domain([0,1])
    .range([EDGE_NODE_GAP, EDGE_NODE_GAP + NODE_GAP]);

var viewer = d3.select('#viewer');
viewer
	.attr('width',500)
	.attr('height',500)
	
viewer.selectAll('.leftNode')
	.data(leftLevel)
	.enter().append('rect')
		.attr('class','nodeBody leftNode');
viewer.selectAll('.rightNode')
	.data(rightLevel)
	.enter().append('rect')
		.attr('class','nodeBody rightNode');
viewer.selectAll('rect')
	.attr('width',40)
	.attr('height',40);
var wires = viewer.selectAll('.wire')
	.data(wires)
	.enter().append('g')
		.attr('class','wire')
		.append('line')
			.attr('class','wireMiddle')

d3.selectAll('.wire')
	.selectAll('.source')
		.data(function(d){return d.sources;})
		.enter().append('line')
			.attr('class','source port');
d3.selectAll('.wire')
	.selectAll('.sink')
		.data(function(d){return d.sinks;})
		.enter().append('line')
			.attr('class','sink port');

nodeScale = d3.scale.linear()
    .domain([0,1])
    .range([EDGE_NODE_GAP, EDGE_NODE_GAP + NODE_GAP]);

leftLevel.forEach(function(n, i)
{
	n.x = 50;
	n.y = nodeScale(i)+NODE_GAP/2;
});
rightLevel.forEach(function(n, i)
{
	n.x = 150;
	n.y = nodeScale(i);
});

d3.selectAll('.wireMiddle')
	.attr('y1',function(d){return yRange(d).min;})
	.attr('y2',function(d){return yRange(d).max;})
	.attr('x1',function(d){return xMean(d);})
	.attr('x2',function(d){return xMean(d);})
	

d3.selectAll('.nodeBody')
	.attr('x',function(d){return d.x;})
	.attr('y',function(d){return d.y;});
	

d3.selectAll('.source')
	.attr('x1',function(d){return d.x+40;})
	.attr('x2',function(d){return xMean(d.wire);})
	.attr('y1',function(d){return d.y+20;})
	.attr('y2',function(d){return d.y+20;})
	
d3.selectAll('.sink')
	.attr('x1',function(d){return d.x;})
	.attr('x2',function(d){return xMean(d.wire);})
	.attr('y1',function(d){return d.y+20;})
	.attr('y2',function(d){return d.y+20;})

console.log(leftLevel);
console.log(rightLevel);
