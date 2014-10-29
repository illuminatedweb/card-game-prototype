(function(){

    var util = typeof require !== 'undefined' ? require('./util') : window.Util,
        Signals = typeof require !== 'undefined' ? require('./signals') : window.Signals,
        extend = util.extend,
        each = util.each;

    function proxy(method, fn, e){

        return function(){

            var args = Array.prototype.slice.call(arguments);

            if(fn.call(this, args)){

                Array.prototype[method].apply(this, args);

            }else{

                throw new Error('Failed to ' + method + ' item: "' + e + '"');

            }

        };

    }

    //list factory, array proxy for push and splice
    //defaults to adding to list first
    function List(obj, priority){

        var list = Object.create(Array.prototype),
            priority = typeof priority !== 'undefined' ? priority : -1;

        extend(list, obj || Object.create(null));

        list.push = new Signals();

        list.splice = new Signals();

        list.push.add(proxy('push', function(args){

            if(this.indexOf(args[0]) === -1){

                return true;

            }

        }, 'List item exists'), list, priority);

        list.splice.add(proxy('splice', function(args){

            if(this.indexOf(args[0]) !== -1){

                args.splice(0, 1, this.indexOf(args[0]), 1);

                return true;

            }

        }, 'List item does not exist'), list, priority);

        list.add = function(item){

            this.push.dispatch(item);

            return this;

        };

        list.remove = function(item){

            this.splice.dispatch(item);

            return this;

        };

        list.each = function(fn){

            each.call(this, this, fn);

        };

        return list;

    }

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        module.exports = List;

    } else {

        window.List = List;

    }

})();
