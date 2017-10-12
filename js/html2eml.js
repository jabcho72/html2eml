(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS:
        factory(require('jquery'));
    } else {
        // Browser globals:
        factory(window.jQuery);
    }
})(function ($) {
    'use strict';
    var _options = {
        host : window && window.location.host || "localhost"
        ,protocol : window && window.location.protocol||"http"
        ,port : window && window.location.port||80
        ,blockTag : "" //"script"
        ,blockAttribute : "" // "onclick|onload"
    }
    ,_eml = {
      convert : function(_html) {
        return _html;
      }
    };

    var plugin = $.html2eml = function(html) {
      return _eml.convert(html);
    };
    plugin.options = function(opt) {
      return $.extend(_options,opt);
    };
});
