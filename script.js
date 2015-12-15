// Deserialize json data, make it usable for d3
// by the end of it, we have inputPorts, outputPorts, and cells.
// all of which will conform to the same interface

function arrayToBitstring(bitArray) {
  ret = ""
  for (var i in bitArray) {
    var bit = bitArray[i]
    if (ret=="") {
      ret = bit
    } else {
      ret += ','+bit
    }
  }
  return ','+ret+','
}

function arrayContains(needle, arrhaystack)
{
    return (arrhaystack.indexOf(needle) > -1);
}

function indexOfContains(needle, arrhaystack)
{
  for (var i in arrhaystack) {
    if (arrayContains(needle, arrhaystack[i])) {
      return i
    }
  }
  return -1
}

function getBits(signals, indicesString) {

  var index = indicesString.indexOf(':')
  if (index==-1) {
    return [signals[indicesString]]
  } else {
    var start = indicesString.slice(0,index)
    var end = indicesString.slice(index+1)
    var slice = signals.slice(Number(start),Number(end)+1)
    return slice
  }
}

function addToDefaultDict(dict, key, value) {
  if (dict[key]==undefined) {
    dict[key]=[value]
  } else {
    dict[key].push(value)
  }
}

function getIndicesString(bitstring, query) {
  splitStart = bitstring.indexOf(query)
  splitEnd = splitStart + query.length
  startIndex = bitstring.substring(0,splitStart).split(',').length-1;
  endIndex = startIndex + query.split(',').length-3;
  
  if (startIndex == endIndex) {
    return startIndex+""
  } else {
    return startIndex+":"+endIndex
  }
}

function gather(inputs,
                outputs,
                toSolve, // element of outputs we are trying to solve
                start, // index of toSolve to start from
                end, //index of toSolve to end at
                splits,
                joins) {
  // remove myself from outputs list
  var index = outputs.indexOf(toSolve)
  if (arrayContains(toSolve, outputs)) {
    outputs.splice(index, 1);
  }

  // This toSolve is complete
  if (start >= toSolve.length || end - start < 2) {
    return
  }

  var query = toSolve.slice(start, end);

  // are there are perfect matches?
  if (arrayContains(query, inputs)) {
    if (query != toSolve) {

      addToDefaultDict(joins, toSolve, getIndicesString(toSolve,query))
    }
    gather(inputs, outputs, toSolve, end-1, toSolve.length, splits, joins)
    return
  }
  var index = indexOfContains(query, inputs);
  // are there any partial matches?
  if (index != -1) {
    if (query != toSolve) {
      addToDefaultDict(joins, toSolve, getIndicesString(toSolve,query))
    }
    // found a split
    addToDefaultDict(splits, inputs[index], getIndicesString(inputs[index],query))
    // we can match to this now
    inputs.push(query)
    gather(inputs, outputs, toSolve, end-1, toSolve.length, splits, joins)
    return
  }
  // are there any output matches?
  if (indexOfContains(query, outputs) != -1) {
    if (query != toSolve) {
      //add to join
      addToDefaultDict(joins, toSolve, getIndicesString(toSolve,query))
    }
    // gather without outputs

    gather(inputs, [], query, 0, query.length, splits, joins)
    inputs.push(query)
    return
  }

  gather(inputs, outputs, toSolve, start, start+ query.slice(0,-1).lastIndexOf(',')+1, splits, joins)
}

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
    return d3.map(cell.connections).entries().filter(
        function(d){
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
                cells.push({
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
            cells.push({
                  "key": '$constant_'+arrayToBitstring(constants),
                  "hide_name": 1,
                  "type": name,
                  "inputPorts":[],
                  "outputPorts":[{'key':'Y','value':constants}]
                });
    });
});
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

// also give each port a reference to it's parent (daddy)
// collect all ports driven by a net
nets= {}
nodes.forEach(function(n) 
{
    var nodeName = n.key;
    n.inputPorts.forEach(function(i)
    {
        i.daddy = n;
        addToDefaultDict(nets,arrayToBitstring(i.value),{'value':i});
    });
});
// build a list of wire objects that hold references to the ports the net connects to
wires = [];
nodes.forEach(function(n) 
{
    var nodeName = n.key;
    n.outputPorts.forEach(function(i)
    {
        i.daddy = n;
        riders = nets[arrayToBitstring(i.value)];
        var wire = {'driver':i,'riders':riders};
        wires.push(wire);
        i.wire = wire;
        riders.forEach(function(r)
        {
            r.driver=i;
            r.value.wire = wire;
        });
    });
});

// tag feedback wires

// find all root nodes (only inputs)
var rootNodes = nodes.filter(function(d) {
    return d.inputPorts.length == 0;
});

// DFS to detect cycles
function visitDependents(n, visited)
{
    visited[n.key] = true;
    n.outputPorts.forEach(function(p)
    {
        p.wire.riders.forEach(function(r){
            if (n.type == '$dff') {
                    r.feedback = true;
            }
            if (!(r.value.daddy.key in visited)) {
                visitDependents(r.value.daddy, visited);
            } else {
                if (n.type == '$dff') {
                    r.value.feedback = true;
                }
            }
        });
    });
}

rootNodes.forEach(function(n)
{
    visitDependents(n,{});
});
//-------------------------------------
// create SVG objects for each data object and assign them classes

var viewer = d3.select('#viewer');

var cellViews = viewer.selectAll('.cell')
    .data(cells)
    .enter().append('g')
        .attr('class','cell node generic');

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
        .selectAll('.wire')
            .data(function(d){return d.riders})
            .enter().append('g')
                .attr('class','wire')

wireViews.append('line')
    .attr('class', 'wirestart');
wireViews.append('line')
    .attr('class','wiremiddle');
wireViews.append('line')
    .attr('class','wireend')


//-----------------------------
// Assign all other attributes to each SVG object

// positioning constants
var VIEWER_WIDTH = 1500;
var VIEWER_HEIGHT = 1000;
var EDGE_NODE_GAP = 20;
var NODE_GAP = 80;
var BODY_WIDTH = 40;
var LEAF_DIAMETER = 6;
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

for (var i in inputPorts)
{
    inputPorts[i].x = 50;
    inputPorts[i].y = nodeScale(i);
}

for (var i in cells)
{
    cells[i].x = 300;
    cells[i].y = nodeScale(i);
}

for (var i in outputPorts)
{
    outputPorts[i].x = 550;
    outputPorts[i].y = nodeScale(i);
}

for (var i in nodes)
{
    var node = nodes[i];
    for (var j in node.inputPorts)
    {
        node.inputPorts[j].x = -BODY_WIDTH/2 - STEM_LENGTH;
        node.inputPorts[j].y = portScale(j);
    }
    for (var j in node.outputPorts)
    {
        node.outputPorts[j].x = BODY_WIDTH/2 + STEM_LENGTH;
        node.outputPorts[j].y = portScale(j);
    }
}

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
    return p.x+p.daddy.x;
}

function globalY(p)
{
    return p.y+p.daddy.y-genericHeight(p.daddy)/2;
}

function x2(d)
{
    if (globalX(d.driver) < globalX(d.value))
        return (globalX(d.value) + globalX(d.driver)) / 2;
    return globalX(d.driver);
}

function y2(d)
{
    if (globalX(d.driver) < globalX(d.value))
        return globalY(d.driver);
    return (globalY(d.value) + globalY(d.driver)) / 2;
}

function x3(d)
{
    if (globalX(d.driver) < globalX(d.value))
        return (globalX(d.value) + globalX(d.driver)) / 2;
    return globalX(d.value);
}
function y3(d)
{
    if (globalX(d.driver) < globalX(d.value))
        return globalY(d.value);
    return (globalY(d.value) + globalY(d.driver)) / 2;
}


function updateWires()
{
    d3.selectAll('.wire').selectAll('.wirestart')
        .attr('x1',function(d)
            {
                return d.driver.x + d.driver.daddy.x;
            })
        .attr('y1',function(d)
            {
                return globalY(d.driver);
            })
        .attr('x2',x2)
        .attr('y2',y2);
    d3.selectAll('.wire').selectAll('.wiremiddle')
        .attr('x1',x2)
        .attr('y1',y2)
        .attr('x2',x3)
        .attr('y2',function(d)
            {
                if (globalX(d.driver) < globalX(d.value))
                    return globalY(d.value);
                return (globalY(d.value) + globalY(d.driver)) / 2;
            });
    d3.selectAll('.wire').selectAll('.wireend')
        .attr('x1',x3)
        .attr('y1',y3)
        .attr('x2',function(d)
            {
                return d.value.x + d.value.daddy.x;
            })
        .attr('y2',function(d)
            {
                return globalY(d.value);
            });
}


updateWires();
updateNodes();
// size the viewer (assumes there are more cells than in/outputPorts)
d3.select('#viewer')
    .attr('width',VIEWER_WIDTH)
    .attr('height',VIEWER_HEIGHT);


function pullRider(driver, rider, pullX, pullY, offset)
{
    if (rider.feedback==true)
        return;
    var mx = globalX(driver);
    var my = globalY(driver);
    var rx = globalX(rider);
    var ry = globalY(rider);
    var dx = mx-rx-offset;
    var dy = my-ry;
    rider.daddy.x += dx*pullX;
    rider.daddy.y += dy*pullY;
}

function wirePull(pullX, pullY, offset, alpha)
{
    return function(node){
        if (node.fixed) {
            return;
        }
        node.inputPorts.forEach(function(i)
        {
            pullRider(i.wire.driver, i, pullX*alpha, pullY*alpha, offset);          
        });
        node.outputPorts.forEach(function(o)
        {
            o.wire.riders.forEach(function(r)
            {
                pullRider(o, r.value, pullX*alpha, pullY*alpha, offset);
            });
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
function getCharge(d)
{
    var c = document.getElementById('chargeRange').value;
    d3.select('#chargeSpan').text(c);
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
    d3.selectAll('.node').each(wirePull(getPullX(), getPullY(), -getPullXOffset(), e.alpha));
    updateNodes();
    updateWires();
}

var force = d3.layout.force()
    .nodes(nodes)
    .size([VIEWER_WIDTH, VIEWER_HEIGHT])
    .gravity(getGravity())
    .charge(getCharge())
    .on('tick',tick);

var drag = force.drag()
    .on("dragstart", dragstart);

force
    .start();

d3.selectAll('.node')
    .call(drag);

d3.selectAll('input').on('change',function()
    {
        force
            .nodes(nodes)
            .gravity(getGravity())
            .charge(getCharge())
            .start();
    });

function releaseNode(n)
{
    n.fixed = false;
    force.resume();
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
    .attr('r',LEAF_RADIUS);
