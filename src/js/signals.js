(function(){

    var util = typeof require !== 'undefined' ? require('./util') : window.Util,
        each = util.each;

    function Signal(fn, context, priority){

        this.binding = fn;
        this.context = context;
        this.priority = typeof priority !== 'undefined' ? priority : 0;

    }

    Signal.prototype = {

        invoke: function(args){

            if(this.binding){

                return this.binding.apply(this.context, args);

            }

        }

    };

    function Signals(){

        this._signals = [];

    }

    Signals.prototype = {

        dispatch: function(){

            var args = Array.prototype.slice.call(arguments);

            each(this._signals, function(signal){

                if(signal.invoke(args) === false) return arguments[3];

            });

        },

        add: function(fn, context, priority){

            //signals are one to many, a signal can only belong to one signals class
            //stack not a que, last in first out
            var signal = new Signal(fn, context, priority),
                i = 0;

            while(i < this._signals.length){

                if(signal.priority <= this._signals[i].priority) break;

                i++;

            }

            this._signals.splice(i, 0, signal);

            return signal;

        },

        remove: function(signal){

            //can add the same function with different context or priority
            //so pass signal ref returned by add
            var i = this._signals.indexOf(signal);

            if(i !== -1){

                this._signals.splice(i, 1);

            }

            return i;

        }

    };

    Signals.signal = Signal;

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        module.exports = Signals;

    } else {

        window.Signals = Signals;

    }

})();
