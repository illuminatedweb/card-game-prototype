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
