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
