/* Ext Stackable Data Filter for JSON
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


Ext.ux.Sprocket.Filter.JSON = function() {
    Ext.ux.Sprocket.Filter.JSON.superclass.constructor.apply(this,arguments);
};


Ext.extend( Ext.ux.Sprocket.Filter.JSON, Ext.ux.Sprocket.Filter, {


    version: '1.1',


    initialize: function( config ) {
        Ext.ux.Sprocket.Filter.JSON.superclass.initialize.apply(this,arguments);
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


    getOne: function() {
        var obj = [];
        var item = this.buffer.shift();
        if ( !item )
            return obj;
        try {
            obj.push( Ext.decode( item ) );
        } catch( e ) {
            log('bad json in Filter.JSON:'+item+' : '+e);
        };
        return obj;
    },


    put: function( items ) {
        if ( !items )
            return [];
        var obj = [];
        for ( var i = 0, len = items.length; i < len; i++ ) {
            try {
                obj.push( Ext.encode( items[ i ] ) );
            } catch ( e ) {
                log('could not convert item to json in Filter.JSON: '+items[ i ]+' : '+e);
            };       
        }
        return obj;
    },


    reset: function() {
        this.buffer = [];
    },


    _test: function() {
        log('starting test');
        var items = this.put( [ { "foo": "bar" }, { "bar": "baz" }, { "blitz": "boom" } ] );
        log('JSON Filter:'+Ext.util.JSON.encode( items ));
        items = this.get( '[ { "foo": "bar" }, { "bar": "baz" }, { "blitz": "boom" } ]' );
        var items2 = this.get( '{ "foo2": "bar2"  }' );
        items2.forEach( function( it ) { items.push( it ); } );
        log('JSON Filter:'+Ext.util.JSON.encode( items ));
        log('done!');
    }


} );

})();

