(function(){

    var util = typeof require !== 'undefined' ? require('./util') : window.Util,
        Signals = typeof require !== 'undefined' ? require('./signals') : window.Signals,
        extend = util.extend,
        each = util.each;

    var config = {
        point: 0,
        modifier: '',
        name: '',
        description: ''

    };

    function Card(obj){

        extend(this, extend(config, obj));

        if(this.count){

            delete this.count;
            
        }

    }

    Card.object = function(obj){

        //card object factory
        return extend(Object.create(null, {

            point:{
                value: 0,
                enumerable: true,
                writable: true
            },

            modifier:{
                value: '',
                enumerable: true,
                writable: true
            },

            count:{
                value: 1,
                enumerable: true,
                writable: true
            }

        }), obj || Object.create(null));

    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        module.exports = Card;

    } else {

        window.Card = Card;

    }

})();
