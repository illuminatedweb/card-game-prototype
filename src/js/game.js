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
