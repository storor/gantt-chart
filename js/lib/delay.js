(function($){
    $.fn.onDelayed = function(eventName,delayInMs,callback){
        var _timeout;
        this.on(eventName,function(e){
          if(!!_timeout){ 
              clearTimeout(_timeout); 
          }
          _timeout = setTimeout(function(){
              callback(e);
          },delayInMs);
        });
    };
})(jQuery);