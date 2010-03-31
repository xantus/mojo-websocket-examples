/* Ext Stackable Data Filter for IRC
 * 
 * Copyright (c) 2007 - All Rights Reserved
 * David Davis <xantus@xant.us>
 *
 * License: BSD v2 ( with Attribution )
 *
 * Requires: Extjs, Ext.ux.Sprocket.Filter
 */


(function(){

var log;
if ( window.console ) {
    log = function(m) { window.console.log(m); };
} else if ( Ext.log ) {
    log = window.Ext.log;
} else {
    log = Ext.emptyFn;
}


Ext.ux.Sprocket.Filter.IRC = function() {
    Ext.ux.Sprocket.Filter.IRC.superclass.constructor.apply(this,arguments);
};


Ext.extend( Ext.ux.Sprocket.Filter.IRC, Ext.ux.Sprocket.Filter, {


    version: '1.0',


    initialize: function( config ) {
        Ext.ux.Sprocket.Filter.IRC.superclass.initialize.apply(this,arguments);
        this.config = config;

        this.reset();
    },


    clone: function() {
        return new this.constructor( this.config );
    },


    getPending: function() {
        return this.buffer;
    },


    getOneStart: function( items ) {
        if ( !( items instanceof Array ) )
            items = [ items ];

        for ( var i = 0, len = items.length; i < len; i++ )
            this.buffer.push( items[ i ] );
    },

    rmColon: function( txt ) {
        return txt.replace( /^:/, '' );
    },

    getOne: function() {
        var obj = [];
        var item = this.buffer.shift();
        if ( !item )
            return obj;
        var m;
//        log('trying to match:'+item);
        if ( ( m = item.match( /^(PING|PONG) (.+)$/ ) ) )
            obj.push( { name: m[ 1 ].toLowerCase(), args: [ m[ 2 ] ] } );
        else if ( ( m = item.match( /^:(\S+) +(PRIVMSG|NOTICE) +(\S+) +(.+)$/ ) ) ) {
            if ( m[ 2 ] == 'NOTICE' )
                obj.push( { name: 'notice', args: [ m[ 1 ], [ m[ 3 ].split( ',' ) ], this.rmColon( m[ 4 ] ) ] } );
            else if ( m[ 3 ].indexOf( '#' ) >= 0 || m[ 3 ].indexOf( '&' ) >= 0 || m[ 3 ].indexOf( '+' ) >= 0 )
                obj.push( { name: 'public', args: [ m[ 1 ], [ m[ 3 ].split( ',' ) ], this.rmColon( m[ 4 ] ) ] } );
            else
                obj.push( { name: 'msg', args: [ m[ 1 ], [ m[ 3 ].split( ',' ) ], this.rmColon( m[ 4 ] ) ] } );
        } else if ( ( m = item.match( /^:(\S+) +(\d+) +(\S+) +(.+)$/ ) ) )
            obj.push( { name: m[ 2 ], args: [ m[ 1 ], this.rmColon( m[ 4 ] ) ] } );
        else if ( ( m = item.match( /^:(\S+) +MODE +(\S+) +(.+)$/ ) ) )
            obj.push( { name: 'mode', args: [ m[ 1 ], m[ 2 ], this.rmColon( m[ 3 ] ).split( /\s+/ ) ] } );
        else if ( ( m = item.match( /^:(\S+) +KICK +(\S+) +(\S+) +(.+)$/ ) ) )
            obj.push( { name: 'kick', args: [ m[ 1 ], m[ 2 ], m[ 3 ], this.rmColon( m[ 4 ] ) ] } );
        else if ( ( m = item.match( /^:(\S+) +TOPIC +(\S+) +(.+)$/ ) ) )
            obj.push( { name: 'topic', args: [ m[ 1 ], m[ 2 ], this.rmColon( m[ 3 ] ) ] } );
        else if ( ( m = item.match( /^:(\S+) +INVITE +\S+ +(.+)$/ ) ) )
            obj.push( { name: 'invite', args: [ m[ 1 ], this.rmColon( m[ 2 ] ).split( /\s+/ ) ] } );
        else if ( ( m = item.match( /^:(\S+) +WALLOPS +(.+)$/) ) )
            obj.push( { name: 'wallops', args: [ m[ 1 ], this.rmColon( m[ 2 ] ) ] } );
        else if ( ( m = item.match( /^:(\S+) +(\S+) +(.+)$/ ) ) ) {
            /*
            unless (grep {$_ eq lc $2} qw(nick join quit part pong)) {
                warn "*** ACCIDENTAL MATCH: $2\n";
                warn "*** Accident line: $line\n";
            }
            */
            obj.push( { name: m[ 2 ].toLowerCase(), args: [ m[ 1 ], this.rmColon( m[ 3 ] ) ] } );
        } else if ( ( m = item.match( /^NOTICE +\S+ +(.+)$/ ) ) )
            obj.push( { name: 'snotice', args: [ this.rmColon( m[ 1 ] ) ] } );
        else if ( ( m = item.match( /^ERROR +(.+)$/ ) ) )
            obj.push( { name: 'error', args: [ this.rmColon( m[ 1 ] ) ] } );
        else
            log( 'Filter.IRC: Unmatched item '+item );

        return obj;
    },


    put: function( items ) {
        if ( !items )
            return [];
        return items;

        /* XXX */
        var obj = [];
        for ( var i = 0, len = items.length; i < len; i++ )
            obj.push( items[ i ] );
        return obj;
    },

    reset: function() {
        this.buffer = [];
    }

});

})();

