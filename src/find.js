/**
 * #Finding#
 * Methods for finding/selecting and working with audio nodes
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
 * [See more selector examples](../../examples/selector.html)
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
 *
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
        _selectedNodes.forEach(function (el, i, arr) {
            if (el && getNodeWithUUID(el).getMacroContainerUUID() !== macroUUID) {
                arr.splice(i, 1);
            }
        });
    }
}

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
cracked.exec = function (method, args, nodes) {
    var save = _selectedNodes;
    _selectedNodes = nodes;
    cracked[method].apply(cracked, args);
    _selectedNodes = save;
    return cracked;
};

/**
 * iterate over the selectedNodes array, executing
 * the supplied function for each element
 * <code>
 * \_\_.each(type, function(node,index,array){
     *      //Loops over any selected nodes. Parameters are the
     *      //current node, current index, and the selectedNode array
     * });</code>
 *
 *
 * @public
 * @function
 * @type {String} type string to be checked against the node type
 * @param {Function} fn function to be called on each node
 * @returns {cracked}
 */
cracked.each = function (type, fn) {
    if (__.isFun(fn)) {
        for (var i = 0; i < _selectedNodes.length; i++) {
            var node = getNodeWithUUID(_selectedNodes[i]);
            if (!type || (type && node.getType() === type)) {
                fn(node, i, _selectedNodes);
            }
        }
    }
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
cracked.filter = function () {
    var tmp = [];
    if (arguments && arguments.length) {
        var str = arguments[0],
            selectorType = getSelectorType(str),
            match = str.match(/^\.|\#/) ? str.substring(1) : str;
        _selectedNodes.forEach(function (nodeID, i, arr) {
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
