(function($) {
  "use strict";

  $.ajaxTransport('binary', function (s) {
     var xhrCallbacks
          ,xhrId = 0
          ,callback
          ,xhrOnUnloadAbort = window.ActiveXObject && function() {
               var key;
               for ( key in xhrCallbacks ) {
                    xhrCallbacks[ key ]( undefined, true );
               }
          };
     return {
          send: function( headers, complete ) {
               var handle, i, xhr = s.xhr();
               xhr.open( s.type, s.url, s.async );
               xhr["responseType"] = "arraybuffer";
               if ( s.mimeType && xhr.overrideMimeType ) {
                    xhr.overrideMimeType( s.mimeType );
               }
               if ( !s.crossDomain && !headers["X-Requested-With"] ) {
                    headers["X-Requested-With"] = "XMLHttpRequest";
               }
               try {
                    for ( i in headers ) {
                         xhr.setRequestHeader( i, headers[ i ] );
                    }
               } catch( err ) {}
               xhr.send( ( s.hasContent && s.data ) || null );
               callback = function( _, isAbort ) {
                    var status, responseHeaders, statusText, responses;
                    try {
                         if ( callback && ( isAbort || xhr.readyState === 4 ) ) {
                              callback = undefined;
                              if ( handle ) {
                                   xhr.onreadystatechange = jQuery.noop;
                                   if ( xhrOnUnloadAbort ) {
                                        delete xhrCallbacks[ handle ];
                                   }
                              }
                              if ( isAbort ) {
                                   if ( xhr.readyState !== 4 ) {
                                        xhr.abort();
                                   }
                              } else {
                                   responses = {};
                                   status = xhr.status;
                                   responseHeaders = xhr.getAllResponseHeaders();
                                   if (s.dataType == "binary") {
                                        responses.binary = xhr.response;
                                   } else {
                                        if ( typeof xhr.responseText === "string" ) {
                                             responses.text = xhr.responseText;
                                        }
                                   }
                                   try {
                                        statusText = xhr.statusText;
                                   } catch( e ) {
                                        statusText = "";
                                   }

                                   if ( !status && s.isLocal && !s.crossDomain ) {
                                        if(s.dataType == "binary") {
                                             status = responses.binary ? 200 : 404;
                                        } else {
                                             status = responses.text ? 200 : 404;
                                        }
                                   } else if ( status === 1223 ) {
                                        status = 204;
                                   }
                              }
                         }
                    } catch( firefoxAccessException ) {
                         if ( !isAbort ) {complete( -1, firefoxAccessException );}
                    }
                    if ( responses ) {complete( status, statusText, responses, responseHeaders );}
               };

               if ( !s.async ) {callback();}
               else if ( xhr.readyState === 4 ) {setTimeout( callback );}
               else {
                    handle = ++xhrId;
                    if ( xhrOnUnloadAbort ) {
                         if ( !xhrCallbacks ) {
                              xhrCallbacks = {};
                              $( window ).unload( xhrOnUnloadAbort );
                         }
                         xhrCallbacks[ handle ] = callback;
                    }
                    xhr.onreadystatechange = callback;
               }
          },

          abort: function() {
               if ( callback ) {
                    callback( undefined, true );
               }
          }
    };
  });
})(jQuery);
