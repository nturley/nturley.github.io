
//initialize nodes
nodeList =
[
   {
      'in' :[],
      'out':[0,1],
      'row':0.5,
   },
   {
      'in' :[0],
      'out':[2],
      'row':0,
   },
   {
      'in' :[2],
      'out':[3],
      'row':0.1,
   },
   {
      'in' :[3,4,5],
      'out':[],
      'row':0.75,
   },
   {
      'in' :[1],
      'out':[4],
      'row':1
   },
   {
      'in' :[],
      'out':[5],
      'row':2,
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
  .attr('width',500)
  .attr('height',500);

var nodeViews = viewer.selectAll('.nodeBody')
    .data(nodeList)
    .enter().append('rect')
      .attr('class','nodeBody')
      .attr('width',40)
      .attr('height',function(node){return maxPorts(node)*20+20;})
      .attr('x',50)
      .attr('y',function(node){return node.row*100+50;})
      .style('fill','white');
var wireViews = viewer.selectAll('.wire')
   .data(wires)
   .enter().append('line')
      .attr('class','wire')
      .attr('x1',90)
      .attr('x2',90)
      .attr('y1',function(wire){return nodeList[wire.inNode].row*100+70+wire.inPort*20})
      .attr('y2',function(wire){return nodeList[wire.outNode].row*100+70+wire.outPort*20})

function dfsAnimation() {
   // t0 setup
   nodeViews.transition()
      .attr('x',50)
      //turn 5 blue, t1
      .transition()
      .style('fill',function(node,index){if (index==5) return 'blue'; return 'white';})
      //move 3, t2
      .transition()
      .attr('x',function(node, index){if (index==3) return 150; return 50;})
      // turn 5 white, t3
      .transition()
      .style('fill','white')
      // turn 0 blue, t4
      .transition()
      .style('fill',function(node,index){if (index==0) return 'blue'; return 'white';})
      //move 4, t5
      .transition()
      .attr('x',function(node, index){if (index==4 || index==3) return 150; return 50;})
      //turn 4 blue, t6
      .transition()
      .style('fill',function(node,index){if (index==0 || index==4) return 'blue'; return 'white';})
      // move 3 further, t7
      .transition()
      .attr('x',function(node, index){
         if (index==4) return 150;
         if (index==3) return 250;
         return 50;
      })
      // turn 4 white, t8
      .transition()
      .style('fill',function(node,index){if (index==0) return 'blue'; return 'white';})
      //move 1, t9
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 150;
         if (index==4) return 150;
         if (index==3) return 250;
         return 50;
      })
      // turn 1 blue, t10
      .transition()
      .style('fill',function(node,index){if (index==0||index==1) return 'blue'; return 'white';})
      // move 2, t11
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 150;
         if (index==2) return 250;
         if (index==4) return 150;
         if (index==3) return 250;
         return 50;
      })
      // turn 2 blue, t12
      .transition()
      .style('fill',function(node,index){if (index==0||index==1||index==2) return 'blue'; return 'white';})
      // move 3 further, t13
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 150;
         if (index==2) return 250;
         if (index==4) return 150;
         if (index==3) return 350;
         return 50;
      })
      .transition()
      .style('fill','white')
      .each('end',startReverseDfsAnimation);

   //t0 setup
   wireViews.transition()
      //turn 5 blue, t1
      .transition()
      .style('stroke',function(wire,index){if (index==5) return 'blue'; return 'black';})
      //move 3,4,5, t2
      .transition()
      .attr('x2',function(wire, index){if (index==3||index==4||index==5) return 150; return 90;})
      // turn 5 black, t3
      .transition()
      .style('stroke','black')
      // turn 1 blue, t4
      .transition()
      .style('stroke',function(wire,index){if (index==1) return 'blue'; return 'black';})
      //move 1,4, t5
      .transition()
      .attr('x2',function(wire, index){if (index==1||index==3||index==4||index==5) return 150; return 90;})
      .attr('x1',function(wire, index){if (index==4) return 190; return 90;})
      //turn 4 blue, t6
      .transition()
      .style('stroke',function(wire,index){if (index==4) return 'blue'; return 'black';})
      //move 3,4,5, t7
      .transition()
      .attr('x2',function(wire, index){
         if (index==3||index==4||index==5) return 250;
         if (index==1) return 150;
         return 90;
      })
      // turn 0 blue, t8
      .transition()
      .style('stroke',function(wire,index){if (index==0) return 'blue'; return 'black';})
      //move 0,2 t9
      .transition()
      .attr('x2',function(wire, index){
         if (index==3||index==4||index==5) return 250;
         if (index==1||index==0) return 150;
         return 90;
      })
      .attr('x1',function(wire, index){
         if (index==4||index==2) return 190;
         return 90;
      })

      // turn 1 blue, t10
      .transition()
      .style('stroke',function(wire,index){if (index==1) return 'blue'; return 'black';})
      // move 2,3, t11
      .transition()
      .attr('x2',function(wire, index){
         if (index==2||index==3||index==4||index==5) return 250;
         if (index==1||index==0) return 150;
         return 90;
      })
      .attr('x1',function(wire, index){
         if (index==3) return 290;
         if (index==4||index==2) return 190;
         return 90;})
      // turn 3 blue, t12
      .transition()
      .style('stroke',function(wire,index){if (index==3) return 'blue'; return 'black';})
      // move 2 further, t13
      .transition()
      .attr('x2',function(wire, index){
         if (index==2) return 250;
         if (index==3||index==4||index==5) return 350;
         if (index==1||index==0) return 150;
         return 90;
      })
      .attr('x1',function(wire, index){
         if (index==3) return 290;
         if (index==4||index==2) return 190;
         return 90;})
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
      .style('fill',function(node,index){if (index==3) return 'red'; return 'white';})
      // t1 move n5 to 250
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 150;
         if (index==2) return 250;
         if (index==4) return 150;
         if (index==3) return 350;
         if (index==5) return 250;
         return 50;
      })
      //t2 move n4 to 250
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 150;
         if (index==2) return 250;
         if (index==4) return 250;
         if (index==3) return 350;
         if (index==5) return 250;
         return 50;
      })
      // t3 color n4 red
      .transition()
      .style('fill',function(node,index){if (index==3||index==4) return 'red'; return 'white';})
      // t4 move n0 to 150
      .transition()
      .attr('x',function(node, index){
         if (index==1) return 150;
         if (index==2) return 250;
         if (index==4) return 250;
         if (index==3) return 350;
         if (index==5) return 250;
         return 150;
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
         if (index==1) return 150;
         if (index==2) return 250;
         if (index==4) return 250;
         if (index==3) return 350;
         if (index==5) return 250;
         return 50;
      })
      // reset color
      .transition()
      .style('fill','white')
      .each('end',startAnimation);

   // t0 set n3 red
   wireViews.transition()
      .style('stroke',function(wire,index){if (index==5) return 'red'; return 'black';})
      // t1 move n5 to 250
      .transition()
      .attr('x1',function(wire, index){
         if (index==3||index==5) return 290;
         if (index==4||index==2) return 190;
         return 90;})
      //t2 move n4 to 250
      .transition()
      .style('stroke',function(wire,index){if (index==4) return 'red'; return 'black';})
      .attr('x1',function(wire, index){
         if (index==3||index==4||index==5) return 290;
         if (index==2) return 190;
         return 90;})
      .attr('x2',function(wire, index){
         if (index==2) return 250;
         if (index==1||index==3||index==4||index==5) return 350;
         if (index==0) return 150;
         return 90;
      })

      // t3 color n4 red

      // t4 move n0 to 150

      //t5 color n4 white

      //t6 color n2 red

      //t7 color n1 red

      //t8 move n0 50

      // reset color


}
function startAnimation(){
   setTimeout(dfsAnimation,3000);
}
dfsAnimation()

