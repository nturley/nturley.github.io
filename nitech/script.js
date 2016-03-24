var nodes =
[
  {
    input:0,
    output:1,
    name:'A',
    rank:0,
  },
  {
    input:1,
    output:2,
    name:'B',
    rank:1
  },
  {
    input:2,
    output:0,
    name:'C',
    rank:2
  },
];

var wires =
[
  {
    driver:2,
    rider:0
  },
  {
    driver:0,
    rider:1
  },
  {
    driver:1,
    rider:2
  }
];

var viewer = d3.select('#viewer');
viewer
  .attr('width',600)
  .attr('height',300);

var nodeViews = viewer.selectAll('.node')
  .data(nodes)
  .enter().append('g')
    .attr('class','node')
    .attr('transform',function(d){return 'translate('+(160+d.rank*160)+','+140+')';})

nodeViews.append('rect')
  .attr('class','nodeBody')
  .attr('x',-40)
  .attr('y',-40)
  .attr('width',80)
  .attr('height',80);
  
nodeViews.append('text')
  .attr('class','label')
  .text(function(d){return d.name})
  .attr('y',14);

var wireViews = viewer.selectAll('.net')
  .data(wires)
  .enter().append('g')
    .attr('class','net');

wireViews
  .style('stroke',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return '#000'; return '#f00';})


wireViews.append('line')
  .attr('class','wire middle')
  .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+220;})
  .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+100;})
  .attr('y1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return 140; return 240;})
  .attr('y2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return 140; return 240;})
  
wireViews.append('line')
  .attr('class','wire right')
  .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+220;})
  .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+220;})
  .attr('y1',140)
  .attr('y2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return 140; return 240;})
  
wireViews.append('line')
  .attr('class','wire left')
  .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+100;})
  .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+100;})
  .attr('y1',140)
  .attr('y2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return 140; return 240;})
  

wireViews.append('line')
  .attr('class','wire leftNub')
  .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+100;})
  .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+120;})
  .attr('y1',140)
  .attr('y2',140)
  

wireViews.append('line')
  .attr('class','wire rightNub')
  .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+220;})
  .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+200;})
  .attr('y1',140)
  .attr('y2',140)
  

viewer.on('click', function() {
  var temp =nodes[0].rank;
  nodes[0].rank=nodes[1].rank;
  nodes[1].rank=nodes[2].rank;
  nodes[2].rank=temp;
  update();
});

function update()
{
  nodeViews.transition()
    .duration(1000)
    .attr('transform',function(d){return 'translate('+(160+d.rank*160)+','+140+')';})

  wireViews
    .style('stroke',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return '#000'; return '#f00';})


  viewer.selectAll('.middle')
    .transition()
      .duration(1000)
      .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+220;})
      .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+100;})
      .attr('y1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return 140; return 240;})
      .attr('y2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return 140; return 240;})
      
  viewer.selectAll('.right')
    .transition()
      .duration(1000)
      .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+220;})
      .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+220;})
      .attr('y1',140)
      .attr('y2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return 140; return 240;})
 
viewer.selectAll('.left')
    .transition()
      .duration(1000)
  .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+100;})
  .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+100;})
  .attr('y1',140)
  .attr('y2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return 140; return 240;})
  
viewer.selectAll('.leftNub')
    .transition()
      .duration(1000)
  .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+100;})
  .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.rider].rank*160+120; return nodes[d.rider].rank*160+120;})
  .attr('y1',140)
  .attr('y2',140)
  
viewer.selectAll('.rightNub')
    .transition()
      .duration(1000)
  .attr('x1',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+220;})
  .attr('x2',function(d){if (nodes[d.driver].rank<nodes[d.rider].rank) return nodes[d.driver].rank*160+200; return nodes[d.driver].rank*160+200;})
  .attr('y1',140)
  .attr('y2',140)
  
}

