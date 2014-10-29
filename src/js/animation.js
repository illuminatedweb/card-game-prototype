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
