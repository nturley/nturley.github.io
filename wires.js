var leftLevel = [{},{}];
var rightLevel = [{},{}];
var wires =
[
	{
		'sources':[leftLevel[0]],
		'sinks':[rightLevel[0]]
	},
	{
		'sources':[leftLevel[1]],
		'sinks':[rightLevel[1]]
	},
];

wires.forEach(function(w)
{
	function tagWire(s)
	{
		s.wire = w;
	}
	w.sources.forEach(tagWire);
	w.sinks.forEach(tagWire);
});

function yRange(wire)
{
	var ret = {};
	wire.sources.forEach(function(s)
	{
		if (ret.min == undefined || s.y+20 < ret.min)
		{
			ret.min = s.y+20;
		}
		if (ret.max == undefined || s.y+20 > ret.max)
		{
			ret.max = s.y+20;
		}
	});
	wire.sinks.forEach(function(s)
	{
		if (ret.min == undefined || s.y+20 < ret.min)
		{
			ret.min = s.y+20;
		}
		if (ret.max == undefined || s.y+20 > ret.max)
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

viewer.selectAll('.wire')
	.data(wires)
	.enter().append('g')
		.attr('class','wire')
		.append('line')
			.attr('class','wireMiddle')

viewer.selectAll('.wire')
	.selectAll('.source')
		.data(function(d){return d.sources;})
		.enter().append('line')
			.attr('class','source port');

viewer.selectAll('.wire')
	.selectAll('.sink')
		.data(function(d){return d.sinks;})
		.enter().append('line')
			.attr('class','sink port');

viewer.selectAll('.wire')
	.selectAll('.dot')
	.data(function(d){return d.sinks.concat(d.sources);})
	.enter().append('circle')
		.attr('class','dot')

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
wires.forEach(function(w)
{
	w.x = xMean(w);
});

d3.selectAll('.dot')
	.attr('r',3);

function updateDots()
{
	d3.selectAll('.dot')
		.attr('cx',function(d){return d.wire.x;})
		.attr('cy',function(d){return d.y+20;})
		.attr('visibility',function(d)
			{
				var range = yRange(d.wire);
				if (d.y > range.min-20 && d.y < range.max-20)
				{
					return "visible";
				}
				else
				{
					return "hidden";
				}
			});
}

function updateWires()
{
	d3.selectAll('.wireMiddle')
		.attr('y1',function(d){return yRange(d).min;})
		.attr('y2',function(d){return yRange(d).max;})
		.attr('x1',function(d){return d.x;})
		.attr('x2',function(d){return d.x;})
		
	d3.selectAll('.source')
		.attr('x1',function(d){return d.x+40;})
		.attr('x2',function(d){return d.wire.x;})
		.attr('y1',function(d){return d.y+20;})
		.attr('y2',function(d){return d.y+20;})
		
	d3.selectAll('.sink')
		.attr('x1',function(d){return d.x;})
		.attr('x2',function(d){return d.wire.x;})
		.attr('y1',function(d){return d.y+20;})
		.attr('y2',function(d){return d.y+20;})
}
function updateNodes()
{
	d3.selectAll('.nodeBody')
		.attr('x',function(d){return d.x;})
		.attr('y',function(d){return d.y;});
}

updateDots();
updateNodes();
updateWires();

function pushWires(alpha, push)
{
	return function(wire)
	{
		rightmostSource = null;
		wire.sources.forEach(function(s)
		{
			if (rightmostSource==null || s.x>rightmostSource.x)
				rightmostSource = s;	
		});
		if (rightmostSource!=null)
		{
			dx = wire.x - (rightmostSource.x+80);
			wire.x -= dx*alpha*push;
		}
		leftmostSink = null;
		wire.sinks.forEach(function(s)
		{
			if (leftmostSink==null || s.x<leftmostSink.x)
				leftmostSink = s;
		});
		if (leftmostSink!=null)
		{
			dx = wire.x - (leftmostSink.x-40);
			wire.x -= dx*alpha*push;
		}
		// vertical wire segments repulse each other
		// We max out the force so it's easy to overpower
		wires.forEach(function(wire2)
		{
			if (wire==wire2)
				return;
			force = 100*alpha/(wire.x - wire2.x);
			force = d3.min([0.25,force]);
			force = d3.max([-0.25,force]);
			wire.x += force;
			wire2.x -= force;
		});
	};
}

function tick(e)
{
	d3.selectAll('.wire').each(pushWires(e.alpha, 0.5));
	updateDots();
	updateNodes();
	updateWires();
}

var force = d3.layout.force()
    .nodes(leftLevel.concat(rightLevel))
    .gravity(0)
    .charge(0)
    .friction(0)
    .on('tick',tick);

var drag = force.drag();

d3.selectAll('.nodeBody')
    .call(drag);

force
    .start();
