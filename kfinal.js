// gets the verilog from the editor and kicks off yosys
function synthesizeVerilog()
{
    editor.session.clearAnnotations();
    ys.write_file("input.v", editor.getValue());
    ys.run('design -reset; read_verilog input.v; proc; opt_clean; write_json output.json', handle_run_errors);
    ys.read_file('output.json', drawModule);
}

// processes the module json and creates View objects
function drawModule(moduleString)
{
    // The input data is static. No user interaction will
    // change it, and it will not need to propagate any additional
    // information to the view. So we're going to essentially
    // transform it into a structure (controller? view model? presenter?)
    // that holds information in a form that is easy for the view
    // to access.
    var modules = toArray(JSON.parse(moduleString).modules);
    var module = getReformattedModule(modules[0]);
    addConstants(module);
    addSplitsJoins(module);
    createWires(module);
    var graph = buildKGraph(module);
    console.log(graph);
    $klay.layout({
      graph: graph,
      options: { spacing: 20, borderSpacing: 50, nodeLayering: 'LONGEST_PATH' },
      success: function(layouted) {
        console.log('layout complete')
        console.log(layouted);
        extractPosition(module, layouted);
        console.log(module);
        var viewObjects = createViewObjects(module);
        // draws viewObjects and positions interior elements
        buildNodes(viewObjects);
        buildWires(viewObjects);
        updatePositions(viewObjects);
      },
      error: function(error) { console.log(error); }
    });

}

// returns a reformatted module
function getReformattedModule(module)
{
    var ports= toArray(module.ports);
    var flatModule =
    {
        'inputPorts' : ports.filter(function(p){return p.direction=='input'}),
        'outputPorts': ports.filter(function(p){return p.direction=='output'}),
        'cells':toArray(module.cells)
    };
    flatModule.inputPorts.forEach(function(p){p.type="$_inputExt_";});
    flatModule.outputPorts.forEach(function(p){p.type="$_outputExt_";});
    flatModule.cells.forEach(function(c)
    {
        c.inputPorts = getCellPortList(c,"input");
        c.outputPorts = getCellPortList(c,"output");
    });
    flatModule.inputPorts.forEach(function(p)
    {
        p.inputPorts = [];
        p.outputPorts = [{'key':p.key,'value':p.bits}];
    });
    flatModule.outputPorts.forEach(function(p)
    {
        p.inputPorts = [{'key':p.key,'value':p.bits}];
        p.outputPorts = [];
    });
    flatModule.nodes = flatModule.inputPorts
                        .concat(flatModule.outputPorts)
                        .concat(flatModule.cells);
    return flatModule;
}

// converts input ports with constant assignments to constant nodes
function addConstants(module)
{
    // find the maximum signal number
    var maxNum=-1;
    module.nodes.forEach(function(n)
    {
        n.outputPorts.forEach(function(p) {
        maxNum = d3.max([maxNum,d3.max(p.value)])
        });
    });

    // add constants to cells
    module.nodes.forEach(function(n)
    {
        n.inputPorts.forEach(function(p)
        {
            name = "";
            constants = [];
            var lastNode = null;
            for (var i in p.value) {
                if (p.value[i]<2)
                {
                    maxNum += 1;
                    name+=p.value[i];
                    p.value[i] = maxNum;
                    constants.push(maxNum);
                    lastNode = n;
                }
                else if (constants.length>0)
                {
                    var constant = {
                        "key": name.split('').reverse().join(''),
                        "hide_name": 1,
                        "type": '$_constant_',
                        "inputPorts":[],
                        "outputPorts":[{'key':'Y','value':constants}]
                    }
                    if (n.attributes.src) {
                      constant.attributes ={'src':n.attributes.src};
                    }
                    module.cells.push(constant);
                    name='';
                    constants = [];
                }
            }
            if (constants.length>0)
            {
                var constant = {
                    "key": name.split('').reverse().join(''),
                    "hide_name": 1,
                    "type": '$_constant_',
                    "inputPorts":[],
                    "outputPorts":[{'key':'Y','value':constants}]
                }
                if (lastNode.attributes.src) {
                    constant.attributes ={'src':lastNode.attributes.src};
                }
                module.cells.push(constant);
            }
        });
    });
    module.nodes = module.inputPorts
                        .concat(module.outputPorts)
                        .concat(module.cells);
}

// solves for minimal bus splits and joins and adds them to module
function addSplitsJoins(module)
{
    var allInputs = [];
    var allOutputs = [];
    module.nodes.forEach(function(n)
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
        var signals = join.slice(1,-1).split(',');
        for (var i in signals) {
          signals[i] = Number(signals[i])
        }
        var outPorts = [{'key':'Y','value':signals}];
        var inPorts = [];
        for (var i in joins[join]) {
            var name = joins[join][i];
            var value = getBits(signals, name);
          inPorts.push({'key':name,'value':value});
        }
        module.cells.push({"key":'$join$'+join,
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
        var inPorts = [{'key':'A','value':signals}];
        var outPorts = [];
        for (var i in splits[split]) {
            var name = splits[split][i];
            var value = getBits(signals, name);
          outPorts.push({'key':name,'value':value});
        }
        module.cells.push({"key":'$split$'+split,
          "hide_name": 1,
          "type": "$_split_",
          "inputPorts":inPorts,
          "outputPorts":outPorts});
    }
    //refresh nodes
    module.nodes = module.inputPorts
                    .concat(module.outputPorts)
                    .concat(module.cells);
}

function buildKGraph(module)
{
    kgraph =
    {
        id:'module',
        children : [],
        edges : []
    };
    module.nodes.forEach(function(n)
    {
        child =
        {
            id: n.key,
            width: 80,
            height: 40,
            ports: []
        };
        n.inputPorts.forEach(function(p) {
            child.ports.push({
                id: n.key + '.' + p.key,
                width: 3,
                height: 3
            });
        });
        n.outputPorts.forEach(function(p) {
            child.ports.push({
                id: n.key + '.' + p.key,
                width: 3,
                height: 3
            });
        });

        kgraph.children.push(child);
    });
    var i =0;
    module.wires.forEach(function(w) {
        var sourceParentKey = w.drivers[0].parentNode.key;
        var sourceKey = sourceParentKey + '.' + w.drivers[0].key;

        w.riders.forEach(function (r) {
            var targetParentKey = r.parentNode.key;
            var targetKey = targetParentKey + '.' + r.key;
            var edge = {
                id: 'e' + i,
                source: sourceParentKey,
                sourcePort: sourceKey,
                target: targetParentKey,
                targetPort: targetKey
            };
            if (w.drivers[0].parentNode.type != '$dff') {
                edge.properties = {"de.cau.cs.kieler.priority":1}
            }
            kgraph.edges.push(edge);
        });
    });
    return kgraph;
}

function extractPosition(module, kgraph)
{
    module.nodes.forEach(function(n)
    {
        for (i in kgraph.children) {
            child = kgraph.children[i];
            if (child.id == n.key) {
                n.x = child.x;
                n.y = child.y;
            }
        }
    });
}

// iterates ports to create wire objects and add them to module
function createWires(module)
{
    nets= {}
    module.nodes.forEach(function(n)
    {
        var nodeName = n.key;
        for (var i in n.inputPorts)
        {
            var port = n.inputPorts[i];
            port.parentNode = n;
            addToDefaultDict(nets,arrayToBitstring(port.value),port);
        }
    });
    wires = [];
    module.nodes.forEach(function(n)
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
    module.wires = wires;
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
    return d3.map(cell.connections).entries().filter(function(d)
    {
        return cell.port_directions[d.key] == direction;
    });
}

// doesn't do much yet
function on_ys_ready()
{
    console.log('***ys ready*****');
}

// we alert with error messages
function handle_run_errors(logmsg, errmsg)
{
    if (errmsg != "")
    {
      var splut = errmsg.split(':');
      editor.session.setAnnotations([{row: Number(splut[1])-1,
                column: 0,
                text: splut[2],
                type: "error"}]);
    }
}

// finds the svg viewer and creates svg skeleton
function createViewObjects(module) {
    console.log('clearing viewer...');
    var viewer = d3.select('#viewer');
    viewer.selectAll('*').remove();

    console.log('adding cells...');
    var cellViews = viewer.selectAll('.cell')
      .data(module.cells)
      .enter().append('g')
        .attr('class','cell node');

    console.log('adding input external ports...');
    var inputExtViews = viewer.selectAll('.inputExt')
      .data(module.inputPorts)
      .enter().append('g')
        .attr('class','inputExt external node');

    console.log('adding output external ports...');
    var outputExtViews = viewer.selectAll('.outputExt')
      .data(module.outputPorts)
      .enter().append('g')
        .attr('class','outputExt external node');

    console.log('adding output ports...');
    d3.selectAll('.node').selectAll('.outport')
      .data(function(node){return node.outputPorts;})
        .enter().append('g')
        .attr('class','port outport');

    console.log('adding input ports...');
    d3.selectAll('.node').selectAll('.inport')
      .data(function(node){return node.inputPorts;})
        .enter().append('g')
        .attr('class','port inport');

    console.log('adding wires...');
    var wireViews = viewer.selectAll('.net')
      .data(wires)
      .enter().append('g')
        .attr('class', 'net');

    return {
      'viewer':viewer,
      'cells':cellViews,
      'wires':wireViews,
      'inputExts':inputExtViews,
      'outputExts':outputExtViews,
      'nodes':d3.selectAll('.node')};
}

// positioning constants
var INIT_RANK_SPAN = 150;
var INIT_NODE_X_MARGIN = 50;
var INIT_NODE_Y = 50;
var NODE_WIDTH = 30;
var HALF_NODE_WIDTH = 15;
var EDGE_PORT_GAP = 10;
var PORT_GAP = 20;
var NODE_GAP = 80;
var STEM_LENGTH = 8;
var PORT_LABEL_X = 5;
var PORT_LABEL_Y = -3;
var NODE_LABEL_X = 0;
var NODE_LABEL_Y = -4;

var BINOP_PORT_GAP = 15;
var BINOP_EDGE_PORT_GAP = 5;
var BINOP_HEIGHT = 2*BINOP_EDGE_PORT_GAP+BINOP_PORT_GAP;

var SPLIT_WIDTH = 5;

var DFF_ARROW_X = 5;
var DFF_ARROW_Y = 5;

var STEM_CIRCLE = 5;

var EQ_GAP = 5;
var EQ_LENGTH = 10;
var MUX_POINT_Y = 10;
var MUX_WIDTH = 20;

// calculate how tall a generic cell should be from the number of input and output ports
function genericHeight (cell)
{
    console.log(cell.outputPorts);
    gaps = d3.max([cell.inputPorts.length, cell.outputPorts.length])-1;
    return gaps*PORT_GAP+2*EDGE_PORT_GAP;
}

var shapes = {
  '$_dummy_' : function(viewObject) {
    var inPorts = viewObject.selectAll('.inport')
      .each(function(port){
        port.x = 0;
        port.y = 0;
      });
      var outPorts = viewObject.selectAll('.outport')
      .each(function(port){
        port.x = 0;
        port.y = 0;
      });
  },
  '$pmux' : function(viewObject) {
    viewObject.append('path')
      .attr('class','nodeBody')
      .attr('d',function(node) {
        return 'M-'+(MUX_WIDTH/2)+',0'+
               ' L'+(MUX_WIDTH/2)+','+MUX_POINT_Y+
               ' L'+(MUX_WIDTH/2)+','+(EDGE_PORT_GAP*2+PORT_GAP- MUX_POINT_Y)+
               ' L-'+(MUX_WIDTH/2)+','+(EDGE_PORT_GAP*2+PORT_GAP)+'Z';
      });
    viewObject.append('line')
      .attr('class','nodeBody')
      .attr('x1',0)
      .attr('x2',0)
      .attr('y1',2*PORT_GAP+EDGE_PORT_GAP)
      .attr('y2',PORT_GAP+2*EDGE_PORT_GAP-MUX_POINT_Y/2)

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        if (port.key == 'S')
          port.x = -STEM_LENGTH;
        else
          port.x = (-MUX_WIDTH/2-STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port,i){
        port.x = (MUX_WIDTH/2+STEM_LENGTH);
        port.y = (EDGE_PORT_GAP+PORT_GAP/2);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$mux' : function(viewObject) {
    viewObject.append('path')
      .attr('class','nodeBody')
      .attr('d',function(node) {
        return 'M-'+(MUX_WIDTH/2)+',0'+
               ' L'+(MUX_WIDTH/2)+','+MUX_POINT_Y+
               ' L'+(MUX_WIDTH/2)+','+(EDGE_PORT_GAP*2+PORT_GAP- MUX_POINT_Y)+
               ' L-'+(MUX_WIDTH/2)+','+(EDGE_PORT_GAP*2+PORT_GAP)+'Z';
      });
    viewObject.append('line')
      .attr('class','nodeBody')
      .attr('x1',0)
      .attr('x2',0)
      .attr('y1',2*PORT_GAP+EDGE_PORT_GAP)
      .attr('y2',PORT_GAP+2*EDGE_PORT_GAP-MUX_POINT_Y/2)

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        if (port.key == 'S')
          port.x = -STEM_LENGTH;
        else
          port.x = (-MUX_WIDTH/2-STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port,i){
        port.x = (MUX_WIDTH/2+STEM_LENGTH);
        port.y = (EDGE_PORT_GAP+PORT_GAP/2);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$and' : function(viewObject) {
    viewObject.append('path')
      .attr('class','nodeBody')
      .attr('d',function(node) {
        return 'M0,0'+
               ' L-'+HALF_NODE_WIDTH+',0'+
               ' L-'+HALF_NODE_WIDTH+','+BINOP_HEIGHT+
               ' L0,'+BINOP_HEIGHT+
               ' A'+HALF_NODE_WIDTH+' '+(BINOP_HEIGHT/2)+ ' 0 0 0 0,0';
      });
    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        port.x = (-NODE_WIDTH/2-STEM_LENGTH);
        port.y = (i*BINOP_PORT_GAP+BINOP_EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port){
        port.x = (NODE_WIDTH/2+STEM_LENGTH);
        port.y = (BINOP_HEIGHT/2);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$eq' : function(viewObject) {
    viewObject.append('circle')
      .attr('class','nodeBody')
      .attr('cx',0)
      .attr('cy',BINOP_HEIGHT/2)
      .attr('r',BINOP_HEIGHT/2);
    viewObject.append('line')
      .attr('class','symbol')
      .attr('x1',-EQ_LENGTH/2)
      .attr('y1',(BINOP_HEIGHT-EQ_GAP)/2)
      .attr('x2',EQ_LENGTH/2)
      .attr('y2',(BINOP_HEIGHT-EQ_GAP)/2);
    viewObject.append('line')
      .attr('class','symbol')
      .attr('x1',-EQ_LENGTH/2)
      .attr('y1',(BINOP_HEIGHT+EQ_GAP)/2)
      .attr('x2',EQ_LENGTH/2)
      .attr('y2',(BINOP_HEIGHT+EQ_GAP)/2);

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        port.x = (-NODE_WIDTH/2-STEM_LENGTH);
        port.y = (i*BINOP_PORT_GAP+BINOP_EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH+STEM_CIRCLE)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port){
        port.x = (BINOP_HEIGHT/2+STEM_LENGTH);
        port.y = (BINOP_HEIGHT/2);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$reduce_xor' : function(viewObject) {
    viewObject.append('path')
      .attr('class','nodeBody')
      .attr('d',function(node) {
        return 'M-'+HALF_NODE_WIDTH+',0'+
               ' A'+NODE_WIDTH+' '+(BINOP_HEIGHT)+ ' 0 0 1 '+(-HALF_NODE_WIDTH)+','+BINOP_HEIGHT+
               ' A'+NODE_WIDTH+' '+(BINOP_HEIGHT)+ ' 0 0 0 '+HALF_NODE_WIDTH+','+(BINOP_HEIGHT/2)+
               ' A'+NODE_WIDTH+' '+(BINOP_HEIGHT)+ ' 0 0 0 '+(-HALF_NODE_WIDTH)+',0';
      });
    viewObject.append('path')
      .attr('class','nodeBody')
      .attr('d',function(node) {
        return 'M'+(-HALF_NODE_WIDTH-3)+',0'+
               ' A'+NODE_WIDTH+' '+(BINOP_HEIGHT)+ ' 0 0 1 '+(-HALF_NODE_WIDTH-3)+','+BINOP_HEIGHT;
      });
    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port){
        port.x = -STEM_LENGTH-HALF_NODE_WIDTH;
        port.y = (BINOP_HEIGHT/2);
        return 'translate('+port.x+','+port.y+')';
      });
    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port){
        port.x = (HALF_NODE_WIDTH+STEM_LENGTH);
        port.y = (BINOP_HEIGHT/2);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$add' : function(viewObject) {
    viewObject.append('circle')
      .attr('class','nodeBody')
      .attr('cx',0)
      .attr('cy',BINOP_HEIGHT/2)
      .attr('r',BINOP_HEIGHT/2);
    viewObject.append('line')
      .attr('class','symbol')
      .attr('x1',-EQ_LENGTH/2)
      .attr('y1',BINOP_HEIGHT/2)
      .attr('x2',EQ_LENGTH/2)
      .attr('y2',BINOP_HEIGHT/2);
    viewObject.append('line')
      .attr('class','symbol')
      .attr('x1',0)
      .attr('y1',(BINOP_HEIGHT-EQ_LENGTH)/2)
      .attr('x2',0)
      .attr('y2',(BINOP_HEIGHT+EQ_LENGTH)/2);

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        port.x = (-NODE_WIDTH/2-STEM_LENGTH);
        port.y = (i*BINOP_PORT_GAP+BINOP_EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH+STEM_CIRCLE)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port){
        port.x = (BINOP_HEIGHT/2+STEM_LENGTH);
        port.y = (BINOP_HEIGHT/2);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$sub' : function(viewObject) {
    viewObject.append('circle')
      .attr('class','nodeBody')
      .attr('cx',0)
      .attr('cy',BINOP_HEIGHT/2)
      .attr('r',BINOP_HEIGHT/2);
    viewObject.append('line')
      .attr('class','symbol')
      .attr('x1',-EQ_LENGTH/2)
      .attr('y1',BINOP_HEIGHT/2)
      .attr('x2',EQ_LENGTH/2)
      .attr('y2',BINOP_HEIGHT/2);

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        port.x = (-NODE_WIDTH/2-STEM_LENGTH);
        port.y = (i*BINOP_PORT_GAP+BINOP_EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH+STEM_CIRCLE)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port){
        port.x = (BINOP_HEIGHT/2+STEM_LENGTH);
        port.y = (BINOP_HEIGHT/2);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$_split_' : function(viewObject) {
    viewObject.append('rect')
      .attr('class','splitBody')
      .attr('width',SPLIT_WIDTH)
      .attr('height',genericHeight)
      .attr('x',-SPLIT_WIDTH/2)
      .attr('y',0);

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        port.x = (-SPLIT_WIDTH/2-STEM_LENGTH);
        port.y = genericHeight(port.parentNode)/2;
        return 'translate('+port.x+','+port.y+')';
      });

    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port,i){
        port.x = (SPLIT_WIDTH/2+STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    outPorts.append('text')
      .attr('class','outPortLabel')
      .text(function(d){return d.key;})
      .attr('x',-PORT_LABEL_X)
      .attr('y',PORT_LABEL_Y);
  },
  '$_join_' : function(viewObject) {
    viewObject.append('rect')
      .attr('class','splitBody')
      .attr('width',SPLIT_WIDTH)
      .attr('height',genericHeight)
      .attr('x',-SPLIT_WIDTH/2)
      .attr('y',0);

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        port.x = (-SPLIT_WIDTH/2-STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });

    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    inPorts.append('text')
      .attr('class','inPortLabel')
      .text(function(port){return port.key;})
      .attr('x',PORT_LABEL_X)
      .attr('y',PORT_LABEL_Y);
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port,i){
        port.x = (SPLIT_WIDTH/2+STEM_LENGTH);
        port.y = genericHeight(port.parentNode)/2;
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$dff' : function(viewObject) {
    viewObject.append('rect')
      .attr('class','nodeBody')
      .attr('width',NODE_WIDTH)
      .attr('height',genericHeight)
      .attr('x',-NODE_WIDTH/2)
      .attr('y',0);
    viewObject.append('path')
      .attr('class','nodeBody')
      .attr('d',function(node){
        return 'M-'+HALF_NODE_WIDTH+','+(EDGE_PORT_GAP+PORT_GAP+DFF_ARROW_Y)+
               ' L'+(-HALF_NODE_WIDTH+DFF_ARROW_X)+','+(EDGE_PORT_GAP+PORT_GAP)+
               ' L-'+HALF_NODE_WIDTH+','+(EDGE_PORT_GAP+PORT_GAP-DFF_ARROW_Y);
      });

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port){
        port.x = (-NODE_WIDTH/2-STEM_LENGTH);
        if (port.key == 'CLK')
          port.y = EDGE_PORT_GAP+PORT_GAP;
        else
          port.y = EDGE_PORT_GAP;
        return 'translate('+port.x+','+port.y+')';
      });

    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port,i){
        port.x = (NODE_WIDTH/2+STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$_inputExt_' : function(viewObject) {
    viewObject.append('path')
      .attr('class','nodeBody')
      .attr('d',function(){
        return 'M0,0'+
               ' L-'+HALF_NODE_WIDTH+',0'+
               ' L-'+HALF_NODE_WIDTH+','+(EDGE_PORT_GAP*2)+
               ' L0,'+(EDGE_PORT_GAP*2)+
               ' L'+HALF_NODE_WIDTH+','+EDGE_PORT_GAP+
               ' L0,0';
      });

    viewObject.append('text')
      .attr('class','nodeLabel')
      .text(function(d){return d.key})
      .attr('x',NODE_LABEL_X)
      .attr('y',NODE_LABEL_Y);

    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port,i){
        port.x = (NODE_WIDTH/2+STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$_constant_' : function(viewObject) {
    viewObject.append('rect')
      .attr('class','nodeBody')
      .attr('width',NODE_WIDTH)
      .attr('height',genericHeight)
      .attr('x',-NODE_WIDTH/2)
      .attr('y',0);

    viewObject.append('text')
      .attr('class','nodeLabel')
      .text(function(d){return d.key})
      .attr('x',NODE_LABEL_X)
      .attr('y',NODE_LABEL_Y);

    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port,i){
        port.x = (NODE_WIDTH/2+STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$_outputExt_' : function(viewObject) {
    viewObject.append('path')
      .attr('class','nodeBody')
      .attr('d',function(){
        return 'M0,0'+
               ' L'+HALF_NODE_WIDTH+',0'+
               ' L'+HALF_NODE_WIDTH+','+(EDGE_PORT_GAP*2)+
               ' L0,'+(EDGE_PORT_GAP*2)+
               ' L-'+HALF_NODE_WIDTH+','+EDGE_PORT_GAP+
               ' L0,0';
      });
    viewObject.append('text')
      .attr('class','nodeLabel')
      .text(function(d){return d.key})
      .attr('x',NODE_LABEL_X)
      .attr('y',NODE_LABEL_Y);

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        port.x = (-NODE_WIDTH/2-STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
  },
  '$_generic_' : function(viewObject) {
    viewObject.append('rect')
      .attr('class','nodeBody')
      .attr('width',NODE_WIDTH)
      .attr('height',genericHeight)
      .attr('x',-NODE_WIDTH/2)
      .attr('y',0);
    viewObject.append('text')
      .attr('class','nodeLabel')
      .text(function(d){return d.type})
      .attr('x',NODE_LABEL_X)
      .attr('y',NODE_LABEL_Y);

    var inPorts = viewObject.selectAll('.inport')
      .attr('transform',function(port,i){
        port.x = (-NODE_WIDTH/2-STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });

    inPorts.append('line')
          .attr('x1',0)
          .attr('x2',STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    inPorts.append('text')
      .attr('class','inPortLabel')
      .text(function(port){return port.key;})
      .attr('x',PORT_LABEL_X)
      .attr('y',PORT_LABEL_Y);
    var outPorts = viewObject.selectAll('.outport')
      .attr('transform',function(port,i){
        port.x = (NODE_WIDTH/2+STEM_LENGTH);
        port.y = (i*PORT_GAP+EDGE_PORT_GAP);
        return 'translate('+port.x+','+port.y+')';
      });
    outPorts.append('line')
          .attr('x1',0)
          .attr('x2',-STEM_LENGTH)
          .attr('y1',0)
          .attr('y2',0)
          .attr('class','portStem');
    outPorts.append('text')
      .attr('class','outPortLabel')
      .text(function(d){return d.key;})
      .attr('x',-PORT_LABEL_X)
      .attr('y',PORT_LABEL_Y);
  }
}

// draws nodes as SVG objects.
// all viewObjects are empty groups
function buildNodes(viewObjects) {
  viewObjects.nodes.each(function(d){
    if (shapes[d.type]) {
      shapes[d.type](d3.select(this));
    } else {
      shapes['$_generic_'](d3.select(this));
    }
  });
}

// creates all of the wire view objects
function buildWires(viewObjects) {
  viewObjects.wires.append('line')
    .attr('class','verticalWire')

  viewObjects.wires.selectAll('.driverWire')
    .data(function(d){return d.drivers;})
    .enter().append('line')
      .attr('class','driverWire wire');

  viewObjects.wires.selectAll('.riderWire')
    .data(function(d){return d.riders;})
    .enter().append('line')
      .attr('class','riderWire wire');

  viewObjects.wires.selectAll('.wireDot')
    .data(function(d){return d.drivers.concat(d.riders);})
    .enter().append('circle')
      .attr('class','wireDot')
      .attr('r',2);
}

// best guess placement initially. The forces will untangle it.
function assignNodeInitialPosition(viewObjects) {

  var nodesInRank=[];
  var maxNodesInRank=1;

  viewObjects.nodes.each(function(d){
    d.x = d.depth*INIT_RANK_SPAN + INIT_NODE_X_MARGIN;
    if (nodesInRank[d.depth]!=undefined) {
      nodesInRank[d.depth].push(d);
      if (nodesInRank[d.depth].length>maxNodesInRank)
        maxNodesInRank = nodesInRank[d.depth].length;
    } else {
      nodesInRank[d.depth]=[d];
    }
    d.y = INIT_NODE_Y+(nodesInRank[d.depth].length-1)*NODE_GAP;
  });
  d3.selectAll('.net').each(function(wire){
    wire.x = d3.mean(wire.drivers.concat(wire.riders), portGlobalX);
  });
  updatePositions(viewObjects);
  viewObjects.nodesInRank = nodesInRank;
  viewObjects.maxNodesInRank = maxNodesInRank;
}

// finds port global X using it's local X and parent X
function portGlobalX(port)
{
  return port.x+port.parentNode.x;
}

// finds port global Y using it's local Y and parent Y
function portGlobalY(port)
{
  return port.y+port.parentNode.y;
}

// this updates the view objects from their model objects
function updatePositions(viewObjects) {
  var maxX = 0;
  var maxY = 0;
  d3.selectAll('.node')
    .attr('transform',function(d){
      if (d.x>maxX) maxX = d.x;
      if (d.y>maxY) maxY = d.y;
      return 'translate('+d.x+','+d.y+')';
    })
  d3.select('#viewer')
    .attr('width',maxX+INIT_NODE_X_MARGIN)
    .attr('height',maxY+INIT_NODE_Y*2);

  d3.selectAll('.net').each(function(wire){
    wire.x = d3.mean(wire.drivers.concat(wire.riders), portGlobalX);
    wire.yRange = d3.extent(wire.drivers.concat(wire.riders), portGlobalY);
  });
  d3.selectAll('.net').select('.verticalWire')
    .attr('x1',function(wire){console.log(wire); return wire.x})
    .attr('x2',function(wire){return wire.x})
    .attr('y1',function(wire){return wire.yRange[0]})
    .attr('y2',function(wire){return wire.yRange[1]})
  d3.selectAll('.net').selectAll('.wire')
    .attr('x1',function(port){return portGlobalX(port);})
    .attr('x2',function(port){return port.wire.x})
    .attr('y1',function(port){return portGlobalY(port);})
    .attr('y2',function(port){return portGlobalY(port);})
  d3.selectAll('.wireDot')
    .attr('cx',function(port){return port.wire.x;})
    .attr('cy',function(port){return portGlobalY(port);})
    .attr('visibility', function(port){
      if (portGlobalY(port) == port.wire.yRange[0]) {
        port.wire.yRange[0]-=0.01;
        return "hidden";
      }
      if (portGlobalY(port) == port.wire.yRange[1]) {
        port.wire.yRange[1]+=0.01;
        return "hidden";
      }
      return "visible";
    });
}

// these are the force constants
var RANK_OFFSET = 100;
var RANK_PULL = 2.0;
var NET_PULL = 0.3;
var PULL_UP = 0.1;
var STARTING_HEAT = 0.2;
var CHARGE = -4000;
var WIRE_OFFSET = 20;

// tries to push all nodes an ideal distance away from connected nodes
// note: this doesn't preserve newtons third law and so it tends to pull
// the graph in one horizontal direction (usually left)
function pullNodesTowardRank(alpha) {
  d3.selectAll('.net').each(function(wire){
    var targetX = 0;
    if (wire.drivers.length>0) {
      targetX = d3.max(wire.drivers, function(port){return port.parentNode.x;})+RANK_OFFSET;
    } else {
      targetX = d3.mean(wire.riders, function(port){return port.parentNode.x;});
    }
    wire.riders.forEach(function(port){
      if (port.parentNode.fixed) return;
      var dx = targetX - port.parentNode.x;
      port.parentNode.x += dx*alpha*RANK_PULL;
    });
    if (wire.riders.length>0) {
      targetX = d3.min(wire.riders, function(port){return port.parentNode.x;})-RANK_OFFSET;
    } else {
      targetX = d3.mean(wire.drivers, function(port){return port.parentNode.x;});
    }
    wire.drivers.forEach(function(port){
      if (port.parentNode.fixed) return;
      var dx = targetX - port.parentNode.x;
      port.parentNode.x += dx*alpha*RANK_PULL;
    });
  });
}

// all nets pull toward center of gravity
function pullNodesTowardNet(alpha) {
  d3.selectAll('.net').each(function(wire){

    var allPorts = wire.drivers.concat(wire.riders);
    var targetY = d3.mean(allPorts, portGlobalY);
    allPorts.forEach(function(port) {
        if (port.parentNode.fixed) return;
        var dy = targetY - portGlobalY(port);
        port.parentNode.y += dy * alpha * NET_PULL;
    });
  });
}

// we constrain all dummies to be straight
function straightenDummies(){
  d3.selectAll('.dummy').each(function(node){
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
      if (n.fixed) return;
        n.y = sum/chain.length;
    });
  });
}


// we constrain nodes to always have a positive position (with a margin)
function keepNodesInView()
{
  d3.selectAll('.node').each(function(node){
    if (node.x<INIT_NODE_X_MARGIN) {
      node.x=INIT_NODE_X_MARGIN;
    }
    if (node.y<INIT_NODE_X_MARGIN) {
      node.y = INIT_NODE_X_MARGIN;
    }
  });
}

// we add a sort of antigravity to pull everything upward
// TODO: add a leftward force
function pullNodesUp(alpha){
  d3.selectAll('.node').each(function(node){
    node.y-=alpha*PULL_UP;
  });
}

function pushWires(alpha){
  d3.selectAll('.net').each(function(wire){
    rightmostSource = null;
    wire.drivers.forEach(function(s)
    {
      if (rightmostSource==null || portGlobalX(s)>portGlobalX(rightmostSource))
        rightmostSource = s;
    });
    if (rightmostSource!=null)
    {
      dx = wire.x - portGlobalX(rightmostSource)-WIRE_OFFSET;
      wire.x -= dx*0.05;
    }
    leftmostSink = null;
    wire.riders.forEach(function(s)
    {
      if (leftmostSink==null || portGlobalX(s)<portGlobalX(leftmostSink))
        leftmostSink = s;
    });
    if (leftmostSink!=null)
    {
      dx = wire.x - portGlobalX(leftmostSink)+WIRE_OFFSET;
      wire.x -= dx*0.05;
    }
    // vertical wire segments repulse each other
    // We max out the force so it's easy to overpower
    wires.forEach(function(wire2)
    {
      if (wire==wire2)
        return;
      if (wire.yRange[0]>wire2.yRange[1])
        return;
      if (wire.yRange[1]<wire2.yRange[0])
        return;
      force = 3/(wire.x - wire2.x);
      force = d3.min([0.3,force]);
      force = d3.max([-0.3,force]);
      wire.x += force;
      wire2.x -= force;
    });
  });
}

function tick(e) {
  //forces
  pullNodesUp(e.alpha);
  pullNodesTowardRank(e.alpha);
  pullNodesTowardNet(e.alpha);
  pushWires(e.alpha);
  //constraints
  straightenDummies();
  keepNodesInView();
  //update view
  updatePositions();
}

var markerNum=-1;

// use d3's force algorithm.
// no gravity and nodes should only repel nodes within their rank
function createForces(viewObjects) {
  var forces = [];
  viewObjects.nodesInRank.forEach(function(rank){
    var force = d3.layout.force()
      .nodes(rank)
      .gravity(0)
      .charge(CHARGE)
      .on('tick',tick);
    var drag = force.drag();
    drag.on("dragstart", function(node){
      node.fixed = true;
      if (node.attributes && node.attributes.src)
      {
        if (markerNum!=-1){
          editor.session.removeMarker(markerNum);
        }
        var lineNum = Number(node.attributes.src.split(':')[1])-1;
        var line = editor.session.getDocument().getLine(lineNum);
        markerNum = editor.session.addMarker(new aceRange(lineNum,0, lineNum,line.length), "selection", true);
      }
    });
    drag.on("drag",function(node){
      forces.forEach(function(f){f.resume()});
    });
    force
      .start();
    force.alpha(STARTING_HEAT);
    forces.push(force);
    viewObjects.nodes.filter(function(node){return node.depth==rank[0].depth})
      .call(drag);
  });
  viewObjects.nodes.on('dblclick',function(node){
    node.fixed = false;
    forces.forEach(function(f){f.resume()});
    if (markerNum!=-1){
      editor.session.removeMarker(markerNum);
      markerNum=-1;
    }
  });
  return forces;
}