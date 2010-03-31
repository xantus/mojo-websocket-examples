/* Ext Stackable Data Filter Base Class
 * 
 * Copyright (c) 2007 - All Rights Reserved
 * David Davis <xantus@xant.us>
 *
 * License: BSD v2 ( with Attribution )
 *
 * Requires: Extjs
 */

Ext.namespace( 'Ext.ux.Sprocket' );


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


Ext.ux.Sprocket.Filter = function( config ) {
    if ( !defined( config ) )
        config = {};
    Ext.apply( this, config );
    this.initialize( config );
};


Ext.override( Ext.ux.Sprocket.Filter, {


    version: '1.1',


    initialize: Ext.emptyFn,


    autoloadFilters: function( filters ) {
        for ( var i = 0, len = filters.length; i < len; i++ ) {
            if ( typeof filters[ i ] == 'string' ) {
                var error = '';
                var filter;
                // try it as a subclass shorthand
                try {
                    filter = eval( 'Ext.ux.Sprocket.Filter.' + this.filters[ i ] );
                    filters[ i ] = new filter();
                    continue;
                } catch(e) {
                    error += e;
                    filter = filters[ i ];
                }
                // try it by itself
                try {
                    filter = eval( filter );
                    filters[ i ] = new filter();
                } catch(e) {
                    error += '; '+e
                    throw 'Failed to load filter: Ext.ux.Sprocket.Filter.'+filter+' or '+filter+' Error:'+error;
                }
            }
        }
        return filters;
    },


    clone: function() {
        return new this.constructor();
    },


    get: function( chunks ) {
        if ( chunks && chunks.length )
            this.getOneStart( chunks );
        var items = [];
        while ( 1 ) {
            var it = this.getOne();
            var len = it.length;
            if ( len )
                for ( var i = 0; i < len; i++ )
                    items.push( it[ i ] );
            else
                break;
        }
        return items;
    },

    reset: Ext.emptyFn


} );


Ext.ux.Sprocket.Filter.Stream = function( ) {
    Ext.ux.Sprocket.Filter.Stream.superclass.constructor.apply(this,arguments);
};


Ext.extend( Ext.ux.Sprocket.Filter.Stream, Ext.ux.Sprocket.Filter, {


    version: '1.0',


    buffer: '',


    clone: function() {
        return new this.constructor();
    },
    

    getOneStart: function( items ) {
        if ( !( items instanceof Array ) )
            items = [ items ];

        this.buffer += items.join( '' );
    },


    getOne: function() {
        if ( !this.buffer.length )
            return [];
        var data = this.buffer;
        this.buffer = '';
        return [ data ];
    },

    
    put: function( data ) {
        return data;
    },


    getPending: function() {
        return this.buffer;
    },

    reset: function() {
        this.buffer = '';
    }


} );



Ext.ux.Sprocket.Filter.Stackable = function() {
    Ext.ux.Sprocket.Filter.Stackable.superclass.constructor.apply(this,arguments);
};


Ext.extend( Ext.ux.Sprocket.Filter.Stackable, Ext.ux.Sprocket.Filter, {


    version: '1.1',
    

    initialize: function() {
        Ext.ux.Sprocket.Filter.Stackable.superclass.initialize.apply(this,arguments);
        if ( !this.filters )
            this.filters = [ 'Stream' ];

        this.filters = this.autoloadFilters( this.filters );
    },


    clone: function() {
        var filters = [];
        this.filters.forEach( function( filter ) {
            filters.push( filter.clone() );
        } );
        return new this.constructor( { filters: filters } );
    },
    

    getOneStart: function( items ) {
        if ( !( items instanceof Array ) )
            items = [ items ];

        this.filters[ 0 ].getOneStart( items );
    },


    getOne: function() {
        var ret = [];

        while ( !ret.length ) {
            var exchanged = 0;

            for ( var i = 0, len = this.filters.length; i < len; i++ ) {

                /* If we have something to input to the next filter, do that. */
                if ( ret.length ) {
                    this.filters[ i ].getOneStart( ret );
                    exchanged++;
                }

                /* Get what we can from the current filter. */
                ret = this.filters[ i ].getOne();
            }

            if ( !exchanged )
                break;
        }

        return ret;
    },


    put: function( data ) {
        for ( var i = this.filters.length - 1; i > -1; i-- ) {
            data = this.filters[ i ].put( data );
            if ( !data.length )
                break;
        }
        return data;
    },


    getPending: function() {
        var data;
        for ( var i =  0, len = this.filters.length; i < len; i++ ) {
            if ( data && data.length )
                this.filters[ i ].put( data ) ;
            data = this.filters[ i ].getPending();
        }
        return data || [];
    },


    getFilters: function() {
        return this.filters;
    },


    unshift: function( filters ) {
        if ( !( filters instanceof Array ) )
            filters = [ filters ];
        // unshift in reverse so that the array passed in is in order, but at the top
        for ( var i = filters.length - 1, len = 0; i >= len; i-- )
            this.filters.unshift( filters[ i ] );
    },


    push: function( filters ) {
        if ( !( filters instanceof Array ) )
            filters = [ filters ];
        for ( var i = 0, len = filters.length; i < len; i++ )
            this.filters.push( filters[ i ] );
    },


    shift: function() {
        var filter = this.filters.shift();
        if ( filter ) {
            var pending = filter.getPending();
            if ( pending && this.filters[ 0 ] )
                this.filters[ 0 ].put( pending );
        }
        return filter;
    },


    pop: function() {
        var filter = this.filters.pop();
        if ( filter ) {
            var pending = filter.getPending();
            if ( pending )
                this.filters[ this.filters.length - 1 ].put( pending );
        }
        return filter;
    },


    reset: function() {
        for ( var i = 0, len = this.filters.length; i < len; i++ )
            this.filters[ i ].reset();
    },


    _test: function() {
        log('starting test');
        this.shift(); // stream
//        this.push( new Ext.ux.Sprocket.Filter.JSON() );
//        this.unshift( new Ext.ux.Sprocket.Filter.Line() );
        this.unshift( [ new Ext.ux.Sprocket.Filter.Line(), new Ext.ux.Sprocket.Filter.JSON() ] );
        var items = this.put( [ { "foo": "bar" }, { "bar": "baz" }, { "blitz": "boom" } ] );
        log('Filter Stackable with Line and JSON (should be json with \r\n between them:'+Ext.encode( items ));
        items = this.get( '{ "foo": "bar" }\r\n{ "bar": "baz" }\r\n{ "blitz": "boom" }\r\n' );
        if ( items.length == 3 && items[0].foo == 'bar' )
            log('PASS, returned an array of 3 objects');
        else
            log('FAIL, did not return an array of 3 objects');
        log('Filter Stackable with Line and JSON:'+Ext.encode( items ));
        log('done!');
    }


});

})();
