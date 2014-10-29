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

(function(){

    var util = typeof require !== 'undefined' ? require('./util') : window.Util;

    function Animation(callback, context){

      this.requestID = null;
      this.resolved = true;
      this.context = context;
      this.bind(callback || util.noop);
      this.time = 0;

    }

    Animation.prototype = {

      bind:function(fn){

        var self = this;

        self.callback = function(time){

          self.time = time;
          fn.apply(self.context, Array.prototype.slice.call(arguments));
          self.resolved = true;

        };

      },

      request:function(fn){

        if(Object.prototype.toString.call(fn) === '[object Function]'){

          this.bind(fn);

        }else if(fn){

          this.cancel();

        }

        this.requestID = window.requestAnimationFrame(this.callback);
        this.resolved = false;

      },

      cancel:function(){

        window.cancelAnimationFrame(this.requestID);
        this.requestID = null;
        this.resolved = true;
        this.frame = 0;

      }

    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        module.exports = Animation;

    } else {

        window.Animation = Animation;

    }

})();

(function(){

    var util = typeof require !== 'undefined' ? require('./util') : window.Util,
        Animation = typeof require !== 'undefined' ? require('./animation') : window.Animation;

    function View3D(object, config){
        this.object = object;
        this.config = {
            objectClass: 'plane',
            rotate: false,
            pan:false,
            zoom:false,
            transformRotate:' rotateX(54.7deg) rotateZ(45deg)',
            transformTranslate:'',
            transformScale:''
        };

        this.animation = new Animation(this.onAnimationFrame, this);
        this.transformRotate = this.config.transformRotate;
        this.transformTranslate = this.config.transformTranslate;
        this.transformScale = this.config.transformScale;
        this.init();
    }

    View3D.prototype = {

        init:function(){
            this.object.classList.add(this.config.objectClass);
            //make mousemove event target configurable
            document.body.addEventListener('touchmove', this.onMouseMove());
            document.body.addEventListener('mousemove', this.onMouseMove());
            this.setTransform();
        },

        setTransform:function(){
            this.object.setAttribute('style', 'transform:' +
                                     this.transformRotate +
                                     this.transformTranslate +
                                     this.transformScale);
        },

        onMouseMove:function(){
            //mouse event closure
            var self = this;
            return function(e){
                e.preventDefault();
                //update info for next frame
                var targetStyle = window.getComputedStyle(e.currentTarget),
                    evt = e.touches ? e.touches[0] : e;
                self.width = targetStyle.getPropertyValue('width').replace('px','');
                self.height = targetStyle.getPropertyValue('height').replace('px','');
                self.mouseX = evt.pageX / self.width;
                self.mouseY = evt.pageY / self.height;

                if(self.animation.resolved){
                    self.animation.request();
                }
            };
        },

        onAnimationFrame:function(){

          var self = this;

          var rotateZ, rotateX, translateX, translateY, translateZ, scale;

          if(self.config.rotate){

            rotateZ = 180 * (1 - self.mouseX);
            rotateX = 90 * (1 - self.mouseY);
            self.transformRotate = ' rotateX(' + rotateX + 'deg) rotateZ(' + rotateZ + 'deg)';

          }else{

            self.transformRotate = self.config.transformRotate;

          }

          if(self.config.pan){

            //for pan to work rotate must be set before translate
            translateZ = self.height * (0.5 - self.mouseY) * -1;
            translateX = self.width * (0.5 - self.mouseX) / 2;
            translateY = self.width * (0.5 - self.mouseX) / 2 * -1;
            self.transformTranslate = ' translateX(' + translateX + 'px) translateY(' + translateY + 'px) translateZ(' + translateZ + 'px)';

          }else{

            self.transformTranslate = self.config.transformTranslate;

          }

          if(self.config.zoom){

            scale = 2 * (1 - self.mouseY);
            self.transformScale = ' scale3d(' + scale + ', ' + scale  + ', ' + scale + ')';

          }else{

            self.transformScale = self.config.transformScale;

          }

          self.setTransform();

        }

    };


    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        module.exports = View3D;

    } else {

        window.View3D = View3D;

    }

})();

(function(){

    var util = typeof require !== 'undefined' ? require('./util') : window.Util,
        List = typeof require !== 'undefined' ? require('./list') : window.List,
        extend = util.extend,
        id = 0;

    var config = {
        name: 'Player'
    };

    function Player(obj){

        this.config = extend(config, obj || Object.create(null));
        this.games = List(undefined, 0);
        this.decks = List(undefined, 0);
        this.id = id++;

        if(this.config.name === 'Player'){

            this.config.name += ' ' + this.id;

        }

        this.decks.push.add(function(deck){

            if(deck.cards.length === 0){

                console.log('Deck is not built');
                return false;

            }

            deck.shuffle();

        }, this);

    }

    Player.prototype = {

        play:function(){

        },

        join:function(game){

            try{

                game.players.add(this);
                this.games.add(game);

            }catch(e){

                console.log(e.message);

            }

        },

        quit:function(game){

            try{

                game.players.remove(this);
                this.games.remove(game);

            }catch(e){

                console.log(e);

            }

        },

        take: function(turn){


            turn.next(this);


        },

        draw: function(){



        }

    };

    Player.config = config;

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        module.exports = Player;

    } else {

        window.Player = Player;

    }

})();

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

(function(){

    var util = typeof require !== 'undefined' ? require('./util') : window.Util,
        List = typeof require !== 'undefined' ? require('./list') : window.List,
        Card = typeof require !== 'undefined' ? require('./card') : window.Card,
        extend = util.extend,
        merge = util.merge,
        random = util.random,
        find = util.find,
        is = util.is,
        each = util.each;

    var config = {
        minPoint: 1,
        maxPoint: 10,
        minLength: 30,
        maxLength: 100,
        typeScaleMultiplier: 1,
        //these are in order of count
        types: ['point', 'hybrid', 'modifier'],
        modifiers: ['merge', 'instant', 'reverse'],
        status: ['not playable', 'playable', 'attacking', 'defending'],
        //these are max length allocations
        pointAllocation: [],
        typeAllocation: [],
        randomTryMax: 1000
    };

    var scale = function(size, len, calc){

        var i = 1,
            scale = [];

        while(i <= len){

            scale.push(calc(i, size, len));

            i ++;

        }

        return scale;

    };

    var multiScale = function(size, len, multiplier){

        return scale(size, len, function(i, s){

            return Math.floor(s * (1 / i + i * multiplier));

        });

    };

    var linearScale = function(size, len){

        return scale(size, len, function(i, s){

            return Math.floor(s * (1 / i));

        });

    };

    function Deck(obj){

        this.config = extend(obj || Object.create(null), config);

        this.cards = List(undefined, 0);

        this.cards.push.add(function(card){

            card.deck = this;//could make this a many to many

        }, this);

        this.randomTryCount = 0;

        //create lists of card objects - these are used to build deck
        each.call(this, this.config.types, function(type){

            var list = List({

                len: function(){

                    var l = 0;

                    this.each(function(cardObject){

                        l += cardObject.count;

                    });

                    return l;

                },

                damage: function(){

                    var d = 0;

                    this.each(function(cardObject){

                        d += cardObject.point;

                    });

                    return d;

                }

            }, 0);

            list.push.add(function(card){

                var found = find(list, card);

                if(found.index !== -1){

                    console.log('trying to add card type ' + type + '; current length of list is ' + list.len() + ' and max is ' + this.config.typeAllocation[this.config.types.indexOf(type)]);

                    if(list.len() < this.config.typeAllocation[this.config.types.indexOf(type)]){

                        found.value.count ++;

                    }else{

                        throw new Error('Failed to add card to deck: "Card type:' + type + ' is at max length"');

                    }

                    return false;

                }else{

                    console.log('card object doesnt exist yet; adding to list')
                    //modify card before adding to list
                    extend(card, Card.object(card));

                }

            }, this);

            this[type] = list;

        });

    }

    Deck.prototype = {

        card: function(obj){

            return Card.object(obj);

        },

        add: function(card){

            if(card instanceof Card){

                this.cards.add(card);

            }else{


            }

        },

        len: function(){

            //returns len of card objects

            var l = 0;

            each.call(this, this.config.types, function(type){

                l += this[type].len();

            });

            return l;

        },

        damage: function(){

            //returns max damage

            return this.hybrid.damage() + this.point.damage();

        },

        addRandomCard: function(){

            if(this.randomTryCount >= this.config.randomTryMax){
                return;
            }

            this.randomTryCount ++;

            var cardObject = Object.create(null),
                randomType = this.config.types[random(0, this.config.types.length - 1)];

            if(randomType == 'point' || randomType == 'hybrid'){

                cardObject.point = random(this.config.minPoint, this.config.maxPoint);

            }

            if(randomType == 'modifier' || randomType == 'hybrid'){

                cardObject.modifier = this.config.modifiers[random(0, this.config.modifiers.length - 1)];

            }

            try{

                this[randomType].add(cardObject);

            }catch(e){

                console.log(e.message);

                this.addRandomCard();

            }

        },

        random: function(){

            var deckSize = random(this.config.minLength, this.config.maxLength),
                i = 0,
                m = (deckSize - this.config.minLength) / (this.config.maxLength - this.config.minLength); //70 / 70 = 1 or 0 / 70

            console.log('Random deck size: ' + deckSize);
            console.log('Linear would be: ' + linearScale(deckSize, this.config.types.length));
            //based on the deck size we can have more or less of the 'special' cards

            //randomly allocate max lengths for card types and point cards
            this.config.typeAllocation = linearScale(deckSize, this.config.types.length, m);
            this.config.pointAllocation = linearScale(deckSize, this.config.maxPoint - this.config.minPoint + 1);

            while(i < deckSize){

                this.addRandomCard();

                i++;

            }

        },

        build: function(){

            this.random();

            each.call(this, this.config.types, function(type){

                each.call(this, this[type], function(cardObject){

                    var count = cardObject.count;

                    while(count){

                        this.cards.add(new Card(cardObject));

                        count --;

                    }

                });

            });

        },

        shuffle: function(count){

            count = count || 10;
            var splice = Array.prototype.splice;

            while(count){

                each.call(this, this.cards, function(card, i, cards, halt){

                    var lookAhead = random(1, 7);

                    if(random(0, 1) && i + lookAhead < cards.length - 1){

                        splice.call(cards, i, 0, splice.call(cards, i + lookAhead, 1)[0]);

                    }

                });

                count--;

            }

        }

    };

    Deck.config = config;

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        module.exports = Deck;

    } else {

        window.Deck = Deck;

    }

})();

(function(){

    var util = typeof require !== 'undefined' ? require('./util') : window.Util,
        Signals = typeof require !== 'undefined' ? require('./signals') : window.Signals,
        List = typeof require !== 'undefined' ? require('./list') : window.List,
        Player = typeof require !== 'undefined' ? require('./player') : window.Player,
        extend = util.extend,
        each = util.each,
        noop = util.noop,
        tick = util.tick;

    function proxy(method, fn, e){

        return function(){

            var args = Array.prototype.slice.call(arguments);

            if(fn.call(this, args)){

                Array.prototype[method].apply(this, args);

            }else{

                throw new Error('Failed to ' + method + ' player: "' + e + '"');

            }

        };

    }

    function Players(){

        var players = Object.create(Array.prototype);

        players.push = new Signals();

        players.splice = new Signals();

        players.push.add(proxy('push', function(args){

            if(this.indexOf(args[0]) === -1){

                return true;

            }

        }, 'Player exists'), players, -1);

        players.splice.add(proxy('splice', function(args){

            if(this.indexOf(args[0]) !== -1){

                args.splice(0, 1, this.indexOf(args[0]), 1);

                return true;

            }

        }, 'Player does not exist'), players, -1);

        players.add = function(player){

            if(!player instanceof Player){

                throw new Error('Failed to add player to game: "Not an instance of Player"');

            }

            this.push.dispatch(player);

            return this.length - 1;

        };

        players.remove = function(player){

            this.splice.dispatch(player);

        };

        return players;

    }

    function Timeouts(){}

    Timeouts.prototype = {

        add:function(ns, fn, delay){

            this[ns] = {
                id: null,
                fn: fn,
                delay: delay,

                set: function(){

                    if(this.id !== null){

                        this.clear();

                    }

                    this.id = window.setTimeout(this.fn, this.delay);

                },

                clear: function(){

                    window.clearTimeout(this.id);

                    this.id = null;

                }

            };

            return this[ns];

        },

        clear:function(){

            this.each(function(timeout){

                timeout.clear();

            });

        },

        each:function(fn){

            each.call(this, this, fn);

        }

    };

    var config = {
        minPlayers: 2,
        maxPlayers: 4,
        health: 100,
        score: 0,
        hand: 5,
        turnTime: 30000,
        joinTime: 3000,
        status: ['paused', 'lobby', 'started', 'over']
    };

    function Game(obj){

        this.config = extend(config, obj || Object.create(null));

        each.call(this, this.config.status, function(status){

            this[status] = new Signals();

        });

        Object.defineProperty(this, '_status', {

            value: 0,
            enumerable: false,
            writable: true

        });

        Object.defineProperty(this, 'status', {

            get:function(){

                return this.config.status[this._status];

            },

            set:function(value){

                if(this.config.status.indexOf(value) == -1){

                    //throw new Error('Game status does not exist');
                    console.warn('Game status does not exist');

                }else{

                    this._status = this.config.status.indexOf(value);
                    this.state.dispatch(value);

                }

            },

            enumerable: true,
            writeable: true

        });

        this.timeouts = new Timeouts();

        //this.players = new Players();
        this.players = List(undefined, 0);

        this.player = List(undefined, 0);

        this.player.push.add()

        this.state = new Signals();

        this.joinTimeout = this.timeouts.add('joinTimeout', function(){

            console.log('Game resetting...');

        }, this.config.joinTime);

        var joinable = function(){

            if(this.status === 'lobby'){

                this.joinTimeout.set();

            }

        };

        //this.players.push.add()

        this.players.push.add(function(player){

            // this.player.add({
            //     index: this.players.indexOf(player),
            //     hand:[],
            //     inPlay:[],
            //     deckIndex: 0,
            //     health: this.config.health,
            //     score: this.config.score,
            //     handSize: this.config.hand,
            //     draw: function(){
            //         var count = this.handSize - hand.length;
            //
            //     },
            //     play: function(i){
            //         this.inPlay.push(this.hand.splice(i, 1)[0]);
            //     },
            //     turn: function(){
            //         each.call(this, this.inPlay, function(i){
            //
            //         });
            //     }
            // });

        }, this, 1);

        this.players.push.add(joinable, this);

        this.state.add(joinable, this);

        this.players.push.add(function(){

            if(this.status !== 'lobby'){

                throw new Error('Game is not joinable');
                //returning false also halts the dispatch

            }

        }, this);


    }

    Game.prototype = {

        start:function(){

            this.started.dispatch();

            this.player.each(function(){

                this.draw();

            });

        },

        lobby:function(){

            //puts game in joinable state
            this.reset();
            this.status = 'lobby';

        },

        reset:function(boot){

            //clear timeouts
            this.timeouts.clear();

            //flush players
            if(boot){

                each.call(this, this.players, function(player){

                    player.quit(this);

                });

            }

        }

    };

    Game.config = config;

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {

        module.exports = Game;

    } else {

        window.Game = Game;

    }

})();
