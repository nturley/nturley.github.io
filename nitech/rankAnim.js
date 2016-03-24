
//initialize nodes
nodeList =
[
   {
      'in' :[],
      'out':[0,1],
      'row':0.5,
      'label':'A'
   },
   {
      'in' :[0],
      'out':[2],
      'row':0,
      'label':'B'
   },
   {
      'in' :[2],
      'out':[3],
      'row':0.1,
      'label':'C'
   },
   {
      'in' :[3,4,5],
      'out':[],
      'row':0.75,
      'label':'D'
   },
   {
      'in' :[1],
      'out':[4],
      'row':1,
      'label':'E'
   },
   {
      'in' :[],
      'out':[5],
      'row':2,
      'label':'F'
   },
];
// initialize wires
wires = [];
nodeList.forEach(function(node, nodeNum){
   node.in.forEach(function(wireNum, portNum){
      if (wires[wireNum]) {
         wires[wireNum].outNode = nodeNum;
         wires[wireNum].outPort = portNum
      } else {
         wires[wireNum] = {'outNode':nodeNum,'outPort':portNum}
      }
   });
   node.out.forEach(function(wireNum, portNum){
      if (wires[wireNum]) {
         wires[wireNum].inNode = nodeNum;
         wires[wireNum].inPort = portNum
      } else {
         wires[wireNum] = {'inNode':nodeNum,'inPort':portNum}
      }
   });
});

function maxPorts(node){
  return d3.max([node.in.length, node.out.length]);
}

var viewer = d3.select('#viewer');
viewer
  .attr('width',1000)
  .attr('height',600);

var nodeViews = viewer.selectAll('.nodeBody')
    .data(nodeList)
    .enter().append('rect')
      .attr('class','nodeBody')
      .attr('width',80)
      .attr('height',function(node){return maxPorts(node)*40+40;})
      .attr('x',100)
      .attr('y',function(node){return node.row*200+100;})
      .style('fill','white');

var nodeLabels = viewer.selectAll('.label')
   .data(nodeList)
   .enter().append('text')
   .attr('class','label')
   .text(function(d){return d.label})
   .attr('x',140)
   .attr('y',function(node){return node.row*200+150;})

var wireViews = viewer.selectAll('.wire')
   .data(wires)
   .enter().append('line')
      .attr('class','wire')
      .attr('x1',180)
      .attr('x2',180)
      .attr('y1',function(wire){return nodeList[wire.inNode].row*200+140+wire.inPort*40})
      .attr('y2',function(wire){return nodeList[wire.outNode].row*200+140+wire.outPort*40})

function dfsAnimation() {
   // t0 setup
   nodeViews.transition()
   .duration(500)
      .attr('x',100)
      //turn 5 blue, t1
      .transition()
      .style('fill',function(node,index){if (index==5) return 'blue'; return 'white';})
      //move 3, t2
      .transition()
      .attr('x',function(node, index){if (index==3) return 300; return 100;})
      // turn 5 white, t3
      .transition()
      .style('fill','white')
      // turn 0 blue, t4
      .transition()
      .style('fill',function(node,index){if (index==0) return 'blue'; return 'white';})
      //move 4, t5
      .transition()
      .attr('x',function(node, index){if (index==4 || index==3) return 300; return 100;})
      //turn 4 blue, t6
      .transition()
      .style('fill',function(node,index){if (index==0 || index==4) return 'blue'; return 'white';})
      // move 3 further, t7
      .transition()
      .attr('x',function(node, index){
         if (index==4) return 300;
         if (index==3) return 500;
         return 100;
      })
      // turn 4 white, t8
      .transition()
      .style('fill',function(node,index){if (index==0) return 'blue'; return 'white';})
      //move 1, t9
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 300;
         if (index==4) return 300;
         if (index==3) return 500;
         return 100;
      })
      // turn 1 blue, t10
      .transition()
      .style('fill',function(node,index){if (index==0||index==1) return 'blue'; return 'white';})
      // move 2, t11
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 300;
         if (index==2) return 500;
         if (index==4) return 300;
         if (index==3) return 500;
         return 100;
      })
      // turn 2 blue, t12
      .transition()
      .style('fill',function(node,index){if (index==0||index==1||index==2) return 'blue'; return 'white';})
      // move 3 further, t13
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 300;
         if (index==2) return 500;
         if (index==4) return 300;
         if (index==3) return 700;
         return 100;
      })
      .transition()
      .style('fill','white')
      .each('end',startReverseDfsAnimation);

      // t0 setup
   nodeLabels.transition()
   .duration(500)
      .attr('x',140)
      //turn 5 blue, t1
      .transition()
      .style('fill',function(node,index){if (index==5) return 'white'; return 'black';})
      //move 3, t2
      .transition()
      .attr('x',function(node, index){if (index==3) return 340; return 140;})
      // turn 5 white, t3
      .transition()
      .style('fill','black')
      // turn 0 blue, t4
      .transition()
      .style('fill',function(node,index){if (index==0) return 'white'; return 'black';})
      //move 4, t5
      .transition()
      .attr('x',function(node, index){if (index==4 || index==3) return 340; return 140;})
      //turn 4 blue, t6
      .transition()
      .style('fill',function(node,index){if (index==0 || index==4) return 'white'; return 'black';})
      // move 3 further, t7
      .transition()
      .attr('x',function(node, index){
         if (index==4) return 340;
         if (index==3) return 540;
         return 140;
      })
      // turn 4 white, t8
      .transition()
      .style('fill',function(node,index){if (index==0) return 'white'; return 'black';})
      //move 1, t9
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 340;
         if (index==4) return 340;
         if (index==3) return 540;
         return 140;
      })
      // turn 1 blue, t10
      .transition()
      .style('fill',function(node,index){if (index==0||index==1) return 'white'; return 'black';})
      // move 2, t11
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 340;
         if (index==2) return 540;
         if (index==4) return 340;
         if (index==3) return 540;
         return 140;
      })
      // turn 2 blue, t12
      .transition()
      .style('fill',function(node,index){if (index==0||index==1||index==2) return 'white'; return 'black';})
      // move 3 further, t13
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 340;
         if (index==2) return 540;
         if (index==4) return 340;
         if (index==3) return 740;
         return 140;
      })
      .transition()
      .style('fill','black')

   //t0 setup
   wireViews.transition()
   .duration(500)
      .attr('x1',180)
      .attr('x2',180)
      //turn 5 blue, t1
      .transition()
      .style('stroke',function(wire,index){if (index==5) return 'blue'; return 'black';})
      //move 3,4,5, t2
      .transition()
      .attr('x2',function(wire, index){if (index==3||index==4||index==5) return 300; return 180;})
      // turn 5 black, t3
      .transition()
      .style('stroke','black')
      // turn 1 blue, t4
      .transition()
      .style('stroke',function(wire,index){if (index==1) return 'blue'; return 'black';})
      //move 1,4, t5
      .transition()
      .attr('x2',function(wire, index){if (index==1||index==3||index==4||index==5) return 300; return 180;})
      .attr('x1',function(wire, index){if (index==4) return 380; return 180;})
      //turn 4 blue, t6
      .transition()
      .style('stroke',function(wire,index){if (index==4) return 'blue'; return 'black';})
      //move 3,4,5, t7
      .transition()
      .attr('x2',function(wire, index){
         if (index==3||index==4||index==5) return 500;
         if (index==1) return 300;
         return 180;
      })
      // turn 0 blue, t8
      .transition()
      .style('stroke',function(wire,index){if (index==0) return 'blue'; return 'black';})
      //move 0,2 t9
      .transition()
      .attr('x2',function(wire, index){
         if (index==3||index==4||index==5) return 500;
         if (index==1||index==0) return 300;
         return 180;
      })
      .attr('x1',function(wire, index){
         if (index==4||index==2) return 380;
         return 180;
      })

      // turn 1 blue, t10
      .transition()
      .style('stroke',function(wire,index){if (index==1) return 'blue'; return 'black';})
      // move 2,3, t11
      .transition()
      .attr('x2',function(wire, index){
         if (index==2||index==3||index==4||index==5) return 500;
         if (index==1||index==0) return 300;
         return 180;
      })
      .attr('x1',function(wire, index){
         if (index==3) return 580;
         if (index==4||index==2) return 380;
         return 180;})
      // turn 3 blue, t12
      .transition()
      .style('stroke',function(wire,index){if (index==3) return 'blue'; return 'black';})
      // move 2 further, t13
      .transition()
      .attr('x2',function(wire, index){
         if (index==2) return 500;
         if (index==3||index==4||index==5) return 700;
         if (index==1||index==0) return 300;
         return 180;
      })
      .attr('x1',function(wire, index){
         if (index==3) return 580;
         if (index==4||index==2) return 380;
         return 180;})
      // reset color, t14
      .transition()
      .style('stroke','black')
}
function startReverseDfsAnimation(){
   setTimeout(reverseDfsAnimation,1000);
}
function reverseDfsAnimation(){
      // t0 set n3 red
   nodeViews.transition()
      .duration(500)
      .style('fill',function(node,index){if (index==3) return 'red'; return 'white';})
      // t1 move n5 to 250
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 300;
         if (index==2) return 500;
         if (index==4) return 300;
         if (index==3) return 700;
         if (index==5) return 500;
         return 100;
      })
      //t2 move n4 to 250
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 300;
         if (index==2) return 500;
         if (index==4) return 500;
         if (index==3) return 700;
         if (index==5) return 500;
         return 100;
      })
      // t3 color n4 red
      .transition()
      .style('fill',function(node,index){if (index==3||index==4) return 'red'; return 'white';})
      // t4 move n0 to 150
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 300;
         if (index==2) return 500;
         if (index==4) return 500;
         if (index==3) return 700;
         if (index==5) return 500;
         return 300;
      })
      //t5 color n4 white
      .transition()
      .style('fill',function(node,index){if (index==3) return 'red'; return 'white';})
      //t6 color n2 red
      .transition()
      .style('fill',function(node,index){if (index==3||index==2) return 'red'; return 'white';})
      //t7 color n1 red
      .transition()
      .style('fill',function(node,index){if (index==3||index==2||index==1) return 'red'; return 'white';})
      //t8 move n0 50
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 300;
         if (index==2) return 500;
         if (index==4) return 500;
         if (index==3) return 700;
         if (index==5) return 500;
         return 100;
      })
      // reset color
      .transition()
      .style('fill','white')
      .each('end',startAnimation);

      // t0 set n3 red
   nodeLabels.transition()
   .duration(500)
      .style('fill',function(node,index){if (index==3) return 'white'; return 'black';})
      // t1 move n5 to 250
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 340;
         if (index==2) return 540;
         if (index==4) return 340;
         if (index==3) return 740;
         if (index==5) return 540;
         return 140;
      })
      //t2 move n4 to 250
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 340;
         if (index==2) return 540;
         if (index==4) return 540;
         if (index==3) return 740;
         if (index==5) return 540;
         return 140;
      })
      // t3 color n4 red
      .transition()
      .style('fill',function(node,index){if (index==3||index==4) return 'white'; return 'black';})
      // t4 move n0 to 150
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 340;
         if (index==2) return 540;
         if (index==4) return 540;
         if (index==3) return 740;
         if (index==5) return 540;
         return 340;
      })
      //t5 color n4 white
      .transition()
      .style('fill',function(node,index){if (index==3) return 'white'; return 'black';})
      //t6 color n2 red
      .transition()
      .style('fill',function(node,index){if (index==3||index==2) return 'white'; return 'black';})
      //t7 color n1 red
      .transition()
      .style('fill',function(node,index){if (index==3||index==2||index==1) return 'white'; return 'black';})
      //t8 move n0 50
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 340;
         if (index==2) return 540;
         if (index==4) return 540;
         if (index==3) return 740;
         if (index==5) return 540;
         return 140;
      })
      // reset color
      .transition()
      .style('fill','black')
      .each('end',startAnimation);

   // t0 set n3 red
   wireViews.transition()
   .duration(500)
      .style('stroke',function(wire,index){if (index==5) return 'red'; return 'black';})
      // t1 move n5 to 250
      .transition()
      .attr('x1',function(wire, index){
         if (index==3||index==5) return 580;
         if (index==4||index==2) return 380;
         return 180;})
      //t2 move n4 to 250
      .transition()
      .style('stroke',function(wire,index){if (index==4) return 'red'; return 'black';})
      .attr('x1',function(wire, index){
         if (index==3||index==4||index==5) return 580;
         if (index==2) return 380;
         return 180;})
      .attr('x2',function(wire, index){
         if (index==1||index==2) return 500;
         if (index==3||index==4||index==5) return 700;
         if (index==0) return 300;
         return 180;
      })
      // t3 color n4 red
      .transition()
      .style('stroke',function(wire,index){if (index==1) return 'red'; return 'black';})
      // t4 move n0 to 150
      .transition()
      .attr('x1',function(wire, index){
         if (index==3||index==4||index==5) return 580;
         if (index==2) return 380;
         return 380;})
      .attr('x2',function(wire, index){
         if (index==1||index==2) return 500;
         if (index==3||index==4||index==5) return 700;
         if (index==0) return 300;
         return 180;
      })
      //t5 color n4 white
      .transition()
      .style('stroke','black')
      //t6 color n2 red
      .transition()
      .style('stroke',function(wire,index){if (index==2) return 'red'; return 'black';})

      //t7 color n1 red
      .transition()
      .style('stroke',function(wire,index){if (index==0) return 'red'; return 'black';})

      //t8 move n0 50
      .transition()
      .attr('x1',function(wire, index){
         if (index==3||index==4||index==5) return 580;
         if (index==2) return 380;
         return 180;})
      .attr('x2',function(wire, index){
         if (index==1||index==2) return 500;
         if (index==3||index==4||index==5) return 700;
         if (index==0) return 300;
         return 180;
      })

      // reset color
      .transition()
      .style('stroke','black')


}
function startAnimation(){
   setTimeout(dfsAnimation,3000);
}
dfsAnimation()

