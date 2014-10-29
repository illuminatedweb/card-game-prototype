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
