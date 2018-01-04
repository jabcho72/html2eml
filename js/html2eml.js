

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
        ,charset : "utf-8"
        ,convertLocalImages : true
        ,base64Encode : true
    }
    , _CRLF = "\r\n"
    ,_eml = {
      convert : function(_html) {
        var _def = $.Deferred()
            ,_result = "MIME-Version: 1.0" + _CRLF
            ,_boundary = this.createBoundary("related_boundary");
          if (!_options.convertLocalImages) {
              _result += 'Content-Type: text/html' + (_options.charset ? '; charset='+ _options.charset :'') + _CRLF;
              if(_options.base64Encode) {
                _result += 'Content-Transfer-Encoding: base64' + _CRLF;
                _result += _CRLF + this.encodeb64(_html) + _CRLF;
              } else {
                _result += _CRLF + _html + _CRLF;
              }
              _def.resolve(_result);
          } else {
              this.html2related(_html)
              .done(function(data) {
                   return _def.resolve(data); });
          }

          return _def.promise();
      }
      ,createBoundary : function(pf) {
        return "_=_" + pf + "_" + Math.random().toString().substr(2) + "_=_";
      }
      ,encodeb64 : function(d) {
        return $.base64Encode(d).replace(/.{64}(?=.)/g,'$&\r\n');
      }
      ,URI : function(url) {
		var _ret = {};
		if (url.match(/^((?:http|https):\/\/)([^\/:]+)?(.*)$/gi)) {
			_ret.host = RegExp.$2
		} else {
			_ret.host = document.location.hostname;
		}
		return _ret;
  	}
      ,html2related : function(data,_callback) {
  		var _self = this
  		,_localhost = _options.host
          ,_def = new $.Deferred()
          ,_def_res = new $.Deferred()
          ,_dfa = []
  		,_work = {
              total : 0,
              succ : 0,
              fail : 0,
              isAlways : function(){ return this.total <= this.succ + this.fail;}
          }
  		,_boundary = "_=_related_boundary_" + Math.random().toString().substr(2) + "_=_"
  		,_mime = "MIME-Version: 1.0" + _CRLF + "Content-Type: multipart/related;" + _CRLF + "\tboundary=\"" + _boundary + "\"" + _CRLF + _CRLF
  		,_imges = ""
  		,_b64 = function(bin) {
              if(!bin) {return"";}
              var uInt8Array = new Uint8Array(bin);
              return base64ArrayBuffer(uInt8Array).replace(/.{64}(?=.)/g,'$&\r\n');
          }
          ,_cache = {}
  		,_getFileName = function(_h){
               if(!_h) {return "";}
  			if(!_h.contentType) {return _h.id;}
  			var _ctype = _h.contentType.split("/");
  			if(_ctype[0]!= "image") {return _h.id;}
  			if(_ctype.length < 2) {return _h.id;}
  			return _h.id + (_h.contentType.match(/image\/([^\s]+)$/gi) ? "." + RegExp.$1 : "");
  		}
		,_imageMime = function(__o) {
			_imges += "--" + _boundary + _CRLF
				+ "Content-Type: " + __o.contentType + ";" + _CRLF
				+ "\t\tname=\"" + _getFileName(__o) + "\"" + _CRLF
				+ "Content-Transfer-Encoding: base64" + _CRLF
				+ "Content-Disposition: inline;" + _CRLF
				+ "\t\tfilename=\"" + _getFileName(__o) + "\"" + _CRLF
				+ "Content-ID: <" + __o.cid + ">" + _CRLF + _CRLF
				+ __o.data + _CRLF + _CRLF;
			return;
		}
		,_html = data.replace(/(<img[^>]+src=["']?)([^">'\s]+)(["']?[^>]+?>)/gi,
            function(s,$1,$2,$3) {
               var _cid = Math.random().toString().substr(2,6) + "_0_" + (Math.random().toString().substr(2,5));
               if(!_self.URI($2).host.match(new RegExp(_localhost+"$","gi"))) {return s;}
               var _o = null;
               if($2.match(/data\:(image\/[^;]+);base64,([\S\s]+)/gi)) {
               	var _$1 = RegExp.$1, _$2 = RegExp.$2;
               	_o = {id : _cid, cid :_cid + "@tony",contentType : _$1, data : _$2.replace(/.{64}(?=.)/g,'$&\r\n')};
               	_imageMime(_o);
               	return $1+"cid:"+ _o.cid +$3;
               }
               ++_work.total;
               _o = {id : _cid, cid :_cid + "@tony",url :$2,type : "get",dataType : "binary"};
               if(_cache[_o.url]) {++_work.succ;return $1+"cid:"+ _cache[_o.url].cid +$3;};
               _cache[_o.url] = _o;
               var _promise = $.ajax(_o)
               	.then(function(_data,txt,xhr) {
               		$.extend(true, _o, {data : _b64(_data),status : txt,contentType : xhr.getResponseHeader("content-type")});
               		_imageMime(_o);
               		++_work.succ;
               		if(_work.isAlways()) {_def.resolve();}
               	},function(xhr,txt,err) {
               		++_work.fail;
               		_html = _html.replace("cid:"+_o.cid,_o.url);
               		if(_work.isAlways()) {_def.resolve();}
               	});
               _dfa.push(_promise);
               return $1+"cid:"+ _o.cid +$3;
  		});
          _def.done(function() {
               var txthtm = _eml.encodeb64(_html);
               _mime += "--" + _boundary + _CRLF;
               _mime += "Content-Type: text/html;" + _CRLF;
               _mime += "\tcharset=\"utf-8\"" + _CRLF;
               _mime += "Content-Transfer-Encoding: base64" + _CRLF + _CRLF;
               _mime += txthtm + _CRLF + _CRLF;
               _mime += _imges;
               _mime += "--" + _boundary + "--" + _CRLF;
               if(typeof _callback === "function") {_callback(_mime,"success");}
               _def_res.resolve(_mime,"success");
               return;
          });
  		if(!_work.total) {
               _def.resolve(_mime,"success");
          }
          return _def_res.promise();
  	}
    };

    var plugin = $.html2eml = function(html) {
      return _eml.convert(html);
    };
    plugin.options = function(opt) {
      return $.extend(_options,opt);
    };
});
