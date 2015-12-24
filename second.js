// Deserialize json data, make it usable for d3
// by the end of it, we have inputPorts, outputPorts, and cells.
// all of which will conform to the same interface



// converts an associative array to an indexed array
// embeds key as a member named "key"
function toArray(assoc)
{
    var map = d3.map(assoc)
    map.forEach(function (k, v){v.key=k});
    return map.values();
}
// returns an array of ports that are going a specific direction
// the elements in this array are obects whose members are key and value
// where key is the port name and value is the connection array

function getCellPortList(cell, direction)
{
    return d3.map(cell.connections).entries().filter(function(d)
    {
        return cell.port_directions[d.key] == direction;
    });
}

//-------------------------------------------------------------------
// flatten data
ports = toArray(diagram.modules.up3down5.ports);
var inputPorts = ports.filter(function(d){return d.direction=='input'});
var outputPorts = ports.filter(function(d){return d.direction=='output'});
var cells = toArray(diagram.modules.up3down5.cells);
cells.forEach(function(c)
{
    c.inputPorts = getCellPortList(c,"input");
    c.outputPorts = getCellPortList(c,"output");
});
inputPorts.forEach(function(p)
{
    p.inputPorts = [];
    p.outputPorts = [{'key':p.key,'value':p.bits}];
});
outputPorts.forEach(function(p)
{
    p.inputPorts = [{'key':p.key,'value':p.bits}];
    p.outputPorts = [];
});


// now we have three variables: inputPorts, outputPorts, and cells
// all three conform to [{inputPorts:[{key:k,value:v}],outputPorts:[{key:k,value:v}]}]

nodes = cells.concat(inputPorts).concat(outputPorts);

function addConstants(nodes, cells)
{
    // find the maximum signal number
    var maxNum=-1;
    nodes.forEach(function(n)
    {
        n.outputPorts.forEach(function(p) {
        maxNum = d3.max([maxNum,d3.max(p.value)])
        });
    });

    // add constants to cells
    nodes.forEach(function(n)
    {
        n.inputPorts.forEach(function(p)
        {
            name = "";
            constants = [];
            for (var i in p.value) {
                if (p.value[i]<2)
                {
                    maxNum += 1;
                    name+=p.value[i];
                    p.value[i] = maxNum;
                    constants.push(maxNum);
                }
                else if (constants.length>0)
                {
                    cells.push(
                    {
                      "key": '$constant_'+arrayToBitstring(constants),
                      "hide_name": 1,
                      "type": name,
                      "inputPorts":[],
                      "outputPorts":[{'key':'Y','value':constants}]
                    });
                    name='';
                    constants = [];
                }
            }
            if (constants.length>0)
            {
                cells.push(
                {
                    "key": '$constant_'+arrayToBitstring(constants),
                    "hide_name": 1,
                    "type": name,
                    "inputPorts":[],
                    "outputPorts":[{'key':'Y','value':constants}]
                });
            }
        });
    });
}
addConstants(nodes, cells);
//refresh nodes
nodes = cells.concat(inputPorts).concat(outputPorts);
// --------------------------------------------------
// solve splits and joins

allInputs = [];
allOutputs = [];
nodes.forEach(function(n) 
{
    n.inputPorts.forEach(function(i)
    {
        allInputs.push(','+i.value.join()+',');
    });
    n.outputPorts.forEach(function(i)
    {
        allOutputs.push(','+i.value.join()+',');
    });
});

allInputsCopy = allInputs.slice();
var splits = {};
var joins = {};
for (var i in allInputs) {
    gather(allOutputs, allInputsCopy, allInputs[i], 0, allInputs[i].length, splits, joins);
}

for (var join in joins) {
    signals = join.slice(1,-1).split(',');
    for (var i in signals) {
      signals[i] = Number(signals[i])
    }
    outPorts = [{'key':'Y','value':signals}];
    inPorts = [];
    for (var i in joins[join]) {
        var name = joins[join][i];
        var value = getBits(signals, name);
      inPorts.push({'key':name,'value':value});
    }
    cells.push({"key":'$join$'+join,
      "hide_name": 1,
      "type": "$_join_",
      "inputPorts":inPorts,
      "outputPorts":outPorts});
}

for (var split in splits) {
    signals = split.slice(1,-1).split(',');
    for (var i in signals) {
      signals[i] = Number(signals[i])
    }
    inPorts = [{'key':'A','value':signals}];
    outPorts = [];
    for (var i in splits[split]) {
        var name = splits[split][i];
        var value = getBits(signals, name);
      outPorts.push({'key':name,'value':value});
    }
    cells.push({"key":'$split$'+split,
      "hide_name": 1,
      "type": "$_split_",
      "inputPorts":inPorts,
      "outputPorts":outPorts});
}
//refresh nodes
nodes = cells.concat(inputPorts).concat(outputPorts);

// At this point, only perfect matches should exist

// also give each port a reference to it's parent (parentNode)
// collect all ports driven by a net
nets= {}
nodes.forEach(function(n) 
{
    var nodeName = n.key;
    for (var i in n.inputPorts)
    {
        var port = n.inputPorts[i];
        port.parentNode = n;
        addToDefaultDict(nets,arrayToBitstring(port.value),port);
    }
});
// build a list of wire objects that hold references to the ports the net connects to
wires = [];
nodes.forEach(function(n) 
{
    var nodeName = n.key;
    for (var i in n.outputPorts)
    {
        var port = n.outputPorts[i];
        port.parentNode = n;
        riders = nets[arrayToBitstring(port.value)];
        var wire = {'drivers': [port], 'riders': riders};
        wires.push(wire);
        port.wire = wire;
        riders.forEach(function(r)
        {
            r.wire = wire;
        });
    }
});

// find all root nodes (only inputs)
var rootNodes = nodes.filter(function(d) {
    return d.inputPorts.length == 0;
});

var leafNodes = nodes.filter(function(d) {
    return d.outputPorts.length == 0;
});

// DFS to detect cycles
function visitDependents(n, visited)
{
    visited[n.key] = true;
    n.outputPorts.forEach(function(p)
    {
        p.wire.riders.forEach(function(r)
        {
            if (!(r.parentNode.key in visited))
            {
                visitDependents(r.parentNode, visited);
            } 
            else
            {
                if (n.type == '$dff')
                {
                    r.feedback = true;
                }
            }
        });
    });
}

rootNodes.forEach(function(n)
{
    visitDependents(n,{});
});

// we have now tagged all feedback paths

// Do a longest path algo to assign nodes an rdepth
var greatestRDepth = 0;
function reverseDFS(node, rdepth)
{
    if (node.rdepth==undefined || rdepth>node.rdepth)
    {
        node.rdepth = rdepth;
        if (rdepth>greatestRDepth)
            greatestRDepth=rdepth;
        node.inputPorts.forEach(function(p)
        {
            if (p.feedback != true)
                reverseDFS(p.wire.drivers[0].parentNode, rdepth+1);
        });
    }
}
leafNodes.forEach(function(n)
{
    reverseDFS(n,0);
});

// and then do it again from the opposite side

function DFS(node, depth)
{
    if (node.depth==undefined || depth>node.depth)
    {
        node.depth = depth;
        node.outputPorts.forEach(function(p)
        {
            p.wire.riders.forEach(function(r)
            {
                if (r.feedback != true)
                    DFS(r.parentNode, depth+1);
            });
        });
    }
}
rootNodes.forEach(function(n)
{
    DFS(n,greatestRDepth-n.rdepth);
});


function addDummies(driverPort, riderPort, dummies, wires)
{
    var numberOfDummies = riderPort.parentNode.depth - driverPort.parentNode.depth - 1;
    if (numberOfDummies==0)
        return;
    // disconnect
    driverPort.wire.riders = driverPort.wire.riders.filter(function(r)
        {
            return r!=riderPort;
        });
    var lastWire = driverPort.wire;
    if (numberOfDummies>0)
    {
        var dummyNumber=0;
        while (dummyNumber<numberOfDummies && lastWire.nextLevel != undefined)
        {
            lastWire = lastWire.nextLevel;
            dummyNumber+=1;
        }
        for (;dummyNumber<numberOfDummies;dummyNumber++)
        {
            var dummy = 
            {
                'type':'$_dummy_',
                'inputPorts' : [{'wire':lastWire}],
                'outputPorts': [{'wire':{'riders':[]}}],
                'depth' : driverPort.parentNode.depth+dummyNumber+1
            }
            dummy.inputPorts[0].parentNode = dummy;
            dummy.outputPorts[0].parentNode = dummy;
            dummy.outputPorts[0].wire.drivers = [dummy.outputPorts[0]];
            lastWire.riders.push(dummy.inputPorts[0]);
            lastWire.nextLevel = dummy.outputPorts[0].wire;
            lastWire = dummy.outputPorts[0].wire;
            dummies.push(dummy);
            wires.push(lastWire);
        }
        riderPort.wire = lastWire;
        lastWire.riders.push(riderPort);
    }
    else // feedback
    {
        numberOfDummies=-numberOfDummies;
        var dummyNumber=0;
        while (dummyNumber<numberOfDummies && lastWire.previousLevel != undefined)
        {
            lastWire = lastWire.previousLevel;
            dummyNumber+=1;
        }
        for (;dummyNumber<numberOfDummies;dummyNumber++)
        {
            var dummy =
            {
                'type':'$_dummy_',
                'inputPorts' : [{'wire':{'drivers':[]}}],
                'outputPorts': [{'wire':lastWire}],
                'depth':driverPort.parentNode.depth-dummyNumber
            }
            dummy.inputPorts[0].parentNode = dummy;
            dummy.outputPorts[0].parentNode = dummy;
            dummy.inputPorts[0].wire.riders = [dummy.inputPorts[0]];
            lastWire.drivers.push(dummy.outputPorts[0]);
            lastWire.previousLevel = dummy.inputPorts[0].wire;
            lastWire = dummy.inputPorts[0].wire;
            dummies.push(dummy);
            wires.push(lastWire);
        }
        lastWire.riders.push(riderPort);
        riderPort.wire = lastWire;
    }
}

var allDummies = [];

wires.forEach(function(w)
{
    w.riders.forEach(function(r)
    {
        addDummies(w.drivers[0],r,allDummies, wires);
    });
});

nodes = nodes.concat(allDummies);

//-------------------------------------
// create SVG objects for each data object and assign them classes

var viewer = d3.select('#viewer');

var cellViews = viewer.selectAll('.cell')
    .data(cells)
    .enter().append('g')
        .attr('class','cell node generic');

viewer.selectAll('.dummy')
    .data(allDummies)
    .enter().append('g')
        .attr('class','node dummy')

cellViews.selectAll('.inPort')
        .data(function(cell){return cell.inputPorts;})
        .enter().append('g')
            .attr('class', 'port inport');

cellViews.selectAll('.cell .outPort')
    .data(function(cell){return cell.outputPorts;})
    .enter().append('g')
        .attr('class','port outport');

viewer.selectAll('.inputExt')
    .data(inputPorts)
    .enter().append('g')
        .attr('class','inputExt external node generic')
        .selectAll('.inputExt .port')
            .data(function(ext){return ext.outputPorts;})
            .enter().append('g')
            .attr('class','port outport');
    
viewer.selectAll('.outputExt')
    .data(outputPorts)
    .enter().append('g')
        .attr('class','outputExt external node generic')
        .selectAll('.outputExt .port')
            .data(function(ext){return ext.inputPorts;})
            .enter().append('g')
            .attr('class','port inport')

genericViews = d3.selectAll('.generic');
genericViews.append('rect')
    .attr('class','nodeBody');
genericViews.append('text')
    .attr('class', 'label');

portViews = d3.selectAll('.port');
portViews.append('line')
    .attr('class', 'stem');
portViews.append('circle')
    .attr('class', 'leaf');

wireViews = viewer.selectAll('.net')
    .data(wires)
    .enter().append('g')
        .attr('class', 'net')

wireViews.append('line')
    .attr('class','verticalWire')

wireViews.selectAll('.driverWire')
    .data(function(d){return d.drivers;})
    .enter().append('line')
        .attr('class','driverWire wire');

wireViews.selectAll('.riderWire')
    .data(function(d){return d.riders;})
    .enter().append('line')
        .attr('class','riderWire wire');

wireViews.selectAll('.wireDot')
    .data(function(d){return d.drivers.concat(d.riders);})
    .enter().append('circle')
        .attr('class','wireDot');

//-----------------------------
// Assign all other attributes to each SVG object

// positioning constants
var VIEWER_WIDTH = 1500;
var VIEWER_HEIGHT = 1000;
var EDGE_NODE_GAP = 40;
var NODE_GAP = 80;
var BODY_WIDTH = 40;
var LEAF_DIAMETER = 4;
var LEAF_RADIUS = LEAF_DIAMETER/2;
var STEM_LENGTH = 10;
var EDGE_PORT_GAP = 10;
var PORT_GAP = 20;
var NODE_LABEL_Y = -5;

// helper functions
nodeScale = d3.scale.linear()
    .domain([0,1])
    .range([EDGE_NODE_GAP, EDGE_NODE_GAP + NODE_GAP]);

portScale = d3.scale.linear()
    .domain([0,1])
    .range([EDGE_PORT_GAP, EDGE_PORT_GAP+PORT_GAP]);

function genericHeight (cell)
{
    gaps = d3.max([cell.inputPorts.length, cell.outputPorts.length])-1;
    return gaps*PORT_GAP+2*EDGE_PORT_GAP;
}

// set view model position properties

nodes.forEach(function(n,i)
{
    n.x = nodeScale(n.depth);
    n.y = i*10;
    n.inputPorts.forEach(function(p, j)
    {
        p.x = -BODY_WIDTH/2 - STEM_LENGTH;
        p.y = portScale(j);
    });
    n.outputPorts.forEach(function(p, j)
    {
        p.x = BODY_WIDTH/2 + STEM_LENGTH;
        p.y = portScale(j);
    });
});

allDummies.forEach(function(n)
{
    n.inputPorts.concat(outputPorts).forEach(function(p)
    {
        p.x = BODY_WIDTH/2+STEM_LENGTH;
        p.y = EDGE_PORT_GAP;
    });
});

function dragstart(d)
{
    d.fixed = true;
}

function updateNodes()
{
    d3.selectAll('.node')
    .attr('transform',function(d) { return 'translate('+[d.x, d.y-genericHeight(d)/2]+')';})
}

function globalX(p)
{
    return p.x+p.parentNode.x;
}

function globalY(p)
{
    var thing = Number(p.y)+Number(p.parentNode.y)-genericHeight(p.parentNode)/2;
    return thing;
}

wires.forEach(function(w)
{
    w.x = globalX(w.riders[0]);
});

function updateWires()
{
    wires.forEach(function(w)
    {
        w.yRange = d3.extent(w.riders.concat(w.drivers),globalY);
    });
    d3.selectAll('.verticalWire')
        .attr('x1',function(d){return d.x;})
        .attr('y1',function(d){return d.yRange[0]})
        .attr('x2',function(d){return d.x;})
        .attr('y2',function(d){return d.yRange[1]});
    d3.selectAll('.wire')
        .attr('x1',function(d){return d.wire.x;})
        .attr('y1',globalY)
        .attr('x2',globalX)
        .attr('y2',globalY);
    d3.selectAll('.wireDot')
        .attr('cx',function(d){return d.wire.x;})
        .attr('cy',globalY)
        .attr('r',3)
        .attr('visibility',function(d)
            {
                if (globalY(d) > d.wire.yRange[0] && globalY(d) < d.wire.yRange[1])
                {
                    return "visible";
                }
                else
                {
                    return "hidden";
                }
            });
}


updateWires();
updateNodes();
// size the viewer
d3.select('#viewer')
    .attr('width',VIEWER_WIDTH)
    .attr('height',VIEWER_HEIGHT);

function pullNodeX(otherPort, myPort, pullX, offset)
{
    // the difference in depth should be 1, -1, or 0
    var targetX = offset*(myPort.parentNode.depth - otherPort.parentNode.depth);
    var dx = otherPort.parentNode.x - myPort.parentNode.x - targetX;

    if (myPort.parentNode.fixed!=true){
        myPort.parentNode.x += dx*pullX/2;
    }
    if (otherPort.parentNode.fixed!=true){
        otherPort.parentNode.x -= dx*pullX/2;
    }
}

function pullNodeY(otherPort, myPort, pullY)
{
    var my = globalY(myPort);
    var oy = globalY(otherPort);
    var dy = oy-my;
    if (myPort.parentNode.fixed!=true)
        myPort.parentNode.y += dy*pullY/2;
    if (otherPort.parentNode.fixed!=true)
        otherPort.parentNode.y -= dy*pullY/2;
}

function wirePull(pullX, pullY, offset, alpha)
{
    return function(wire){
        //vertical wires pulls to the right of the rightmost driver
        rightmostDriver = null;
        wire.drivers.forEach(function(s)
        {
            if (rightmostDriver==null || globalX(s)>globalX(rightmostDriver))
                rightmostDriver = s;    
        });
        if (rightmostDriver!=null)
        {
            dx = wire.x - globalX(rightmostDriver)-20;
            wire.x -= dx*alpha;
        }
        //vertical wire pulls to the left of the leftmost rider
        leftmostRider = null;
        wire.riders.forEach(function(s)
        {
            if (leftmostRider==null || globalX(s)<globalX(leftmostRider))
                leftmostRider = s;
        });
        if (leftmostRider!=null)
        {
            dx = wire.x - globalX(leftmostRider)+20;
            wire.x -= dx*alpha;
        }
        // all ports on the net pull on the nodes
        wire.drivers.concat(wire.riders).forEach(function(p0)
        {
            p0.wire.drivers.concat(p0.wire.riders).forEach(function(p1)
            {
                if (p1==p0) return;
                pullNodeX(p0,p1,pullX*alpha,offset);
                pullNodeY(p0,p1,pullY*alpha);
            });
        });
        //wires repel each other
        wires.forEach(function(wire2)
        {
            if (wire2==wire) return;
            if (wire.yRange[0]>wire2.yRange[1]+10) return;
            if (wire.yRange[1]+10<wire2.yRange[0]) return;
            var forceMag = 50*alpha/(wire.x - wire2.x);
            forceMag = d3.min([0.25,forceMag]);
            forceMag = d3.max([-0.25,forceMag]);
            wire.x += forceMag;
            wire2.x -= forceMag;
             
        });
    };
}
function straightenDummies()
{
    return function(node)
    {
        var chain = [node];
        var currNode = node;
        while(currNode.inputPorts[0].wire.drivers.length>0 && currNode.inputPorts[0].wire.drivers[0].parentNode.type=='$_dummy_')
        {
            currNode = currNode.inputPorts[0].wire.drivers[0].parentNode;
            chain.push(currNode);
        }
        var currNode = node;
        while(currNode.outputPorts[0].wire.riders.length>0 && currNode.outputPorts[0].wire.riders[0].parentNode.type=='$_dummy_')
        {
            currNode = currNode.outputPorts[0].wire.riders[0].parentNode;
            chain.push(currNode);
        }
        var sum = 0;
        chain.forEach(function(n)
        {
            sum += n.y;
        });
        chain.forEach(function(n)
        {
            n.y = sum/chain.length;
        });
    };
}

function getPullX()
{
    var p = document.getElementById('pullX').value;
    d3.select('#pullXSpan').text(p);
    return p;
}

function getPullY()
{
    var p = document.getElementById('pullY').value;
    d3.select('#pullYSpan').text(p);
    return p;
}
function getPullXOffset()
{
    var p = document.getElementById('pullXOffset').value;
    d3.select('#pullXOffsetSpan').text(p);
    return p;
}
function getCharge()
{
    var c = document.getElementById('chargeRange').value;
    d3.select('#chargeSpan').text(c);
    return -c;
}
function getDummyCharge()
{
    var c = document.getElementById('dummyChargeRange').value;
    d3.select('#dummyChargeSpan').text(c);
    return -c;
}

function getGravity()
{
    var g = document.getElementById('gravity').value;
    d3.select('#gravitySpan').text(g);
    return g;
}

function tick(e)
{
    d3.selectAll('.net').each(wirePull(getPullX(), getPullY(), -getPullXOffset(), e.alpha));
    d3.selectAll('.dummy').each(straightenDummies());
    updateNodes();
    updateWires();
}

var forces = [];

function updateForces()
{
    
    forces.forEach(function(f)
    {
        f
            .gravity(getGravity())
            .charge(function(d){return d.type=='$_dummy_'?getDummyCharge():getCharge();})
        f.start();
    });
}

function dragmove(n)
{
    forces.forEach(function(f){f.resume()});
}

var currDepth = 0;
while(nodes.filter(function(n){return n.depth==currDepth}).length>0)
{
    var nodesAtDepth = nodes.filter(function(n){return n.depth==currDepth});

    forces[currDepth] = d3.layout.force()
        .nodes(nodesAtDepth)
        .size([VIEWER_WIDTH, VIEWER_HEIGHT])
        .gravity(getGravity())
        .charge(function(d){return d.type=='$_dummy_'?getDummyCharge():getCharge();})
        .on('tick',tick);

    var drag = forces[currDepth].drag();

    drag.on("dragstart", dragstart)
    drag.on("drag",dragmove);

    forces[currDepth]
        .start();
    currDepth++;
}

d3.selectAll('.node')
    .call(drag);


d3.selectAll('input').on('change',function()
    {
        updateForces();
    });

function releaseNode(n)
{
    n.fixed = false;
    forces.forEach(function(f){f.resume()});
}

function releaseNodes(){
    d3.selectAll('.node')
    .each(releaseNode);
}

//position the ports
d3.selectAll('.port')
    .attr('transform',function(d) { return 'translate('+[d.x, d.y]+')'});

// position the stems
d3.selectAll('.generic').selectAll('.stem')
    .attr({ 'y1' : 0, 'y2' : 0, 'x1':0 });
d3.selectAll('.generic').selectAll('.inport .stem')
    .attr({ 'x2' : STEM_LENGTH });
d3.selectAll('.generic').selectAll('.outport .stem')
    .attr({ 'x2' : -STEM_LENGTH });

d3.selectAll('.dummyBody')
    .attr(
    {
        'x1':(-BODY_WIDTH/2-STEM_LENGTH),
        'x2':(BODY_WIDTH/2+STEM_LENGTH),
        'y1':PORT_GAP/2,
        'y2':PORT_GAP/2
    });

// position generic node bodies
d3.selectAll('.generic .nodeBody')
    .attr('width', BODY_WIDTH)
    .attr('x', -BODY_WIDTH/2)
    .attr('height', function(d,i){return genericHeight(d);});

// position the nodelabel and set it's text
d3.selectAll('.generic.cell .label')
    .text(function(d){return d.type;})

d3.selectAll('.generic.external .label')
    .text(function(d){return d.key;})

d3.selectAll('.generic .label')
    .attr('y', NODE_LABEL_Y)
    .attr('x',function(){return -this.getBBox().width/2;})

// position the leaves
d3.selectAll('.leaf')
    .attr('r',2);
