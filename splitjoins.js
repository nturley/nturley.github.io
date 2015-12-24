// returns a string that represents the values of the array of integers
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

// returns whether needle is a substring of arrhaystack
function arrayContains(needle, haystack)
{
    return (haystack.indexOf(needle) > -1);
}

// returns the index of the string that contains a substring
// given arrhaystack, an array of strings
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