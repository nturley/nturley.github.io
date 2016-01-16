nodesInRank =
[
  [
    {
      'inputPorts':[],
      'outputPorts':[0]
    },
    {
      'inputPorts':[],
      'outputPorts':[1]
    },
    {
      'inputPorts':[],
      'outputPorts':[2]
    }
  ],
  [
    {
      'inputPorts':[2],
      'outputPorts':[]
    },
    {
      'inputPorts':[0],
      'outputPorts':[]
    },
    {
      'inputPorts':[1],
      'outputPorts':[]
    }
  ]
];

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







function getPortY(port){
  return port.node.row*50+70+(port.node.rank%2)*20;
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
      .attr('height',40)
      .attr('x',function(d,i){d.col = rankIndex; return rankIndex*100+50;})
      .attr('y',function(d,i){d.row=i;return i*50+50+(rankIndex%2)*20;})
});
wiresInRank.forEach(function(rankWires, rankIndex){
  rankWireViews = viewer.selectAll('.wireRank'+rankIndex)
    .data(wires)
    .enter().append('g')
      .attr('class','net wireRank'+rankIndex);
  rankWireViews.append('line')
    .attr('class','wire verticalWire')
    .attr('x1',function(wire, wireIndex) {
      wire.wireIndex = wireIndex;
      return wire.rank*100+110+wireIndex*10;
    })
    .attr('x2',function(wire, wireIndex) {
      return wire.rank*100+110+wireIndex*10;
    })
    .attr('y1',function(wire){return wire.range[0];})
    .attr('y2',function(wire){return wire.range[1];})
  rankWireViews.selectAll('.leftWire')
    .data(function(wire){return wire.drivers;})
    .enter().append('line')
    .attr('class','leftWire wire')
    .attr('x1',function(port){return port.node.rank*100+90;})
    .attr('x2',function(port){return port.wire.rank*100+100+port.wire.wireIndex*10;})
    .attr('y1',getPortY)
    .attr('y2',getPortY);
    
    
});