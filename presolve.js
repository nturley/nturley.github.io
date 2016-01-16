nodesInRank =
[
  [
    {
      'inputPorts':[],
      'outputPorts':[2,1]
    },
    {
      'inputPorts':[],
      'outputPorts':[0]
    },
    {
      'inputPorts':[],
      'outputPorts':[5]
    }
  ],
  [
    {
      'inputPorts':[1,0],
      'outputPorts':[3]
    },
    {
      'inputPorts':[],
      'outputPorts':[3]
    },
    {
      'inputPorts':[2],
      'outputPorts':[4]
    },
    {
      'inputPorts':[5],
      'outputPorts':[]
    }
  ],
  [
    {
      'inputPorts':[3],
      'outputPorts':[] 
    },
    {
      'inputPorts':[4],
      'outputPorts':[] 
    }
  ]
];
function maxPorts(node){
  return d3.max([node.inputPorts.length, node.outputPorts.length]);
}
var wires = [];
nodesInRank.forEach(function(rank, rankIndex){
  rank.forEach(function(node, nodeIndex){
    node.row = nodeIndex;
    node.rank = rankIndex;
    node.inputPorts.forEach(function(wireNumber, portIndex){
      var wirePort = {'node':node,'index':portIndex};
      if (wires[wireNumber])
        wires[wireNumber].riders.push(wirePort);
      else
        wires[wireNumber] = {drivers:[],riders:[wirePort], rank:rankIndex-1}
      wirePort.wire = wires[wireNumber];
    });
    node.outputPorts.forEach(function(wireNumber, portIndex){
      var wirePort = {'node':node,'index':portIndex};
      if (wires[wireNumber])
        wires[wireNumber].drivers.push(wirePort);
      else
        wires[wireNumber] = {drivers:[wirePort],riders:[],rank:rankIndex};
      wirePort.wire = wires[wireNumber];
    });
  })
});

var wiresInRank = [];
wires.forEach(function(wire){
  if (wiresInRank[wire.rank])
    wiresInRank[wire.rank].push(wire);
  else
    wiresInRank[wire.rank]=[wire];
});

function lexicographicCompare(list1, list2) {
  var i=0;
  while (d3.max([list1.length,list2.length]) > i) {
    var val1 = list1[d3.min([list1.length-1,i])];
    var val2 = list2[d3.min([list2.length-1,i])];
    if (val1 != val2) return val2 - val1;
    i+=1;
  }
  return 0;
}

//nodesInRank[0].sort(function (node1, node2){ return lexicographicCompare(node1.outputPorts, node2.outputPorts);});
//nodesInRank[1].sort(function (node1, node2){ return lexicographicCompare(node1.inputPorts, node2.inputPorts);});

nodesInRank.forEach(function(rank){
  rank.forEach(function(node, nodeIndex){
    node.row = nodeIndex;
  });
});

function getPortY(port){
  return port.node.row*100+70+(port.node.rank%2)*15+port.index*20;
}

wires.forEach(function(wire){
  var allPorts = wire.drivers.concat(wire.riders);
  wire.range = d3.extent(allPorts, getPortY);
});

var viewer = d3.select('#viewer');
viewer
  .attr('width',500)
  .attr('height',500);

nodesInRank.forEach(function(rank,rankIndex){
  viewer.selectAll('.rank'+rankIndex)
    .data(rank)
    .enter().append('rect')
      .attr('class','nodeBody rank'+rankIndex)
      .attr('width',40)
      .attr('height',function(node){return maxPorts(node)*20+20;})
      .attr('x',function(d,i){d.col = rankIndex; return rankIndex*120+50;})
      .attr('y',function(d,i){d.row=i;return i*100+50+(rankIndex%2)*15;})
});

wiresInRank.forEach(function(rankWires, rankIndex){
  rankWireViews = viewer.selectAll('.wireRank'+rankIndex)
    .data(rankWires)
    .enter().append('g')
      .attr('class','net wireRank'+rankIndex);
  rankWireViews.append('line')
    .attr('class','wire verticalWire')
    .attr('x1',function(wire, wireIndex) {
      wire.wireIndex = wireIndex;
      return wire.rank*120+110+wireIndex*10;
    })
    .attr('x2',function(wire, wireIndex) {
      return wire.rank*120+110+wireIndex*10;
    })
    .attr('y1',function(wire){return wire.range[0];})
    .attr('y2',function(wire){return wire.range[1];})
  rankWireViews.selectAll('.leftWire')
    .data(function(wire){return wire.drivers;})
    .enter().append('line')
    .attr('class','leftWire wire')
    .attr('x1',function(port){return port.node.rank*120+90;})
    .attr('x2',function(port){return port.wire.rank*120+110+port.wire.wireIndex*10;})
    .attr('y1',getPortY)
    .attr('y2',getPortY);
  rankWireViews.selectAll('.rightWire')
    .data(function(wire){return wire.riders;})
    .enter().append('line')
    .attr('class','leftRight wire')
    .attr('x1',function(port){return port.node.rank*120+50;})
    .attr('x2',function(port){return port.wire.rank*120+110+port.wire.wireIndex*10;})
    .attr('y1',getPortY)
    .attr('y2',getPortY);
});