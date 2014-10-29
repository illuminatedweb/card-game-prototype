(function(){

    var util = window.Util;

    var model = {
        extend: function(module, proto){
            return util.inherit(module, proto);
        }
    };

    var gameUI = function(){
        this.listElm = null;
        this.active = false;
    };

    function UI(){
        this.game = model.extend(Game);
    }

    UI.prototype = {
        init: function(){
            document.addEventListener('DOMContentLoaded', function(){
                //do thangs
            });
        }
    };

    window.UI = UI;

})();
