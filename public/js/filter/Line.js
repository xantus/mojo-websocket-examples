/* Ext Stackable Data Filter for Lines
 * (or anything with a record seperator)
 * 
 * Copyright (c) 2007 - All Rights Reserved
 * David Davis <xantus@xant.us>
 *
 * License: BSD v2 ( with Attribution )
 *
 * Requires: Extjs, Ext.ux.Sprocket.Filter
 */


(function(){

function defined(x) { return x !== undefined };

var log;
if ( window.console ) {
    log = function(m) { window.console.log(m); };
} else if ( Ext.log ) {
    log = window.Ext.log;
} else {
    log = Ext.emptyFn;
}


Ext.ux.Sprocket.Filter.Line = function( config ) {
    Ext.ux.Sprocket.Filter.Line.superclass.constructor.apply(this,arguments);
};


Ext.extend( Ext.ux.Sprocket.Filter.Line, Ext.ux.Sprocket.Filter, {


    version: '1.1',


    buffer: '',
    outputLiteral: "\x0D\x0A",
    inputStart: "^(.*?)",
    inputRegexp: '\x0D\x0A?|\x0A\x0D?|\u2028',
    autoDetectRegexp: /^(.*?)(\x0D\x0A?|\x0A\x0D?|\u2028)/,
    matchInputRegexp: null,
    autoDetectState: null,
    
    AUTO_STATE_DONE: 0x00,
    AUTO_STATE_FIRST: 0x01,
    AUTO_STATE_SECOND: 0x02,


    initialize: function( config ) {
        Ext.ux.Sprocket.Filter.Line.superclass.initialize.apply(this,arguments);
        this.config = config;
        
        this._setInputRegexp();

        this.reset();
    },

    
    clone: function() {
        return new this.constructor( this.lineterm );
    },


    _setInputRegexp: function( inputRegexp ) {
        if ( inputRegexp )
            this.inputRegexp = inputRegexp;
        this.matchInputRegexp = new RegExp( this.inputStart + "(" + this.inputRegexp + ")" );
    },


    getPending: function() {
        return this.buffer;
    },


    getOneStart: function( lines ) {
        if ( !( lines instanceof Array ) )
            lines = [ lines ];

        this.buffer += lines.join( '' );
    },


    getOne: function() {
        if ( !this.buffer.length )
            return [];

        var count = 0; 
        while ( 1 ) {
            /* Autodetect is done, or it never started.  Parse some buffer! */
            if ( !this.autoDetectState ) {
                var ret;
                this.buffer = this.buffer.replace( this.matchInputRegexp,
                    function( m, a ) {
                        ret = [ a ];
//                        log( "got line: <<", a, ">>" );
                        return '';
                    }
                );
                if ( defined( ret ) )
                    return ret;

                break;
            }

            /* Waiting for the first line ending.  Look for a generic newline. */
            if ( this.autoDetectState & this.AUTO_STATE_FIRST ) {
                var line;
                var newline;
                this.buffer = this.buffer.replace( this.autoDetectRegexp,
                    function( m, l, n ) {
                        line = l;
                        newline = n;
                        return '';
                    }
                );
                if ( !defined( line ) )
                    break;
                
                /* The newline can be complete under two conditions.  First: If
                 * it's two characters.  Second: If there's more data in the
                 * framing buffer.  Loop around in case there are more lines.
                 */
                if ( ( newline.length == 2 ) || this.buffer.length ) {
//                    log( "detected complete newline after line: <<" + line + ">>" );
                   
                    this._setInputRegexp( newline );
                    this.autoDetectState = this.AUTO_STATE_DONE;
                } else {
                    /* The regexp has matched a potential partial newline.  Save it,
                     * and move to the next state.  There is no more data in the
                     * framing buffer, so we're done.
                     */
                    log( "detected suspicious newline after line: <<" + line + ">>\n" );
                    this._setInputRegexp( newline );
                    this.autoDetectState = this.AUTO_STATE_SECOND;
                }

                return [ line ];
            }

            /* Waiting for the second line beginning.  Bail out if we don't
             * have anything in the framing buffer.
             */
            if ( this.autoDetectState & this.AUTO_STATE_SECOND ) {
                if ( !this.buffer.length )
                    return [];

                /* Test the first character to see if it completes the previous
                 * potentially partial newline.
                 */
                if ( this.buffer.substr( 0, 1 ) == ( this.inputRegexp == "\x0D" ? "\x0A" : "\x0D" ) ) {

                    /* Combine the first character with the previous newline, and
                     * discard the newline from the buffer.  This is two statements
                     * for backward compatibility.
                     */
//                    log( "completed newline after line: <<" + line + ">>" );
                    this.buffer = this.buffer.replace( /^(.)/,
                        function( m, a ) {
                            this.inputRegexp += a;
                            return '';
                        }
                    );
                    this._setInputRegexp();
                } else {
                    log( "decided prior suspicious newline is okay" );
                }

                /* Regardless, whatever is in INPUT_REGEXP is now a complete
                * newline.  End autodetection, post-process the found newline,
                * and loop to see if there are other lines in the buffer.
                */
                this.autoDetectState = this.AUTO_STATE_DONE;
                continue;
            }

            log( "consistency error: AUTODETECT_STATE = "+this.autoDetectState );
            return [ ];
        }

        return [ ];
    },


    put: function( lines ) {
        if ( !lines )
            return [];
        if ( !( lines instanceof Array ) )
            lines = [ lines ];
        var out = lines.join( this.outputLiteral );
//        log('put(): '+out);
        return ( out.match( this.outputLiteral + '$' ) ) ? out : out + this.outputLiteral;
    },


    reset: function() {
        this.buffer = '';
        this.autoDetectState = ( this.inputRegexp ) ? this.AUTO_STATE_FIRST : this.AUTO_STATE_DONE;
    },


    _test: function() {
        log('starting test');
        var lines = this.put( [ "line one", "line two", "line three" ] );
        log('Line Filter:'+Ext.encode( lines ));
        lines = this.get( "line one\nline two\nline three" );
        var lines2 = this.get( "\nline four\n\nline six\n" );
        lines2.forEach( function( it ) { lines.push( it ); } );
        log('Line Filter with intentional blank line #5:'+Ext.encode( lines ));
        log('done!');
    }


});

})();

