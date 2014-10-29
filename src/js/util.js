(function(){

    'use strict';

    var tick = (typeof process !== 'undefined' && process.nextTick) ? process.nextTick : window.setTimeout;

    var Util = {

        tick: function(fn){

            //defer callback to nextTick in node.js otherwise setTimeout in the client
            tick(fn, 1);

        },

        each:function(obj, fn){

            var halt = Object.create(null),
                keys;

            //duck typing ftw
            if(typeof obj.length === 'undefined'){

                keys = Object.keys(obj);

                for(var i = 0, l = keys.length; i < l; i++){

                    if(fn.call(this, obj[keys[i]], keys[i], obj, halt) === halt) return;

                }

                return;

            }

            //cached length is faster
            for(var i = 0, l = obj.length; i < l; i++){

                if (fn.call(this, obj[i], i, obj, halt) === halt) return;

            }

        },

        //in order synchronous traversal
        traverse: function(list, fn){

            Util.each.call(this, list, function(result){

                var halt;

                //invoke function on result first
                halt = fn.apply(this, Array.prototype.slice.call(arguments));

                //traverse results
                if(Util.is(result, 'object') || Util.is(result, 'array')){

                    Util.traverse.call(this, result, fn);

                }

                return halt;

            });

        },

        //fix merge and extend
        //merge doesnt overwrite if exists
        merge: function(obj){

            var args = Array.prototype.slice.call(arguments, 1);

            for(var i = 0, l = args.length; i < l; i++){

                //Object.keys then loop
                Util.each(args[i], function(value, key){

                    if(typeof obj[key] === 'undefined'){

                        obj[key] = value;

                    }

                });

            }

            return obj;

        },

        //adds enumerable properties to object, returns that object
        extend: function(obj){

            var args = Array.prototype.slice.call(arguments, 1);

            for(var i = 0, l = args.length; i < l; i++){

                //Object.keys then loop
                Util.each(args[i], function(value, key){

                    obj[key] = value;

                });

            }

            return obj;

        },

        //props is a object.defineProp descriptor
        inherit: function(construct, superConstruct, props){

            //Sets the prototype of the construct to a new object created from super.
            //Uses ECMAScript 5 Object.create
            if(construct.prototype && superConstruct.prototype){

                //Use carefully: v8 creates subclasses everytime the prototype is modified.
                construct.prototype = Object.create(superConstruct.prototype, props);
                construct.prototype.constructor = construct;

            }

            return construct;

        },

        match: function(list, query){

            var matched = true;

            Util.each(query, function(val, key, q, halt){

                if(list[key] !== val) {
                    matched = false;
                    return halt;
                }

            });

            return matched;

        },

        find: function(list, query){

            var match = Object.create(null);
            match.value = null;
            match.index = -1;

            Util.each(list, function(item, i, l, halt){

                if(Util.match(item, query)){

                    match.value = item;
                    match.index = i;
                    return halt;

                }

            });

            return match;

        },

        bind: function(fn, context){

            return function(){

                return fn.apply(context, Array.prototype.slice.call(arguments));

            };

        },

        is: function(obj, type){

            return Object.prototype.toString.call(obj) === '[object ' + Util.upperCase(type) + ']';

        },

        //Uppercase first letter
        upperCase: function(str){

            return str.replace(/[a-z]/, function(match){return match.toUpperCase()});

        },

        isEmpty: function(obj){

            //converts the operands to numbers then applies strict comparison
            return Object.keys(obj).length == false;

        },

        random: function(min, max){

            return Math.floor(Math.random() * (max - min + 1)) + min;

        },

        noop: function(){}

    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        module.exports = Util;

    } else {

        window.Util = Util;

    }

})();
