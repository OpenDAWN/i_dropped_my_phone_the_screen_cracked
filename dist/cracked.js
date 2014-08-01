(function() {

  'use strict';

  var _nodeStore = {},
    _nodeLookup = {},
    _previousNode = null,
    _selectedNodes = [],
    _currentSelector = "",
    _currentMacro = [],
    _debugEnabled = false,
    _context = window.AudioContext ? new AudioContext() : new webkitAudioContext();


    /**
     * #Selecting#
     * Cracked uses a subset of [CSS selectors](http://www.sitepoint.com/web-foundations/css-selectors/) to get references and make connections between nodes
     * in the graph. You can refer to a node by its type:
     * <code>
     *     \_\_("compressor") //selects all the compressors in the graph
     * </code>
     * or by using an assigned id or class:
     * <code>
     *     //create and connect some nodes
     *     \_\_().sine({id:"foo"}).lowpass({class:"bar"}).waveshaper({class:"bar"}).dac();
     *</code><code>
     *     \_\_("#foo") //selects the sine
     *     \_\_(".bar") //selects the lowpass & the waveshaper
     * </code>
     * Selectors can be grouped with a comma and the final match is the combination of both
     * <code>
     *     //create and connect some nodes
     *     \_\_().sine({id:"foo"}).lowpass({class:"bar"}).waveshaper({class:"bar"}).dac();
     *</code><code>
     *     \_\_("#foo,.bar,dac") //selects the sine, lowpass, waveshaper & dac nodes
     * </code>
     *
      */

/**
 * Updates the internal selected nodes array with a collection of audio
 * nodes matching the selector provided. Type, Class & Id selectors are
 * supported.
 * <code>
 * //A type selector using the node name, sets the frequency for all sines
 * __("sine").frequency(200);
 *
 * //set the frequency for the node with id "foo"
 * __("#foo").frequency(200);
 *
 * //set the frequency for any nodes with a class of "bar"
 * __(".bar").frequency(200);
 *
 * //select all sines, any nodes with classname "bar" or id of "foo"
 * //and set their frequencies to 200
 * __("sine,.bar,#foo").frequency(200);</code>
 *
 * If invoked without arguments, cracked() resets the selection/connection state,
 * removing any record of previous nodes and effectively marking the start of
 * a new connection chain. Since a new node will try to connect to any previous
 * node, calling \_\_() tells a node that there is no previous node to connect to.
 * For example:
 * <code>
 * //Create & connect sine -> lowpass -> dac
 * \_\_().sine();
 * \_\_.lowpass();
 * \_\_.dac();
 * //Create but don't connect
 * \_\_().sine();
 * \_\_().lowpass();
 * \_\_().dac();</code>
 *
 * cracked is also the namespace for public methods and also can be written as a
 * double underscore \_\_
 * <code>
 * \_\_("sine"); //same as cracked("sine")
 * </code>
 *
 * [See more selector examples](../../examples/docs/selector.html)
 *
 * @public
 * @type cracked
 * @function
 * @namespace
 * @global
 * @param {String} [selector] selector expression
 * @returns {cracked}
 */
  var cracked = find;

  function find() {
    if (arguments && arguments.length) {
      if (recordingMacro()) {
        //if we're making a macro right now
        //search in the macro
        findInMacro(arguments[0]);
      } else {
        //search everywhere
        var selector = arguments[0];
        _currentSelector = selector;
        _selectedNodes = getNodesWithSelector(selector);
      }
    } else {
      //if there are no arguments
      //then reset the entire state      
      reset();
    }
    //if we're finding, then no previous node  
    _previousNode = null;
    return cracked;
  }

/**
 * find nodes in a macro with a selector updates the _selectedNodes array
 * @function
 * @private
 */
  function findInMacro() {
    if (arguments && arguments.length) {
      //look for the macro namespace in the incoming selector
      //if its there, do nothing, else add it.
      var selectorArr = arguments[0].split(","),
        prefix = getCurrentMacroNamespace(),
        macroUUID = getCurrentMacro().getUUID(),
        selector;
      //insert the prefix
      //use a loop to handle comma delimited selectors
      for (var i = 0; i < selectorArr.length; i++) {
        selectorArr[i] = (selectorArr[i].indexOf(prefix) !== -1) ? 
        selectorArr[i] : prefix + selectorArr[i];
      }
      //re-join the now prefixed selectors
      selector = selectorArr.join(",");
      //update the shared _currentSelector variable
      //then find the nodes
      _currentSelector = selector;
      //update selectedNodes
      _selectedNodes = getNodesWithSelector(selector);
      //strip out anything we found that's not part of this
      //container macro
      _selectedNodes.forEach(function(el, i, arr) {
        if (el && getNodeWithUUID(el).getMacroContainerUUID() !== macroUUID) {
            arr.splice(i, 1);
        }
      });
    }
  }

    /**
     * #Connecting#
     * By default, at the time they are created, nodes will attempt to connect
     * to the node immediately prior to them in the graph. It doesn't matter if
     * the methods are chained together or not:
     * <code>
     * //create & connect sine->lowpass->dac
     * \_\_.sine();
     * \_\_.lowpass();
     * \_\_.dac();
     *
     * //same as
     * \_\_.sine().lowpass().dac();
     * </code>
     *
     * If there's no previous nodes, then a new node will look for selected nodes to
     * connect to.
     * <code>
     * //create and connect sine->lowpass->dac
     * \_\_().sine().lowpass().dac();
     * //create a new delay and connect to the previously instantiated sine.
     * \_\_("sine").delay();
     * </code>
     *
     * The connect method below makes it possible to connect outputs to the inputs of
     * previous instantiated nodes.
     * <code>
     * //same as above, but connect the new delay's output the existing dac
     * \_\_().sine().lowpass().dac();
     * //create a new delay and connect to the previously instantiated sine.
     * \_\_("sine").delay().connect("dac");
     * </code>
     *
     * As noted above, if cracked() is invoked without arguments, it resets the
     * selection/connection state, removing any record of previous nodes and
     * effectively marking the start of a new connection chain. Since a new node
     * will try to connect to any previous node, calling \_\_() tells a node that
     * there is no previous node to connect to.
     * <code>
     * //create & connect sine->lowpass->dac
     * \_\_.sine();
     * \_\_.lowpass();
     * \_\_.dac();
     *
     * //Create but don't connect
     * \_\_().sine();
     * \_\_().lowpass();
     * \_\_().dac();
     * </code>
     *
     *
      */

/**
 * chainable method to connect nodes to previously instantiated
 * nodes. Takes a selector to find the nodes to connect to.
 * <code>
 *     //create and connect sine->lowpass->dac
 *     \_\_().sine().lowpass().dac();
 *     //create a sawtooth and connect to the lowpass created above
 *     \_\_().saw().connect("lowpass");</code>
 *
 *  See more [examples](../../examples/docs/selector.html)
 *
 * @public
 * @function
 * @param {String} selector selector expression
 * @return cracked
 */
    cracked.connect = function() {
    //save a copy of previous node
    var tmp = getPreviousNode();
    //if we're arriving directly from find()
    if (!tmp && _selectedNodes.length) {
      //overwrite the previous node with a selected node   
      tmp = getNodeWithUUID(_selectedNodes[0]);
      //tbd - this should work w the entire selectednodes array      
    }
    find(arguments[0]);
    //find() resets the previous node to null.
    //it's needed however in connectPreviousToSelected()
    //so restore it with one from _selectednodes we stored in tmp.
    setPreviousNode(tmp);
    //do the connection
    connectPreviousToSelected();
    return cracked;
  };

/**
 * helper for above
 * @function
 * @private
 */
  function connectPreviousToSelected() {
    var pNode = getPreviousNode();
    _selectedNodes.forEach(function(node, i, array) {
      node = getNodeWithUUID(node);
      if (node && pNode) {
        pNode.connect(node);
        pNode.pushNextNode(node);
        node.setPrevNode(pNode);
        logConnections(pNode, node);
      }
    });
  }

/**
 * log selected nodes to console if any.
 * <code>
 * //create and connect sine -> lowpass -> dac
 * \_\_().sine().lowpass().dac();
 *
 * //logs the [oscillatorNode] object to the console
 * \_\_("sine").log()</code>
 *
 * @public
 * @function
 */
  cracked.log = function() {
    var arr = [];
    logNodes(null,arr);
    console.log(arr);
  };

    /**
     * helper for above
     * @private
     * @param node
     * @param arr
     */
 function logNodes(node,arr) {
     if (_currentSelector) {
         var nodes = arr || [];
         var selectedNodes = node || _selectedNodes;
         selectedNodes.forEach(function(nodeID, i, array) {
             var tmp = getNodeWithUUID(nodeID).getNativeNode();
             //recurse thru the node array if its a macro
             if(__.isArr(tmp)) {
                 logNodes(tmp,nodes);
             }
             //if we're in outer loop, add to the output array
             if(array===_selectedNodes) {
                 nodes.push(tmp);
             }
         });
     }
 }

/**
 * return the length of selected nodes array
 * <code>
 * //create and connect sine -> lowpass -> dac
 * \_\_().sine().lowpass().dac();
 *
 * //returns 2
 * \_\_("sine,lowpass").size();</code>
 *
 * @public
 * @function
 * @returns {Number}
 */
  cracked.size = function() {
    if (_selectedNodes.length) {
      return _selectedNodes.length;
    } else {
      return 0;
    }
  };

/**
 * reset state
 * @function
 * @private
 */
    function reset() {
    _previousNode = null;
    _selectedNodes = [];
    _currentSelector = "";
  }

/**
 * reset selection
 * @function
 * @private
 */
  function resetSelection() {
    _selectedNodes = [];
    _currentSelector = "";
  }

  // Macro

/**
 * start macro recording, add any user parameters (id,classname,etc)
 * to the container macro
 * @public
 * @function
 * @param {String} name macro name
 * @param {Object} userParams options object
 */
  cracked.begin = function(name, userParams) {
    if (name) {
      _currentMacro.push(createMacro(name, userParams));
    }
    return cracked;
  };

/**
 * end macro recording
 * @public
 * @function
 * @param {String} name macro name
 */
    cracked.end = function(name) {
    if (
      recordingMacro() &&
      getCurrentMacro().getType() === name
    ) {
      getCurrentMacro().setMacroNameSpace(getCurrentMacroNamespace());
      _currentMacro.pop();
    }
    return cracked;
  };

/**
 * create the macro container node
 * @function
 * @private
 */
  function createMacro(name, userParams) {
    //tbd - macro needs its own class
    return createNode(name, {
      settings: {}
    }, userParams);
  }

/**
 * method that updates the current macro
 * container with nodes as they are created
 * @function
 * @private
 */
  function updateMacro(node) {
    if (recordingMacro()) {
      node.setMacroContainerUUID(getCurrentMacro().getUUID());
      getCurrentMacro().addNativeNode(node.getNativeNode());
    }
  }

/**
 * are we currently recording a macro? returns boolean
 * @function
 * @private
 */
    function recordingMacro() {
    return !!_currentMacro.length;
  }

/**
 * returns the current macro if there is one
 * @function
 * @private
 */
  function getCurrentMacro() {
    if (recordingMacro()) {
      return _currentMacro[_currentMacro.length - 1];
    } else {
      return null;
    }
  }

/**
 * walks the currentMacro stack and returns a
 * str with the current namespace
 * @function
 * @private
 */
  function getCurrentMacroNamespace() {
    var arr = [],
        space=" ";
    if (recordingMacro()) {
      for (var i = 0; i < _currentMacro.length; i++) {
        arr.push(_currentMacro[i].getType());
        arr.push(space);
      }
    }
    return arr.join("");
  }


    /**
     * executes a method with a specific set of selected nodes
     * without modifying the internal selectedNodes array
     * <code>
     * //filter out everything but the sines and
     * //execute the frequency method against those nodes.
     * //the internal _selectedNodes array remains unchanged
     * cracked.exec(
     *    "frequency",
     *    200,
     *    cracked.filter("sine")
     * );</code>
     *
     * @public
     * @function
     * @param {String} method method name
     * @param {Array} args arguments to supply to the method
     * @param {Array} nodes node array to execute against
     * @returns {cracked}
     */
    cracked.exec = function(method,args,nodes) {
        var save = _selectedNodes;
        _selectedNodes = nodes;
        cracked[method].apply(cracked,args);
        _selectedNodes = save;
        return cracked;
    };

    /**
     * Filter selected nodes with an additional selector
     * returns node array that can used with exec()
     * <code>
     * //select any sine & sawtooth oscillators
     * \_\_("sine,saw");
     *
     * //filter out everything but the sines and
     * //execute the frequency method against those nodes.
     * //the internal _selectedNodes array remains unchanged
     * cracked.exec(
     *    "frequency",
     *    200,
     *    cracked.filter("sine")
     * );</code>
     *
     * @public
     * @function
     * @param {String} selector selector expression
     * @returns {Array}
     */
    cracked.filter = function() {
        var tmp = [];
        if (arguments && arguments.length) {
            var str = arguments[0],
                selectorType = getSelectorType(str),
                match = str.match(/^\.|\#/) ? str.substring(1) : str;
            _selectedNodes.forEach(function(nodeID, i, arr) {
                var node = getNodeWithUUID(nodeID);
                if (
                    selectorType === "type" && node.getType() === match ||
                    selectorType === "class" && node.getClass() === match ||
                    selectorType === "id" && node.getID() === match
                    ) {
                    tmp.push(nodeID);
                }
            });
        }
        return tmp;
    };

    /**
     * iterate over the selectedNodes array, executing
     * the supplied function for each element
     * <code>
     * __.each(function(node,index,array){
     *      //Loops over any selected nodes. Parameters are the
     *      //current node, current index, and the selectedNode array
     * });</code>
     *
     *
     * @public
     * @function
     * @param {Function} fn function to be called on each node
     * @returns {cracked}
     */
    cracked.each = function(fn) {
        if(__.isFun(fn)) {
            for(var i=0;i<_selectedNodes.length;i++) {
                fn(getNodeWithUUID(_selectedNodes[i]),i,_selectedNodes);
            }
        }
        return cracked;
    };

  //Audio Nodes

/**
 * Native Script node
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.buffersize=4096]
 * @param {Number} [userParams.channels=1]
 * @param {Function} [userParams.fn=defaultFunction]
 */
  cracked.script = function(userParams) {
    userParams = userParams || {};
    var buffersize = userParams.buffersize || 4096;
    var channels = userParams.channels || 1;
    var fn = userParams.fn || defaultFunction;
    var creationParams = {
      "method": "createScriptProcessor",
      "methodParams": [buffersize, channels, channels],
      "settings": {
        "onaudioprocess": fn
      }
    };
    createNode("script", creationParams, userParams);

    //default function just passes sound thru
    function defaultFunction(e) {
      var input = e.inputBuffer.getChannelData(0);
      var output = e.outputBuffer.getChannelData(0);
      for (var i = 0; i < buffersize; i++) {
        output[i] = input[i];
      }
    }

    return cracked;
  };

/**
 * Native Waveshaper
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.drive=50]
 */
  cracked.waveshaper = function(userParams) {

    userParams = userParams || {};
    var drive = __.isObj(userParams) ? 
        cracked.ifUndef(userParams.drive, 50) : 
        userParams;
    var creationParams = {
      "method": "createWaveShaper",
      "settings": {
        "curve": userParams.curve || makeCurve(drive),
        "mapping":{
            "distortion": {
                "path": "curve",
                "fn": (function() {
                    return makeCurve;
                })()
            }
        }
      }
    };
    //tbd need a way to modifiy the param to makeCurve
    createNode("waveshaper", creationParams, userParams);

    return cracked;

    //curve generator for waveshaper
    function makeCurve(amount) {
      var k = __.isNum(amount) ? amount : 50,
        n_samples = 44100, //hard coded
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        x;
      for (var i = 0; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
      }
      return curve;
    }

  };

/**
 * Native Compressor
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.threshold=-24] in decibels, nominal range of -100 to 0.
 * @param {Number} [userParams.knee=30] in decibels, range of 0 to 40
 * @param {Number} [userParams.ratio=12] nominal range of 1 to 20
 * @param {Number} [userParams.attack=0.003] time in seconds, nominal range of 0 to 1
 * @param {Number} [userParams.release=0.250] time in seconds, nominal range of 0 to 1
 */
  cracked.compressor = function(userParams) {
    var mapping = {
      "threshold": "threshold.value",
      "knee": "knee.value",
      "ratio": "ratio.value",
      "attack": "attack.value",
      "release": "release.value"
    };
    var creationParams = {
      "method": "createDynamicsCompressor",
      "settings": {},
      "mapping": mapping
    };
    createNode("compressor", creationParams, userParams);
    return cracked;
  };

/**
 * Native Gain
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.threshold=-24] in decibels, nominal range of -100 to 0.
 */
  cracked.gain = function(userParams) {
    var gain = __.isNum(userParams) ? userParams : 1;
    var params = __.isObj(userParams) ? userParams : {
      "gain": gain
    };
    var creationParams = {
      "method": "createGain",
      "settings": {},
      "mapping": {
        "gain": "gain.value"
      }
    };
    createNode("gain", creationParams, params);
    return cracked;
  };

/**
 * Naming this with prefix native so I can use "delay" as a plugin name
 * max buffer size three minutes
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.delay=0] in seconds.
 */
  cracked.nativeDelay = function(userParams) {
    var creationParams = {
      "method": "createDelay",
      "methodParams": [179.0],
      "settings": {},
      "mapping": {
        "delay": "delayTime.value"
      }
    };
    createNode("delay", creationParams, userParams);
    return cracked;
  };

/**
 * Native oscillator, used the oscillator plugins
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440]
 * @param {Number} [userParams.detune=0]
 * @param {String} [userParams.type=sine]
 */
  cracked.osc = function(userParams) {
    var creationParams = {
      "method": "createOscillator",
      "settings": {},
      "mapping": {
        "frequency": "frequency.value",
        "detune": "detune.value"
      }
    };
    createNode("osc", creationParams, userParams);
    return cracked;
  };

/**
 * Native biquad filter, used by filter plugins
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440]
 * @param {Number} [userParams.q=0]
 * @param {String} [userParams.gain=0]
 * @param {String} [userParams.type=lowpass]
 */
  cracked.biquadFilter = function(userParams) {
    var creationParams = {
      "method": "createBiquadFilter",
      "settings": {},
      "mapping": {
        "q": "Q.value",
        "frequency": "frequency.value",
        "gain": "gain.value"
      }
    };
    createNode("biquadFilter", creationParams, userParams);
    return cracked;
  };

/**
 * Native convolver, used by reverb
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {String} [userParams.path] path to remote impulse
 * @param {Function} [userParams.fn] function to generate impulse
 */
  cracked.convolver = function(userParams) {

    userParams = userParams || {};
    var creationParams = {
      "method": "createConvolver",
      "settings": {}
    };
    var node = createNode("convolver", creationParams, userParams);
    loadBuffer(userParams, node);

    return cracked;

  };

/**
 * Native destination, used by the dac plugin
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 */
  cracked.destination = function(userParams) {
    createNode("destination", {
      "method": "createDestination",
      "settings": {}
    }, userParams);
    return cracked;
  };

/**
 * Native audio source node and buffer combined.
 * @function
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {String} [userParams.path] path to remote file
 * @param {Number} [userParams.speed=1] playback speed
 * @param {Number} [userParams.start=0] play head start value in seconds
 * @param {Number} [userParams.end=0] play head end value in seconds
 * @param {Boolean} [userParams.loop=false] loop?
 */
  cracked.buffer = function(userParams) {
    var creationParams = {
      "method": "createBufferSource",
      "settings": {},
      "mapping": {
        "speed": "playbackRate.value",
        "start": "loopStart",
        "end": "loopEnd"
      }
    };
    var buffersrc = createNode("buffer", creationParams, userParams);
    loadBuffer(userParams, buffersrc);
    return cracked;
  };

/**
 * helper function for buffer & reverb
 * @function
 * @private
 */
  function loadBuffer(userParams, node) {
    if (userParams && userParams.path && node) {
      loadBufferFromFile(userParams.path, node.getNativeNode());
    } else if (userParams && userParams.fn && node) {
      loadBufferWithData(userParams.fn, node.getNativeNode());
    }
  }

/**
 * helper function for buffer & reverb
 * @function
 * @private
 */
  function loadBufferWithData(dataFunction, buffersrc) {
    if (dataFunction && buffersrc) {
      buffersrc.buffer = dataFunction(_context);
    }
  }

/**
 * helper function for buffer & reverb
 * @function
 * @private
 */
  function loadBufferFromFile(path_to_soundfile, buffersrc) {
    if (path_to_soundfile && buffersrc) {
      fetchSoundFile(path_to_soundfile, function(sndArray) {
        _context.decodeAudioData(sndArray, function(buf) {
          buffersrc.buffer = buf;
          logToConsole("sound loaded");
        }, function() {
          logToConsole("Couldn't load audio");
        });
      });
    }
  }

/**
 * asynchronously fetches a file for the buffer and returns an arraybuffer
 * @function
 * @private
 */
  function fetchSoundFile(path, callback) {
    if (path && callback) {
      var request = new XMLHttpRequest();
      request.open("GET", path, true); // Path to Audio File
      request.responseType = "arraybuffer"; // Read as Binary Data
      request.onload = function() {
        if (__.isFun(callback)) {
          callback(request.response);
        }
      };
      request.send();
    }
  }

  // Mutators

/**
 * Calls start() on the currently selected nodes
 * Throws no error if there are no selected nodes
 * that have a start method
 * @function
 * @public
 */
  cracked.start = function() {
    if (!recordingMacro()) {
      for (var i = 0; i < _selectedNodes.length; i++) {
        var currNode = getNodeWithUUID(_selectedNodes[i]);
        if (currNode && !currNode.getIsPlaying()) {
          currNode.start(0);
        }
      }
    }
    return cracked;
  };

/**
 * Calls stop() on the currently selected nodes
 * Throws no error if there are no selected nodes
 * that have a stop method
 * @function
 * @public
 */
  cracked.stop = function() {
    for (var i = 0; i < _selectedNodes.length; i++) {
      var currNode = getNodeWithUUID(_selectedNodes[i]);
      if (currNode && currNode.getIsPlaying()) {
        currNode.stop(0);
      }
    }
    return cracked;
  };

/**
 * Public method to ramp a parameter on currently selected nodes
 * Value & Endtime parameters can be numbers or arrays of numbers
 * for multisegement ramps. Initial value param is optional, if
 * omitted, then the current value is used as the initial value.
 * If loop is running, then ramp start times are snapped to the
 * sequencer grid.
 * @function
 * @public
 * @param {Number|Array} value target value to ramp to
 * @param {Number|Array} endtime length of ramp in seconds
 * @param {String} paramToRamp name of parameter to ramp
 * @param {Number} initial value to start the ramp at
 *
 */
  cracked.ramp = function(value, endtime, paramToRamp, initial) {
    for (var i = 0; i < _selectedNodes.length; i++) {
      var currNode = getNodeWithUUID(_selectedNodes[i]);
      if (currNode) {
        currNode.ramp(value, endtime, paramToRamp, null, initial);
      }
    }
    return cracked;
  };

/**
 * Set attribute values on a node. Takes an object with
 * any number of key:value pairs to set
 * @function
 * @public
 * @param {Object} userParams options object
 * @param {String} userParams.paramName
 * @param {} userParams.paramValue
 *
 */
  cracked.attr = function(userParams) {
    for (var i = 0; i < _selectedNodes.length; i++) {
      var currNode = getNodeWithUUID(_selectedNodes[i]);
      if (currNode && userParams) {
        currNode.attr(userParams);
      }
    }
    return cracked;
  };

/**
 * parses the dot separated keys in the param string and sets the value on the node helper for the above
 * @private
 * @param {Object} node native node we are setting on
 * @param {String} keyStr unresolved parameter name
 * @param {*} value value to set
 * @param {Object} map name/param mapping
 */
  function applyParam(node, keyStr, value, map) {
    var mappingResult = resolveParamMapping(keyStr, map),
      keyArr = mappingResult.path.split("."),
      keyFunc = mappingResult.fn || function(val) {
        return val;
      };
    for (var i = 0; i < keyArr.length; i++) {
      if ((i + 1) < keyArr.length && __.isNotUndef(node[keyArr[i]])) {
        if (node[keyArr[i]].constructor.name === "AudioParam") {
          setAudioParam(node[keyArr[i]], value);
        } else {
          node = node[keyArr[i]];
        }
      } else if (node && __.isNotUndef(node[keyArr[i]])) {
        node[keyArr[i]] = keyFunc(value);
      }
    }
  }

/**
 * helper for above - set value at time
 * @private
 * @param node
 * @param value
 */
  function setAudioParam(node, value) {
    if (node && __.isFun(node.setValueAtTime)) {
      node.setValueAtTime(value, _loopTimeToNextStep);
    }
  }

/**
 * parameter name mapping resolver takes a native node &
 * the name to be resolved helper for above
 * @private
 * @param name param name
 * @param map mapping hash
 * @returns {*}
 */
  function resolveParamMapping(name, map) {
    var mapping = map || {},
        result = mapping[name] || name;
    return result.path ? result : {
      path: result
    };
  }

  // Node Creation

/**
 * node factory -  create, configure and connect new nodes. returns an instance of audio node wrapper class
 * @private
 * @param {String} type
 * @param {Object} creationParams hash of params supplied by the invoking factory method
 * @param {Object} userSettings user supplied params
 * @returns {AudioNode}
 */
  function createNode(type, creationParams, userSettings) {
    var node = new AudioNode(type, creationParams, userSettings || {});
    saveNode(node);
    //bail if we're only creating a macro wrapper
    if (node.isMacro()) {
      return node;
    }
    //if there are selected nodes then connect to those, otherwise use the previous node
    var nodesToConnect = _selectedNodes.length ? _selectedNodes : [getPreviousNode()];
    for (var i = 0; i < nodesToConnect.length; i++) {
      var nodeToConnect = getNodeWithUUID(nodesToConnect[i]);
      if (nodeToConnect) {
        try {
          nodeToConnect.connect(node);
          nodeToConnect.pushNextNode(node);
          node.setPrevNode(nodeToConnect);
          logConnections(nodeToConnect, node);
        } catch (e) {
          console.error("ERROR : couldn't connect nodes " + nodeToConnect.getType() + " and " + node.getType());
          throw e;
        }
      }
    }
    resetSelection();
    setPreviousNode(node);
    return node;
  }

/**
 * Native audio nodes are made here.
 * @param {Object} creationParams
 * @private
 * @returns {*}
 */
  function audioNodeFactory(creationParams) {
    var node;
    if (_context && creationParams.method && _context[creationParams.method]) {
      node = _context[creationParams.method].apply(_context, creationParams.methodParams || []);
      for (var creationParam in creationParams.settings) {
        if (creationParams.settings.hasOwnProperty(creationParam)) {
          applyParam(node, creationParam, creationParams.settings[creationParam], creationParams.mapping);
        }
      }
    } else if (_context && creationParams.method && !_context[creationParams.method]) {
      //must be "createDestination" method
      node = _context.destination;
    } else {
      //its a macro
      node = [];
    }
    logToConsole(node);
    return node;
  }

/**
 * wrapper class for audio nodes
 * @private
 * @param {String} type audio node type
 * @param {Object} creationParams app supplied params
 * @param {Object} userSettings user supplied params
 * @type {AudioNode}
 * @constructor
 */
  function AudioNode(type, creationParams, userSettings) {

    var uuid,
      macroContainerUUID,
      macroNameSpace = "",
      parameters,
      nodeType,
      nativeNode,
      prevNode,
      isPlaying = false,
      nextNode = [],
      paramMapping = {},
      that = this;

    uuid = generateUUID(); //generate uuid
    mergeObjects(userSettings, creationParams.settings); //merge in the params from the user
    mergeObjects(userSettings.mapping, creationParams.mapping); //merge in mappings from the user    
    parameters = creationParams; //merged user and creations params
    paramMapping = creationParams.mapping || creationParams.settings.mapping;
    nodeType = type; //store the node type
    nativeNode = audioNodeFactory(parameters); //make the node
    nativeNode.uuid = uuid; //tag the native node so we can find it's wrapper later

    //wrapper node start method
    this.start = function(nodeParam) {
      var currNode = nodeParam || nativeNode;
      if (__.isArr(currNode)) {
        currNode.forEach(function(_node, _i, _array) {
          //recurse
          that.start(_node);
        });
      } else {
        if (currNode && __.isFun(currNode.start)) {
          var wrapper = getNodeWithUUID(currNode.uuid);
          if (!wrapper.getIsPlaying()) {
            currNode.start(0);
            wrapper.setIsPlaying(true);
            this.setIsPlaying(true);
          }
        }
      }
    };

    //wrapper node stop method
    this.stop = function(nodeParam) {
      var currNode = nodeParam || nativeNode;
      if (__.isArr(currNode)) {
        currNode.forEach(function(_node, _i, _array) {
          //recurse
          that.stop(_node);
        });
      } else {
        if (currNode && __.isFun(currNode.stop)) {
          var wrapper = getNodeWithUUID(currNode.uuid);
          if (wrapper.getIsPlaying()) {
            currNode.stop(0);
            this.resetNode(currNode);
            wrapper.setIsPlaying(false);
            this.setIsPlaying(false);
          }
        }
      }
    };

    //wrapper node ramp method
    //TBD - needs to work with something other than linear ramp
    this.ramp = function(target, time, paramToRamp, nodeParam, initial) {
      var currNode = nodeParam || nativeNode;
      if (__.isArr(currNode)) {
        currNode.forEach(function(_node, _i, _array) {
          //recurse
          that.ramp(target, time, paramToRamp, _node, initial);
        });
      } else {
        var now = _isLoopRunning ? _loopTimeToNextStep : _context.currentTime;
        if (
          currNode &&
          currNode[paramToRamp] &&
          __.isFun(currNode[paramToRamp].linearRampToValueAtTime)
        ) {
            currNode[paramToRamp].cancelScheduledValues(now);
            var initialValue = __.ifUndef(initial, currNode[paramToRamp].value),
                prevTime = 0;
            currNode[paramToRamp].setValueAtTime(initialValue, now);
          if (
            __.isArr(target) &&
            __.isArr(time) &&
            target.length === time.length
          ) {
              for (var i = 0; i < target.length; i++) {
                prevTime = __.isUndef(time[i - 1]) ? 0 : (time[i - 1] + prevTime);
                logToConsole(" target " + target[i] + " time " + (_context.currentTime + prevTime + time[i]));
                currNode[paramToRamp].linearRampToValueAtTime(target[i], (now + prevTime + time[i]));
              }
          } else {
            currNode[paramToRamp].linearRampToValueAtTime(target, (now + time));
          }
        }
      }
    };

    //instance method for setting attributes
    this.attr = function(userParams) {
      for (var key in userParams) {
        if (userParams.hasOwnProperty(key)) {
          if (__.isNotUndef(userParams[key])) {
            var nativeNode = this.getNativeNode();
            if (__.isArr(nativeNode)) {
              flatten(nativeNode).forEach(function(_node, _i, _array) {
                var mapping = userParams.mapping || getNodeWithUUID(_node.uuid).getParamMapping();
                applyParam(_node, key, userParams[key], mapping || {});
                logToConsole(_node);
              });
            } else {
              var mapping = userParams.mapping || getNodeWithUUID(nativeNode.uuid).getParamMapping();
              applyParam(nativeNode, key, userParams[key], mapping || {});
              logToConsole(nativeNode);
            }
          }
        }
      }    
    };

    this.search = function(str) {
        var nodes = [];
        if(str) {
            var prefix = this.getMacroNameSpace();
            var selector = prefix + str;
            var nodeIds = getNodesWithSelector(selector);
            for(var i=0;i<nodeIds.length;i++) {
                if(getNodeWithUUID(nodeIds[i]).getMacroContainerUUID()===this.getUUID()) {
                    nodes.push(nodeIds[i]);
                }
            }
        }
        return nodes;
    };

    //returns the full macro namespace
    this.getMacroNameSpace = function() {
      return macroNameSpace;
    };

    this.setMacroNameSpace = function(name) {
        if(name) {
            macroNameSpace = name;
        }
    };

    //returns true if this node is a macro container
    this.isMacro = function() {
      return (__.isArr(nativeNode));
    };

    //returns true if its part of macro
    this.isMacroComponent = function() {
      return __.isNotUndef(macroContainerUUID);
    };

    //id of the containing macro 
    this.setMacroContainerUUID = function(uuid) {
      if (__.isStr(uuid)) {
        macroContainerUUID = uuid;
      }
    };

    //id of the containing macro 
    this.getMacroContainerUUID = function() {
      return macroContainerUUID;
    };

    //is this node playing
    this.getIsPlaying = function() {
      return isPlaying;
    };

    this.setIsPlaying = function(bool) {
      isPlaying = bool;
    };

    //get the previous node in the chain 
    //that this node is connected to   
    this.getPrevNode = function() {
      return prevNode;
    };

    this.setPrevNode = function(node) {
      prevNode = node;
    };

    //add a node to the next node array
    this.pushNextNode = function(node) {
      if (node) {
        //make sure that we're setting next node on the same
        //node that the connect is happening on (not a container macro)
        var nodes = getNodesToConnect(this, node);
        var fromNode = getNodeWithUUID(nodes.from.uuid);
        if (fromNode.getUUID() !== this.getUUID()) {
          fromNode.pushNextNode(node);
        } else {
          nextNode.push(node);
        }
      }
    };

    //returns the uuid for a node
    this.getUUID = function() {
      return uuid;
    };

    //returns all the parameters for this node
    this.getParams = function() {
      return parameters;
    };

    //returns the param mapping for this node
    this.getParamMapping = function() {
      return paramMapping;
    };

    //returns the type of this node
    this.getType = function() {
      return nodeType;
    };

    //returns the user created id (not the uuid)
    //if there is one
    this.getID = function() {
      return parameters.settings.id || "";
    };

    //returns user created classname if there is one
    this.getClass = function() {
      return parameters.settings["class"] || "";
    };

    //returns true if this node and the node param have
    //the same macro container
    this.areSiblings = function(node) {
      var parentNodeID = (__.isObj(node)) ?
        node.getMacroContainerUUID() : (__.isStr(node)) ?
        getNodeWithUUID(node).getMacroContainerUUID() : "";
      return parentNodeID === this.getMacroContainerUUID();
    };

    //returns true if this node is (or is part of) a modulator macro
    this.isModulator = function() {
      if (
        this.getMacroContainerUUID() &&
        !!getNodeWithUUID(this.getMacroContainerUUID()).getParams().settings.modulates
      ) {
        return true;
      } else {
        return !!this.getParams().settings.modulates;
      }
    };

    //returns a string identifying the parameter that the macro node modulates 
    this.isModulatorType = function() {
      if (
        this.isModulator() &&
        this.getMacroContainerUUID() &&
        !!getNodeWithUUID(this.getMacroContainerUUID()).getParams().settings.modulates
      ) {
        return getNodeWithUUID(this.getMacroContainerUUID()).getParams().settings.modulates;
      } else if (this.isModulator()) {
        return this.getParams().settings.modulates;
      } else {
        return "";
      }
    };

    //macro support - adds a native node to the
    //array when a node is added to a macro
    this.addNativeNode = function(nodeToAdd) {
      nativeNode.push(nodeToAdd);
    };

    //returns a native node or an array of native nodes
    this.getNativeNode = function() {
      return nativeNode;
    };

    //reset the nodes that need to be restored after play is complete
    this.resetNode = function(currNode) {
      //if "this" node is a macro ... 
      if (this.isMacro()) {
        //then get the wrapper node for the 
        //current node and call reset on it				
        getNodeWithUUID(currNode.uuid).resetNode();
        //after it's reset, add it to nativeNode array here in the macro
        updateNativeNode(getNodeWithUUID(currNode.uuid).getNativeNode(), currNode.uuid);
      } else {
        //save a reference to any buffers
        var saved_buffer = nativeNode.buffer;
        //create  a new node
        nativeNode = audioNodeFactory(parameters);
        //restore uuid
        nativeNode.uuid = this.getUUID();
        //restore connections
        for (var i = 0; i < nextNode.length; i++) {
          this.connect(nextNode[i]);
        }
        this.connectPrevious();
        //not playing yet so false
        this.setIsPlaying(false);
        //restore the buffer     
        if (saved_buffer) {
          nativeNode.buffer = saved_buffer;
        }
      }
    };

    //for macros - replaces native node in a macro node array
    //with a fresh copy. used by reset.
    //helper for above
    function updateNativeNode(newNode, id) {
      newNode.uuid = id;
      updateNativeNodeHelper(nativeNode, newNode);
    }

    //helper for above
    function updateNativeNodeHelper(currNode, newNode) {
      currNode.forEach(function(n, i, a) {
        if (__.isArr(n)) {
          updateNativeNodeHelper(n, newNode);
        } else if (n.uuid === newNode.uuid) {
          a[i] = newNode;
        }
      });
    }

    // Connection

    //public connection method
    this.connect = function(nodeToConnect) {
      if (nodeToConnect && this.getUUID() !== nodeToConnect.getUUID()) {
        var nodes = getNodesToConnect(this, nodeToConnect);
        if (nodes.from && __.isFun(nodes.from.connect) && nodes.to) {
          nodes.from.connect(nodes.to);
        } else {
          logToConsole("ERROR - connect did not happen");
        }
      }
    };

    //public connection method
    this.connectPrevious = function() {
      var pNode = this.getPrevNode();
      if (pNode && this.getUUID() !== pNode.getUUID()) {
        var nodes = getNodesToConnect(pNode, this);
        if (nodes.from && __.isFun(nodes.from.connect) && nodes.to) {
          nodes.from.connect(nodes.to);
        } else {
          logToConsole("ERROR - connect did not happen");
        }
      }
    };

    //private method to find the right node connection points
    //helper for above
    //"!fromNode.areSiblings(toNode)" is there to prevent sibling nodes whose 
    //common parent container is a modulator from
    //trying to connect to each other as modulators (since their parent 
    //is a modulator, they are considered modulators too)
    function getNodesToConnect(fromNode, toNode) {
      if (
        fromNode &&
        fromNode.isModulator() &&
        toNode &&
        !fromNode.areSiblings(toNode)
      ) {
        return {
          "from": getNodeToConnect(fromNode, "from"),
          "to": getNodeToConnectToModulator(toNode, fromNode.isModulatorType())
        };
      } else {
        return {
          "from": getNodeToConnect(fromNode, "from"),
          "to": getNodeToConnect(toNode, "to")
        };
      }
    }

    //returns the right node for a connection
    //helper for above
    function getNodeToConnect(node, whichNode) {
      if (node) {
        var rawNode = node.getNativeNode();
        if (__.isArr(rawNode)) {
          //in a macro connections are made with the first and last node in the macro.
          //tbd - support a way to designate connection nodes
          rawNode = (whichNode === "from") ? rawNode[rawNode.length - 1] : rawNode[0];
        }
        return rawNode;
      } else {
        return null;
      }
    }

    //private method that returns the correct audio param to connect a modulator to.
    //helper for above
    function getNodeToConnectToModulator(node, property) {
      if (node) {
        var rawNode = node.getNativeNode(),
          resolvedProperty = property;
        if (__.isArr(rawNode)) {
          for (var i = 0; i < rawNode.length; i++) {
            resolvedProperty = resolveParamMapping(
              property,
              getNodeWithUUID(rawNode[i].uuid).getParamMapping()
            ).path.replace(".value", "");
            if (__.isNotUndef(rawNode[i][resolvedProperty])) {
              rawNode = rawNode[i][resolvedProperty];
              break;
            }
          }
        } else {
          resolvedProperty = resolveParamMapping(
            property,
            node.getParamMapping()
          ).path.replace(".value", "");
          rawNode = rawNode[resolvedProperty] ? rawNode[resolvedProperty] : null;
        }
        return rawNode;
      } else {
        return null;
      }
    }
  }

  // Time

  var _isLoopRunning = false,
    _loopStepSize = 16,
    _loopInterval = 100,
    _loopID = 0,
    _loopCB = function() {},
    _loopData = [],
    _loopIndex = 0,
    _loopListeners = [],
    _loopTimeToNextStep = 0;

/**
 * main method for loop
 * @public
 * @param {String} [arg] stop/start/reset commands
 * @param {Object} [config] configuration object
 * @param {Number} [config.interval=100] step length in ms
 * @param {Number} [config.steps=16] number of steps
 * @returns {cracked}
 */
  cracked.loop = function() {
    if (arguments && arguments.length) {
      if (arguments[0] === "stop") {
        stopLoop();
      } else if (arguments[0] === "start") {
        startLoop();
      } else if (arguments[0] === "reset") {
        resetLoop();
      } else if (arguments[0] && __.isObj(arguments[0])) {
        //configure loop with options
        //set data & callback
        configureLoop(arguments[0], arguments[1], arguments[2]);
      }
    }
    return cracked;
  };

    /**
     * Starts the loop
     * @private
     */
  function startLoop() {
    if (!_isLoopRunning) {
      _loopTimeToNextStep = _context.currentTime + (_loopInterval / 1000);
      _loopID = setInterval(checkup, (_loopInterval / 1.75));
      _isLoopRunning = true;
    }
  }

    /**
     * Stops the loop
     * @private
     */
  function stopLoop() {
    if (_isLoopRunning) {
      clearInterval(_loopID);
      _isLoopRunning = false;
      _loopTimeToNextStep = 0;
    }
  }

    /**
     * Resets the loop to defaults
     * @private
     */
  function resetLoop() {
    _loopStepSize = 16;
    _loopInterval = 100;
    _loopID = 0;
    _loopCB = function() {};
    _loopData = [];
    _loopListeners = [];
    _loopIndex = 0;
    _isLoopRunning = false;
    _loopTimeToNextStep = 0;
  }

    /**
     * configure the loop options
     * @param {Object} opts configuration object
     * @param {Function} fn global callback
     * @param {Array} data array of data to be passed to the global callback
     * @private
     */
  function configureLoop(opts, fn, data) {
    if (opts) {
      _loopStepSize = opts.steps || 16;
      _loopInterval = opts.interval || 100;
    }
    if (__.isFun(fn)) {
      _loopCB = fn;
    }
    if (__.isArr(data) && data.length === _loopStepSize) {
      _loopData = data;
    } else {
      _loopData = [];
    }
  }

    /**
     * called by setInterval - sets the time to next step
     * @private
     */
  function checkup() {
    var now = _context.currentTime,
      timeAtPreviousStep = _loopTimeToNextStep - _loopInterval / 1000;
    if (now < _loopTimeToNextStep && now > timeAtPreviousStep) {
      loopStep();
      _loopTimeToNextStep += (_loopInterval / 1000);
    }
  }

    /**
     * call on every step
     * @private
     */
  function loopStep() {
    _loopIndex = (_loopIndex < (_loopStepSize - 1)) ? _loopIndex + 1 : 0;
    if (__.isFun(_loopCB)) {
      _loopCB(_loopIndex, cracked.ifUndef(_loopData[_loopIndex], null), _loopData);
    }
    for (var i = 0; i < _loopListeners.length; i++) {
      var listener = _loopListeners[i];
      var tmp = _selectedNodes;
      _selectedNodes = listener.selection;
      listener.callback(_loopIndex, cracked.ifUndef(listener.data[_loopIndex], null), listener.data);
      _selectedNodes = tmp;
    }
  }

    /**
     * Listener - binds a set of audio nodes and a callback to loop step events
     * @public
     * @param {String} eventType currently just "step"
     * @param {Function} fn callback to be invoked at each step
     * @param {Array} data should the same length as the number of steps
     * @returns {cracked}
     */
  cracked.bind = function(eventType, fn, data) {
    if (eventType === "step" && __.isFun(fn)) {
      _loopListeners.push({
        eventType: eventType,
        callback: fn,
        data: data || [],
        selection: _selectedNodes.slice(0),
        selector: _currentSelector
      });
    }
    return cracked;
  };

    /**
     * Remove any steps listeners registered on these nodes
     * @public
     * @param {String} eventType
     */
  cracked.unbind = function(eventType) {
    if (eventType === "step") {
      var tmp = [];
      _loopListeners.forEach(function(el, i, arr) {
        if (_currentSelector !== el.selector) {
          tmp.push(el);
        }
      });
      _loopListeners = tmp;
    }
  };

  // Model

/**
 * Squirrel away nodes for winter
 * @param node
 * @private
 */
  function saveNode(node) {
    updateMacro(node);
    setNode(node);
    setNodeLookup(node);
  }

/**
 * add node to the master list
 * @param node
 * @private
 */
  function setNode(node) {
    _nodeStore[node.getUUID()] = node;
  }

/**
 * save node for lookup table setting references using node type,
 * class & id. tbd - fix bug - when saving node must walk up the
 * macro array to get the complete namespace #11
 * @param node
 * @private
 */
  function setNodeLookup(node) {
    var params = node.getParams().settings;
    var prefix = getCurrentMacroNamespace();
    if (__.isObj(params)) {
      for (var x in params) {
        if (x === "id") {
          setter(_nodeLookup, (prefix + "#" + params[x]), node.getUUID());
        } else if (x === "class") {
          var classArr = params[x].split(",");
          classArr.forEach(function() {
            setter(_nodeLookup, (prefix + "." + params[x]), node.getUUID());
          });
        }
      }
    }
    setter(_nodeLookup, "*", node.getUUID()); //everything   
    setter(_nodeLookup, prefix + node.getType(), node.getUUID());
  }

/**
 * remove references to selected nodes tbd - need to do this for
 * real works ok right now for top level macros
 * @private
 */
  cracked.remove = function() {
    var arr = _currentSelector.split(",");
    //iterate over selectors
    for (var i = 0; i < arr.length; i++) {
      //if we have a top level match
      if (_nodeLookup[arr[i]]) {
        var keyArr = Object.keys(_nodeLookup);
        for (var j = 0; j < keyArr.length; j++) {
          var re = new RegExp(arr[i] + "\\s*");
          //get all the child nodes of this macro
          if (keyArr[j].match(re)) {
            var tmp = _nodeLookup[keyArr[j]];
            for (var k = 0; k < tmp.length; k++) {
              delete _nodeStore[[keyArr[j]][k]];
              var index = _nodeLookup["*"].indexOf(_nodeLookup[keyArr[j]][k]);
              if (index > -1) {
                _nodeLookup["*"].splice(index, 1);
              }
            }
            delete _nodeLookup[keyArr[j]];
          }
        }
      }
    }
  };

    /**
     * get node with a uuid returns a AudioNode instance
     * says uuid but actually works with a variety of input
     * tbd - refactor this to getNode() or something
     * @param {*} uuid
     * @private
     * @returns {*}
     */
  function getNodeWithUUID(uuid) {
    if (uuid && _nodeStore[uuid]) {
      return _nodeStore[uuid];
    } else if (
      uuid && __.isObj(uuid) &&
      uuid.constructor.name === "AudioNode"
    ) {
      //its already an audio node so just return it
      return uuid;
    //its the raw node so fetch the wrapper and return it
    } else if(__.isObj(uuid) && __.isNotUndef(uuid.uuid)) {
        return getNodeWithUUID(uuid.uuid);
    } else {
      return null;
    }
  }

    /**
     * get node reference, supports comma delimited selectors node
     * type, id or class returns array of node ids
     * @param {String} selector
     * @private
     * @returns {Array}
     */
  function getNodesWithSelector(selector) {
    var selector_array = selector.split(","),
      nodes = [];
    selector_array.forEach(function(currSelector, i, array) {
      if (currSelector && _nodeLookup[currSelector]) {
        var tmp = _nodeLookup[currSelector];
        //if id then just return the first in the array
        tmp = (
          getSelectorType(currSelector) === "id" &&
          __.isArr(tmp) &&
          tmp.length > 1
        ) ? [tmp[0]] : tmp;
        //dedupe 
        nodes = arrayUnique(nodes.concat(tmp));
      }
    });
    return nodes;
  }

    /**
     * Get previous node
     * @private
     * @returns {*}
     */
  function getPreviousNode() {
    return _previousNode;
  }


    /**
     * Sets previous node
     * @private
     * @param {Object} node
     */
  function setPreviousNode(node) {
    if (node) {
      _previousNode = node;
    }
  }


    /**
     * Returns selector type: class, id or type
     * @private
     * @param {String} str
     * @returns {string}
     */
  function getSelectorType(str) {
    return str.match(/^\./) ? "class" : str.match(/^\#/) ? "id" : "type";
  }


    /**
     * Returns a random number between min & max
     * @plugin
     * @param {*} test thing to test for undefined
     * @param {*} def default value to return if test is undefined
     */
    cracked.ifUndef = function(test, def) {
        return typeof test === "undefined" ? def : test;
    };

    /**
     * Returns true if not undefined
     * @plugin
     * @param {*} test thing to test for undefined
     */
    cracked.isNotUndef = function(test) {
        return typeof test !== "undefined";
    };

    /**
     * Returns true if undefined
     * @plugin
     * @param {*} test thing to test for undefined
     */
    cracked.isUndef = function(test) {
        return typeof test === "undefined";
    };

    /**
     * Returns true if param is an object
     * @plugin
     * @param {*} obj thing to test
     */
    cracked.isObj = function(obj) {
        return obj && typeof obj === "object";
    };

    /**
     * Returns true if param is a number
     * @plugin
     * @param {*} num thing to test
     */
    cracked.isNum = function(num) {
        if (num === null || num === "") {
            return false;
        } else {
            return !isNaN(num);
        }
    };

    /**
     * Returns true if param is a string
     * @plugin
     * @param {*} str thing to test
     */
    cracked.isStr = function(str) {
        return str && typeof str === "string";
    };

    /**
     * Returns true if param is an array
     * @plugin
     * @param {*} arr thing to test
     */
    cracked.isArr = function(arr) {
        return arr && arr instanceof Array;
    };

    /**
     * Returns true if param is a function
     * @plugin
     * @param {*} fn thing to test
     */
    cracked.isFun = function(fn) {
        return fn && fn instanceof Function;
    };

    /**
     * flatten multidimensional arrays
     * @private
     * @param {Array} a
     * @param {Array} r
     * @returns {*|Array}
     */
  function flatten(a, r) {
    //http://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript
    r = r || [];
    for (var i = 0; i < a.length; i++) {
      if (a[i].constructor === Array) {
        flatten(a[i], r);
      } else {
        r.push(a[i]);
      }
    }
    return r;
  }

    /**
     * Dedupe array
     * @private
     * @param {Array} array
     * @returns {*|Array|string}
     */
  function arrayUnique(array) {
    var a = array.concat();
    for (var i = 0; i < a.length; ++i) {
      for (var j = i + 1; j < a.length; ++j) {
        if (a[i] === a[j]) {
            a.splice(j--, 1);
        }
      }
    }
    return a;
  }

    /**
     * get unique id
     * @private
     * @returns {string}
     */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

    /**
     * helper function to set values in a map
     * @param {Object} map
     * @param {string} key
     * @param {*} value
     * @private
     */
  function setter(map, key, value) {
    if (map && key) {
      if (map[key] && map[key].push) {
        map[key].push(value);
      } else {
        map[key] = [value];
      }
    }
  }

    /**
     * adds and overwrites properties from the src obect to the target object
     * @private
     * @param source
     * @param target
     * @returns {*|{}}
     */
  function mergeObjects(source, target) {
    source = source || {};
    target = target || {};
    for (var x in source) {
        if(source.hasOwnProperty(x)) {
            target[x] = source[x];
        }
    }
    return target;
  }

  // Development/Debug

  (function() {
    if (window.location.href.indexOf("debug=true") !== -1) {
      _debugEnabled = true;
    }
  })();

    /**
     * print a ton of shit to the console
     * @private
     * @param msg
     */
  function logToConsole(msg) {
    if (_debugEnabled) {
      console.log(msg);
    }
  }

    /**
     * dump the node lookup object to the console
     * @private
     */
  cracked._dumpState = function() {
    console.log(_nodeLookup);
  };

    /**
     * debug method to get a node with a uuid
     * @param uuid
     * @returns {*}
     * @private
     */
  cracked._getNode = function(uuid) {
    return (getNodeWithUUID(uuid));
  };

    /**
     * log connections
     * @param nodeToConnect
     * @param node
     * @private
     */
  function logConnections(nodeToConnect, node) {

    var vals = [
      nodeToConnect.getType(),
      nodeToConnect.getID(),
      node.getType(),
      node.getID()
    ];

    logToConsole("connected "+vals[0]+" - "+vals[1]+" to "+vals[2]+" - "+vals[3]);
  }

  //set the global entry points
  window.cracked = cracked;
  window.__ = window.__ || cracked;

})();;/**
 * Convolver Reverb
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Boolean} [userParams.reverse=false] reverse reverb
 * @param {String} [userParams.path] path to impulse file. if no path, impulse is generated.
 * @param {Number} [userParams.seconds=3] if generated impulse, length in seconds.
 * @param {Number} [userParams.decay=2] if generated impulse, length of decay in seconds
 * @param {Function} [userParams.fn=buildImpulse] custom function to generate an impulse buffer
 */

cracked.reverb = function(userParams) {

  var params = __.ifUndef(userParams, {});

  //if there's no path to an impulse
  //then generate our own
  if (!params.path) {
    params.fn = params.fn || buildImpulse;
  }

  //if building an impulse
  var _seconds = __.ifUndef(params.seconds, 3);
  var _reverse = __.ifUndef(params.reverse, false);
  var _decay = __.ifUndef(params.decay, 2);

  __.begin("reverb", params).convolver(params).end("reverb");

  //default method to generate an impules 
  function buildImpulse(audioContext) {

    var rate = audioContext.sampleRate,
      length = rate * _seconds,
      decay = _decay,
      impulse = audioContext.createBuffer(2, length, rate),
      impulseL = impulse.getChannelData(0),
      impulseR = impulse.getChannelData(1),
      n, i;

    for (i = 0; i < length; i++) {
      n = _reverse ? length - i : i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    return impulse;
  }

  return cracked;

};


/**
 * Delay
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.delay=1] delay time in seconds
 * @param {Number} [userParams.damping=0.84] feedback input gain
 * @param {Number} [userParams.cutoff=1500] frequency of lowpass filtering on feedback loop
 * @param {Number} [userParams.feedback=0.5] feedback gain output
 */

cracked.delay = function(userParams) {

  userParams = __.ifUndef(userParams, {});
  var time = __.isObj(userParams) ? (__.ifUndef(userParams.delay, 1)) : userParams;

  __.begin("delay", userParams);

  __.gain({
    id: "delay-input"
  }).

  nativeDelay({
    id: "native-delay",
    delay: time,
    mapping: {
      "delay": "delayTime.value"
    }
  }).

  gain({
    id: "delay-damping",
    gain: __.ifUndef(userParams.damping, 0.84),
    mapping: {
      "damping": "gain.value"
    }
  }).

  lowpass({
    id: "delay-cutoff",
    frequency: __.ifUndef(userParams.cutoff, 1500),
    mapping: {
      "cutoff": "frequency.value"
    }
  }).

  gain({
    id: "delay-feedback",
    gain: __.ifUndef(userParams.feedback, 0.5),
    mapping: {
      "feedback": "gain.value"
    }
  }).

  gain({
    id: "delay-output"
  });

  __("#delay-feedback").connect("#delay-input");

  __("#native-delay").gain(0.5).connect("#delay-output");

  __.end("delay");

  return cracked;

};

/**
 * Comb - adapted from https://github.com/web-audio-components
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.delay=0.027] delay time in seconds
 * @param {Number} [userParams.damping=0.84] feedback input gain
 * @param {Number} [userParams.cutoff=3000] frequency of lowpass filtering on feedback loop
 * @param {Number} [userParams.feedback=0.84] feedback gain output
 */
cracked.comb = function(params) {

  var userParams = __.ifUndef(params, {});

  __.begin("comb", userParams);

  __.gain({
    id: "comb-input"
  }).
  nativeDelay({
    id: "comb-delay",
    delay: __.ifUndef(userParams.delay, 0.027),
    mapping: {
      "delay": "delayTime.value"
    }
  }).
  gain({
    id: "comb-damping",
    gain: __.ifUndef(userParams.damping, 0.84),
    mapping: {
      "damping": "gain.value"
    }
  }).
  lowpass({
    id: "comb-cutoff",
    frequency: __.ifUndef(userParams.cutoff, 3000),
    mapping: {
      "cutoff": "frequency.value"
    }
  }).
  gain({
    id: "comb-feedback",
    gain: __.ifUndef(userParams.feedback, 0.84),
    mapping: {
      "feedback": "gain.value"
    }
  }).
  connect("#comb-input");

  __("#comb-damping").
  gain({
    id: "output"
  });

  __.end("comb");

  return cracked;

};;/**
 * Bitcrusher - adapted from http://noisehack.com/custom-audio-effects-javascript-web-audio-api/
 * @plugin
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=0.1]
 * @param {Number} [params.bits=6]
 */
cracked.bitcrusher = function(params) {

	params = params || {};

	__.begin("bitcrusher", params);

	__.script({
		fn: (function(options) {

			var bits = options.bits || 6; // between 1 and 16
			var normfreq = __.ifUndef(options.frequency, 0.1); // between 0.0 and 1.0
			var step = Math.pow(1 / 2, bits);
			var phaser = 0;
			var last = 0;

			function crusher(e) {
				var input = e.inputBuffer.getChannelData(0);
				var output = e.outputBuffer.getChannelData(0);
				for (var i = 0; i < 4096; i++) {
					phaser += normfreq;
					if (phaser >= 1.0) {
						phaser -= 1.0;
						last = step * Math.floor(input[i] / step + 0.5);
					}
					output[i] = last;
				}
			}

			return crusher;

		})(params)
	});

	__.end("bitcrusher");

	return cracked;

};

/**
 * Ring Modulator - adapted from http://webaudio.prototyping.bbc.co.uk/ring-modulator/
 * @plugin
 * @param {Object} [params] map of optional values
 * @param {Number} [params.distortion=1]
 * @param {Number} [params.frequency=30]
 */
cracked.ring = function(params) {

	var options = params || {};

	var thisCurve = setCurve(__.ifUndef(options.distortion, 1));

	__.begin("ring", params);

	__.gain({
		id: "player"
	}).
	gain({
		id: "vcInverter1",
		gain: -1
	}).
	waveshaper({
		id: "vcDiode3",
		curve: thisCurve,
		mapping: {
			"distortion": {
				"path": "curve",
				"fn": (function() {
					return setCurve;
				})()
			}
		}
	}).
	compressor({
		threshold: -12
	});

	__("#player").
	waveshaper({
		id: "vInDiode4",
		curve: thisCurve,
		mapping: {
			"distortion": {
				"path": "curve",
				"fn": (function() {
					return setCurve;
				})()
			}
		}
	}).
	connect("compressor");

	__().sine({
		id: "vIn",
		frequency: options.frequency || 30,
		mapping: {
			"frequency": "frequency.value"
		}
	}).
	gain({
		id: "vInGain",
		gain: 0.5
	}).
	gain({
		id: "vInInverter1",
		gain: -1
	}).
	gain({
		id: "vInInverter2",
		gain: -1
	}).
	waveshaper({
		id: "vInDiode1",
		curve: thisCurve,
		mapping: {
			"distortion": {
				"path": "curve",
				"fn": (function() {
					return setCurve;
				})()
			}
		}
	}).
	gain({
		id: "vInInverter3",
		gain: -1
	}).
	connect("compressor");

	__("#vInGain").
	connect("#vInDiode4");

	__("#vInGain").
	connect("#vcInverter1");

	__("#vInInverter1").
	waveshaper({
		id: "vInDiode2",
		curve: thisCurve,
		mapping: {
			"distortion": {
				"path": "curve",
				"fn": (function() {
					return setCurve;
				})()
			}
		}
	}).
	connect("#vInInverter3");

	__("compressor").
	gain({
		id: "outGain",
		gain: 4
	});

	__.end("ring");

	return cracked;

	function setCurve(distortion) {

		var i, samples, v, value, wsCurve, _i, _ref, vb, vl, h;

		vb = 0.2;
		vl = 0.4;
		h = __.ifUndef(distortion, 1);

		samples = 1024;
		wsCurve = new Float32Array(samples);

		for (i = _i = 0, _ref = wsCurve.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
			v = (i - samples / 2) / (samples / 2);
			v = Math.abs(v);
			if (v <= vb) {
				value = 0;
			} else if ((vb < v) && (v <= vl)) {
				value = h * ((Math.pow(v - vb, 2)) / (2 * vl - 2 * vb));
			} else {
				value = h * v - h * vl + (h * ((Math.pow(vl - vb, 2)) / (2 * vl - 2 * vb)));
			}
			wsCurve[i] = value;
		}
		return wsCurve;
	}

};
//adapted from https://github.com/web-audio-components
/**
 * Overdrive, waveshaper with additional parameters
 * @plugin
 * @param {Object} [params] map of optional values
 * @param {Number} [params.drive=0.5]
 * @param {Number} [params.color=800]
 * @param {Number} [params.postCut=3000]
 */
cracked.overdrive = function(userParams) {

	userParams = userParams || {};
	var drive = __.isObj(userParams) ? __.ifUndef(userParams.drive, 0.5) : userParams;

	__.begin("overdrive", userParams);

	__.gain({
		id: "input"
	}).
	bandpass({
		frequency: __.ifUndef(userParams.color, 800),
		mapping: {
			"color": "frequency.value"
		}
	}).
	waveshaper({
		curve: makeCurve(drive),
		mapping: {
			"drive": {
				"path": "curve",
				"fn": (function() {
					return makeCurve;
				})()
			}
		}
	}).
	lowpass({
		frequency: __.ifUndef(userParams.postCut, 3000),
		mapping: {
			"postCut": "frequency.value"
		}
	}).
	gain({
		id: "output"
	});

	__.end("overdrive");

	return cracked;

	function makeCurve(value) {
		var k = value * 100,
			n = 22050,
			curve = new Float32Array(n),
			deg = Math.PI / 180;

		for (var i = 0; i < n; i++) {
			var x = i * 2 / n - 1;
			curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
		}
		return curve;
	}

};;/**
 * Attack Decay Sustain Release envelope
 * @plugin
 * @param {Array}  [userParams] 4 values: attack,decay,sustain,release
 * @param {Array} [userParams] 5 values: attack,decay,sustain,hold, release
 * @param {String} [userParams] "slow" or "fast"
 * @param {Number} [userParams=0.5] length of the total envelope
 */
cracked.adsr = function(userParams) {
	var methods = {
		init: function(options) {

            options = options || {};

            options = __.isNum(options) ||
                      __.isArr(options) ||
                      __.isStr(options) ? {envelope:options} : options;

			__.begin("adsr", options).gain({

				gain: 0

			}).end("adsr");

		},
		trigger: function(params) {
            cracked.each(function(el,i,arr) {
                //adsr nodes only
                if(el.getType()==="adsr") {
                    var p = makeEnv(params,el.getParams().settings.envelope);
                    //options = attack,decay,sustain,hold,release
                    el.ramp(
                        [1, p[2], p[2], 0],
                        [p[0], p[1], p[3], p[4]],
                        "gain",
                        null,
                        0
                    );
                }
            });
		},
        release: function() {
            cracked.each(function(el,i,arr) {
                if(el.getType()==="adsr") {
                    //hard code 100 ms release for now
                    el.ramp(0,0.1,"gain");
                }
            });
        }
	};

	if (methods[userParams]) {
		methods[userParams].apply(this, Array.prototype.slice.call(arguments, 1));
	} else {
		methods.init(userParams);
	}

    function makeEnv(userParams,nodeParams) {

        //user params take precedence over the ones stored in the node
        var args = userParams || nodeParams;

        //trigger arguments :
        //an array of 5 values [attack,decay,sustain,hold,release]
        //or 4 values [attack,decay,sustain,release] ()
        //or a one number specifying the total length of the envelope
        //or a string (either "fast" or "slow") to specify the length
        //tbd - add a proper default

        var p = [0, 0, 0, 0, 0],
            segment,
            options = args || 0.5;

        if (__.isArr(options)) {
            if (options.length === 5) {
                p = options;
            } else if (options.length === 4) {
                var sum = options[0] + options[1] + options[3];
                p = [options[0], options[1], options[2], (sum / 3), options[3]];
            }
        } else if (__.isNum(options)) {
            segment = options / 4;
            p = [segment, segment, 0.5, segment, segment];
        } else if (__.isStr(options)) {
            if (options === "slow") {
                options = 1;
            } else if (options === "fast") {
                options = 0.25;
            } else {
                options = 0.5;
            }
            segment = options / 4;
            p = [segment, segment, 0.5, segment, segment];
        }
        return p;
    }

	return cracked;
};;  //test
  cracked.foo = function(userParams) {
    __.begin("foo", userParams).lowpass().gain().compressor().end("foo");
    return cracked;
  };

  //test
  cracked.bar = function(userParams) {
    __().begin("bar", userParams).buffer({
      path: "../data/various/gun-cock.wav",
      loop: true
    }).gain().end("bar");
    return cracked;
  };

  //test
  cracked.dalek = function(userParams) {
    __().begin("dalek", userParams).buffer({
      path: "../data/various/ringmod_good-dalek.wav",
      loop: true
    }).gain().end("dalek");
    return cracked;
  };

  //test macro inside of macro inside of macro
  cracked.junk = function(userParams) {
    __.begin("junk", userParams).foo().end("junk");
    return cracked;
  };

  //test using connect in a macro
  cracked.komb = function(userParams) {
    __.begin("komb", userParams).gain({
      id: "input"
    }).delay({
      time: 0.025
    }).gain({
      id: "output"
    });
    __("#output").gain({
      gain: 0.85,
      id: "feedback"
    }).connect("#input").end("komb");
    return cracked;
  };;/**
 * Lowpass Filter
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440] frequency
 * @param {Number} [userParams.q=0] Q
 */
  cracked.lowpass = function(params) {

      var freq = __.isNum(params) ? params : 440;
      var userParams = __.isObj(params) ? params : {};
      var options = {};

      options.type = userParams.type || "lowpass";
      options.frequency = userParams.frequency || freq;
      options.q = __.ifUndef(userParams.q, 0);
      options.mapping = userParams.mapping || {};

      __.begin("lowpass", userParams).biquadFilter(options).end("lowpass");

      return cracked;
  };
/**
 * Highpass Filter
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440] frequency
 * @param {Number} [userParams.q=0] Q
 */
  cracked.highpass = function(params) {

      var freq = __.isNum(params) ? params : 440;
      var userParams = __.isObj(params) ? params : {};
      var options = {};

      options.type = userParams.type || "highpass";
      options.frequency = userParams.frequency || freq;
      options.q = __.ifUndef(userParams.q, 0);
      options.mapping = userParams.mapping || {};

      __.begin("highpass", userParams).biquadFilter(options).end("highpass");

      return cracked;
  };
/**
 * Bandpass Filter
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440] frequency
 * @param {Number} [userParams.q=0] Q
 */
  cracked.bandpass = function(params) {

      var freq = __.isNum(params) ? params : 440;
      var userParams = __.isObj(params) ? params : {};
      var options = {};

      options.type = userParams.type || "bandpass";
      options.frequency = userParams.frequency || freq;
      options.q = __.ifUndef(userParams.q, 0);
      options.mapping = userParams.mapping || {};

      __.begin("bandpass", userParams).biquadFilter(options).end("bandpass");

      return cracked;
  };
/**
 * Lowshelf Filter
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440] frequency
 * @param {Number} [userParams.q=0] Q
 * @param {Number} [userParams.gain=0] gain
 */
  cracked.lowshelf = function(params) {

      var freq = __.isNum(params) ? params : 440;
      var userParams = __.isObj(params) ? params : {};
      var options = {};

      options.type = userParams.type || "lowshelf";
      options.frequency = userParams.frequency || freq;
      options.q = __.ifUndef(userParams.q, 0);
      options.gain = __.ifUndef(userParams.gain, 0);
      options.mapping = userParams.mapping || {};

      __.begin("lowshelf", userParams).biquadFilter(options).end("lowshelf");

      return cracked;
  };
/**
 * Highshelf Filter
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440] frequency
 * @param {Number} [userParams.q=0] Q
 * @param {Number} [userParams.gain=0] gain
 */
  cracked.highshelf = function(params) {

      var freq = __.isNum(params) ? params : 440;
      var userParams = __.isObj(params) ? params : {};
      var options = {};

      options.type = userParams.type || "highshelf";
      options.frequency = userParams.frequency || freq;
      options.gain = __.ifUndef(userParams.gain, 0);
      options.q = __.ifUndef(userParams.q, 0);
      options.mapping = userParams.mapping || {};

      __.begin("highshelf", userParams).biquadFilter(options).end("highshelf");

      return cracked;
  };
/**
 * Peaking Filter
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440] frequency
 * @param {Number} [userParams.q=0] Q
 * @param {Number} [userParams.gain=0] gain
 */
  cracked.peaking = function(params) {

      var freq = __.isNum(params) ? params : 440;
      var userParams = __.isObj(params) ? params : {};
      var options = {};

      options.type = userParams.type || "peaking";
      options.frequency = userParams.frequency || freq;
      options.q = __.ifUndef(userParams.q, 0);
      options.gain = __.ifUndef(userParams.gain, 0);
      options.mapping = userParams.mapping || {};

      __.begin("peaking", userParams).biquadFilter(options).end("peaking");

      return cracked;
  };
/**
 * Notch Filter
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440] frequency
 * @param {Number} [userParams.q=0] Q
 */
  cracked.notch = function(params) {

      var freq = __.isNum(params) ? params : 440;
      var userParams = __.isObj(params) ? params : {};
      var options = {};

      options.type = userParams.type || "notch";
      options.frequency = userParams.frequency || freq;
      options.q = __.ifUndef(userParams.q, 10);
      options.mapping = userParams.mapping || {};

      __.begin("notch", userParams).biquadFilter(options).end("notch");

      return cracked;
  };
/**
 * Allpass Filter
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440] frequency
 * @param {Number} [userParams.q=0] Q
 */
  cracked.allpass = function(params) {

      var freq = __.isNum(params) ? params : 440;
      var userParams = __.isObj(params) ? params : {};
      var options = {};

      options.type = userParams.type || "allpass";
      options.frequency = userParams.frequency || freq;
      options.q = __.ifUndef(userParams.q, 10);
      options.mapping = userParams.mapping || {};

      __.begin("allpass", userParams).biquadFilter(options).end("allpass");

      return cracked;
  };; /**
 * System out - destination with a master volume
 * @plugin
 * @param {Number} [params=1] system out gain
 */
cracked.dac = function(params) {
  var gain = __.isNum(params) ? params : 1;
  var userParams = __.isObj(params) ? params : {};
  var options = {};
  options.mapping = userParams.mapping || {};
  __.begin("dac", userParams).gain(gain).destination().end("dac");
  return cracked;
};
 /**
  * Sampler - sound file player
  * @plugin
  * @param {Object} [userParams] map of optional values
  * @param {Number} [userParams.speed=1]
  * @param {Number} [userParams.start=1]
  * @param {Number} [userParams.end=1]
  * @param {Boolean} [userParams.loop=false]
  */
cracked.sampler = function(params) {
  //sampler only plays sound files not data from functions
  if (params && params.path) {
    __.begin("sampler", params).buffer(params).end("sampler");
  }
  return cracked;
};;/**
 * Low Frequency Oscillator
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {String} [userParams.modulates=frequency]
 * @param {String} [userParams.type=saw]
 * @param {Number} [userParams.frequency=6]
 * @param {Number} [userParams.gain=1000]
 */
  cracked.lfo = function(userParams) {
    var params = userParams || {};
    params.modulates = params.modulates || "frequency";

    if (params.type === "white" || params.type === "pink" || params.type === "brown") {
      __().
      begin("lfo", params).
      noise({
        "type": (params.type || "white"),
        "channels": (params.channels || 1),
        "length": (params.length || 1)
      }).
      gain({
        "gain": __.ifUndef(params.gain, 1000)
      }).
      end("lfo");
    } else {
      __().
      begin("lfo", params).
      osc({
        "type": (params.type || "sawtooth"),
        "frequency": (params.frequency || 6)
      }).
      gain({
        "gain": __.ifUndef(params.gain, 1000)
      }).
      end("lfo");
    }
    return cracked;
  };;/**
 * noise parametrized noise node
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {String} [userParams.type=white]
 */
  cracked.noise = function(params) {
  	var userParams = params || {};
  	if (userParams.type === "brown") {
  		__.begin("noise", userParams).brown(userParams).end("noise");
  	} else if (userParams.type === "pink") {
  		__.begin("noise", userParams).pink(userParams).end("noise");
  	} else {
  		__.begin("noise", userParams).white(userParams).end("noise");
  	}
  	return cracked;
  };

/**
 * Pink Noise - http://noisehack.com/generate-noise-web-audio-api/
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.channels=1]
 * @param {Number} [userParams.length=1]
 */
  cracked.pink = function(params) {

  	var userParams = params || {};
  	var channels = userParams.channels || 1;
  	var length = userParams.length || 1;

  	__().begin("pink", userParams).buffer({
  		fn: buildBuffer,
  		loop: true
  	}).end("pink");

  	return cracked;

  	function buildBuffer(audioContext) {

  		var rand,
  			buf = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate);
  		for (var i = 0; i < buf.length; i++) {
  			rand = Math.random() * 2 - 1;
  			for (var j = 0; j < buf.numberOfChannels; j++) {
  				buf.getChannelData(j)[i] = buf.numberOfChannels === 2 ? Math.random() * 2 - 1 : rand;
  			}
  		}

  		pinkify(buf);

  		function pinkify(buf) {
  			var buffer = buf,
  				b = [0, 0, 0, 0, 0, 0, 0],
  				channelData, white, i, j, pink = [];
  			for (i = 0; i < buffer.numberOfChannels; i++) {
  				pink[i] = new Float32Array(buffer.length);
  				channelData = buffer.getChannelData(i);
  				for (j = 0; j < buffer.length; j++) {
  					white = channelData[j];
  					b[0] = 0.99886 * b[0] + white * 0.0555179;
  					b[1] = 0.99332 * b[1] + white * 0.0750759;
  					b[2] = 0.96900 * b[2] + white * 0.1538520;
  					b[3] = 0.86650 * b[3] + white * 0.3104856;
  					b[4] = 0.55000 * b[4] + white * 0.5329522;
  					b[5] = -0.7616 * b[5] - white * 0.0168980;
  					pink[i][j] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362;
  					pink[i][j] *= 0.11;
  					b[6] = white * 0.115926;
  				}
  				b = [0, 0, 0, 0, 0, 0, 0];
  			}

  			for (i = 0; i < buffer.numberOfChannels; i++) {
  				for (j = 0; j < buffer.length; j++) {
  					buffer.getChannelData(i)[j] = pink[i][j];
  				}
  			}

  		}

  		return buf;
  	}
  };
/**
 * White Noise - http://noisehack.com/generate-noise-web-audio-api/
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.channels=1]
 * @param {Number} [userParams.length=1]
 */
  cracked.white = function(params) {

  	var userParams = params || {};
  	var channels = userParams.channels || 1;
  	var length = userParams.length || 1;

  	__().begin("white", userParams).buffer({
  		fn: buildBuffer,
  		loop: true
  	}).end("white");

  	return cracked;

  	function buildBuffer(audioContext) {
  		var buffer = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate);
  		var buflen = buffer.length;
  		var bufNum = buffer.numberOfChannels;
  		for (var i = 0; i < buflen; i++) {
  			for (var j = 0; j < bufNum; j++) {
  				buffer.getChannelData(j)[i] = Math.random() * 2 - 1;
  				buffer.getChannelData(j)[i] *= 0.44;
  			}
  		}
  		return buffer;
  	}
  };

/**
 * Brown Noise - http://noisehack.com/generate-noise-web-audio-api/
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.channels=1]
 * @param {Number} [userParams.length=1]
 */
  cracked.brown = function(params) {

  	var userParams = params || {};
  	var channels = userParams.channels || 1;
  	var length = userParams.length || 1;

  	__().begin("brown", userParams).buffer({
  		fn: buildBuffer,
  		loop: true
  	}).end("brown");

  	return cracked;

  	function buildBuffer(audioContext) {
  		var buffer = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate),
  			lastOut = 0.0;
  		for (var i = 0; i < buffer.length; i++) {
  			for (var j = 0; j < buffer.numberOfChannels; j++) {
  				var white = Math.random() * 2 - 1;
  				buffer.getChannelData(j)[i] = (lastOut + (0.02 * white)) / 1.02;
  				lastOut = buffer.getChannelData(j)[i];
  				buffer.getChannelData(j)[i] *= 3.5; // (roughly) compensate for gain
  			}
  		}
  		return buffer;
  	}

  };;  //need a custom wave osc

  /**
   * Sine Wave Oscillator
   * @plugin
   * @param {Object} [userParams] map of optional values
   * @param {Number} [userParams.frequency=440]
   * @param {Number} [userParams.detune=0]
   * @param {String} [userParams.type=sine]
   */
  cracked.sine = function(params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.type = userParams.type || "sine";
    options.frequency = userParams.frequency || freq;
    options.detune = userParams.detune || 0;
    options.mapping = userParams.mapping || {};

    __.begin("sine", userParams).osc(options).end("sine");

    return cracked;
  };
  /**
   * Square Wave Oscillator
   * @plugin
   * @param {Object} [userParams] map of optional values
   * @param {Number} [userParams.frequency=440]
   * @param {Number} [userParams.detune=0]
   * @param {String} [userParams.type=sine]
   */
  cracked.square = function(params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.type = userParams.type || "square";
    options.frequency = userParams.frequency || freq;
    options.detune = userParams.detune || 0;
    options.mapping = userParams.mapping || {};

    __.begin("square", userParams).osc(options).end("square");

    return cracked;
  };
  /**
   * Sawtooth Wave Oscillator
   * @plugin
   * @param {Object} [userParams] map of optional values
   * @param {Number} [userParams.frequency=440]
   * @param {Number} [userParams.detune=0]
   * @param {String} [userParams.type=sine]
   */
  cracked.saw = function(params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.type = userParams.type || "sawtooth";
    options.frequency = userParams.frequency || freq;
    options.detune = userParams.detune || 0;
    options.mapping = userParams.mapping || {};

    __.begin("saw", userParams).osc(options).end("saw");

    return cracked;
  };
  /**
   * Triangle Wave Oscillator
   * @plugin
   * @param {Object} [userParams] map of optional values
   * @param {Number} [userParams.frequency=440]
   * @param {Number} [userParams.detune=0]
   * @param {String} [userParams.type=sine]
   */
  cracked.triangle = function(params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.type = userParams.type || "triangle";
    options.frequency = userParams.frequency || freq;
    options.detune = userParams.detune || 0;
    options.mapping = userParams.mapping || {};

    __.begin("triangle", userParams).osc(options).end("triangle");

    return cracked;
  };;cracked.monosynth = function(params) {
    //do this: http://noisehack.com/how-to-build-monotron-synth-web-audio-api/

    var methods = {
        init: function(options) {
            //set up a basic synth: lfo, sine, lowpass, envelope
            __().begin("monosynth",params).

                lfo({gain:0}).

                sine().

                lowpass({q:0}).

                adsr().

                gain().

                end("monosynth");
        },
        noteOn: function(params) {

            //process incoming arguments for this note
            var args = params || {};
            var freq = __.isNum(params) ? __.pitch2freq(params) : __.pitch2freq(args.pitch);
            var env = args.envelope || 1;

            //loop thru selected nodes
            cracked.each(function(el,index,arr) {
                //only if its a monosynth
                if(el.getType()==="monosynth") {
                    //select any internal sine nodes the monosynth contains (using "el.search(sine)")
                    //and then call frequency() passing in the pitch argument we got w noteOn.
                    cracked.exec("frequency",[freq],el.search("sine"));
                    //grab internal adsr and call trigger, pass the envelope parameter we received
                    cracked.exec("adsr",["trigger",env],el.search("adsr"));
                    //ditto internal lfo and ramp() the frequency
                    //cracked.exec("ramp",[[100,10],[(env*0.5),(env*0.5)],"frequency",10],el.search("lfo"));
                    //ditto internal lowpass
                    //cracked.exec("ramp",[[freq/2,freq*3],[(env*0.1),(env*0.9)],"frequency",freq*3],el.search("lowpass"));
                }
            });
        },
        noteOff: function() {
            cracked.each(function(el,index,arr) {
                if(el.getType()==="monosynth") {
                    //call the adsr release
                    cracked.exec("adsr",["release",[]],el.search("adsr"));
                }
            });
        }
    };

    if (methods[params]) {
        methods[params].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
        methods.init(params);
    }

    return cracked;
};

cracked.cracksynth = function(params) {

    var methods = {
        init: function(options) {
            //set up a basic synth: lfo, sine, lowpass, envelope
            __().begin("cracksynth",params).

                lfo({gain:100}).

                sine().

                lowpass({q:20}).

                adsr().

                gain().

            end("cracksynth");
        },
        noteOn: function(params) {

            //process incoming arguments for this note
            var args = params || {};
            var freq = __.isNum(params) ? __.pitch2freq(params) : __.pitch2freq(args.pitch);
            var env = args.envelope || 1;

            //loop thru selected nodes
            cracked.each(function(el,index,arr) {
                //only if its a monosynth
                if(el.getType()==="cracksynth") {
                    //select any internal sine nodes the monosynth contains (using "el.search(sine)")
                    //and then call frequency() passing in the pitch argument we got w noteOn.
                    cracked.exec("frequency",[freq],el.search("sine"));
                    //grab internal adsr and call trigger, pass the envelope parameter we received
                    cracked.exec("adsr",["trigger",env],el.search("adsr"));
                    //ditto internal lfo and ramp() the frequency
                    cracked.exec("ramp",[[100,10],[(env*0.5),(env*0.5)],"frequency",10],el.search("lfo"));
                    //ditto internal lowpass
                    cracked.exec("ramp",[[freq/2,freq*3],[(env*0.1),(env*0.9)],"frequency",freq*3],el.search("lowpass"));
                }
            });
        },
        noteOff: function() {
            cracked.each(function(el,index,arr) {
                if(el.getType()==="cracksynth") {
                    //call the adsr release
                    cracked.exec("adsr",["release",[]],el.search("adsr"));
                }
            });
        }
    };

    if (methods[params]) {
        methods[params].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
        methods.init(params);
    }

    return cracked;
};;  /**
   * Frequency setter convenience method
   * @plugin
   * @param {Number} userParam frequency to set
   */
  cracked.frequency = function(userParam) {
    if (__.isNum(userParam)) {
      cracked.attr({
        "frequency": userParam
      });
    }
    return cracked;
  };

  /**
   * Detune setter convenience method
   * @plugin
   * @param {Number} userParam detune frequency to set
   */
  cracked.detune = function(userParam) {
    if (__.isNum(userParam)) {
      cracked.attr({
        "detune": userParam
      });
    }
    return cracked;
  };

  /**
   * Gain setter convenience method
   * @plugin
   * @param {Number} userParam gain to set
   */
  cracked.volume = function(userParam) {
    if (__.isNum(userParam)) {
      cracked.attr({
        "gain": userParam
      });
    }
    return cracked;
  };

  /**
   * Delay time setter convenience method
   * @plugin
   * @param {Number} userParam delay time to set
   */
  cracked.time = function(userParam) {
    if (__.isNum(userParam)) {
      cracked.attr({
        "delay": userParam
      });
    }
    return cracked;
  };

  /**
   * Feedback setter convenience method
   * @plugin
   * @param {Number} userParam feedback amount to set
   */
  cracked.feedback = function(userParam) {
    if (__.isNum(userParam)) {
      cracked.attr({
        "feedback": userParam
      });
    }
    return cracked;
  };

  /**
   * Speed setter convenience method
   * @plugin
   * @param {Number} userParam sampler speed to set
   */
  cracked.speed = function(userParam) {
    if (__.isNum(userParam)) {
      cracked.attr({
        "speed": userParam
      });
    }
    return cracked;
  };

  /**
   * Drive setter convenience method
   * @plugin
   * @param {Number} userParam drive distortion/waveshaper/etc to set
   */
  cracked.drive = function(userParam) {
    if (__.isNum(userParam)) {
      cracked.attr({
        "drive": userParam
      });
    }
    return cracked;
  };

  /**
   * Distortion setter convenience method
   * @plugin
   * @param {Number} userParam distortion to set
   */
  cracked.distortion = function(userParam) {
    if (__.isNum(userParam)) {
      cracked.attr({
        "distortion": userParam
      });
    }
    return cracked;
  };

  /**
   * Convenient way to say start everything
   * @plugin
   */
  cracked.play = function() {
    cracked("*").start();
    return cracked;
  };

  /**
   * Returns a musical scale/mode based on type
   * @plugin
   * @param {String} type scale type
   */
  cracked.scale = function(type) {
    return {
      "major": [0, 2, 4, 5, 7, 9, 11],
      "minor": [0, 2, 3, 5, 7, 8, 10]
    }[type];
  };

  //from https://github.com/hoch/WAAX/blob/master/src/core/Helper.js
  /**
   * Converts a pitch value to frequency
   * @plugin
   * @param {Number} pitch
   */
  cracked.pitch2freq = function(pitch) {
    return 440.0 * Math.pow(2, ((Math.floor(pitch) - 69) / 12));
  };

  /**
   * Returns a random number between min & max
   * @plugin
   * @param {Number} min
   * @param {Number} max
   */
  cracked.random = function(min, max) {
    return Math.round(min + Math.random() * (max - min));
  };