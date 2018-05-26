window.EUCookieLaw = function ( settings ) {
	'use strict';

	function guid () {

		function s4 () {
			return Math.floor( (1 + Math.random()) * 0x10000 )
			           .toString( 16 )
			           .substring( 1 );
		}

		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	}

	if ( localStorage.getItem( 'eucookielaw-client-signature' ) === null ) {
		localStorage.setItem( 'eucookielaw-client-signature', guid() );
	}

	if ( !NodeList.prototype.forEach ) {
		/* Internet Explorer forEach polyfill on NodeList */
		NodeList.prototype.forEach = Array.prototype.forEach;
	}

	if ( !Array.prototype.unique ) {
		/* useful Unique function */
		Array.prototype.unique = function () {
			var newArray = [];
			this.map( function ( item ) {
				if ( newArray.indexOf( item ) === -1 ) newArray.push( item );
			} );
			return newArray;
		};
	}

	var VERSION        = '20180526.1',
	    originalCookie = document.cookie, // For future use
	    mainContainer,
	    /*
	     * Helpers functions
	     */
	    all            = function ( selector, container ) {
		    if ( container === undefined ) container = document;
		    return container.querySelectorAll( selector );
	    },
	    one            = function ( selector, container ) {
		    if ( container === undefined ) container = document;
		    return container.querySelector( selector );
	    },
	    element        = function ( e ) {
		    return document.createElement( e );
	    },
	    text           = function ( text ) {
		    return document.createTextNode( text );
	    },
	    remove         = function ( e ) {
		    e.parentNode.removeChild( e );
	    },
	    before         = function ( cloned, item ) {
		    item.parentNode.insertBefore( cloned, item );
		    return cloned;
	    },
	    append         = function ( container, item ) {
		    container.appendChild( item );
	    },
	    set            = function ( object, prop, _set, _get ) {
		    if ( typeof(Object.defineProperty) === 'function' ) {
			    var propObject = {
				    configurable: true
			    };
			    if ( typeof(_set) === 'function' ) propObject[ 'set' ] = _set;
			    if ( typeof(_get) === 'function' ) propObject[ 'get' ] = _get;

			    Object.defineProperty( object, prop, propObject );
		    } else {

			    if ( typeof(_set) === 'function' ) object.__defineSetter__( prop, _set );
			    if ( typeof(_get) === 'function' ) object.__defineGetter__( prop, _get );

		    }
	    };

	var DEBUG         = false,
	    instanceId    = parseInt( Math.random() * 100000 ),
	    currentDialog = null,
	    initialScroll = 0;


	function consentOnScrollCB ( event ) {
		if ( window.scrollY > initialScroll + settings.scrollTolerance ) {
			window.removeEventListener( 'scroll', consentOnScrollCB );

			all( '[data-eucookielaw-id="cookie-group-list-item"]', mainContainer ).forEach( function ( item ) {
				if(DEBUG) console.log( this );

				item.classList.add( settings.dialogCookieItemApprovedClass );
				item.classList.remove( settings.dialogCookieItemRejectedClass );

			} );
			deferredConsent();
		}
	}

	var defaultSettings = {
		    /*
		     * Number of days before agreement expirations
		     */
		    expiringPeriod:  365,
		    /*
		     * `true` allows the cookie to be writen before consent else just the ones defined in the whitelist (`cookieWhitelist`)
		     */
		    cookieEnabled:   false,
		    runLegacyMode:   true,
		    cookieWhiteList: [],

		    /*
		     * How should the user give the consent:
		     *
		     * - `EUCookieLaw.CHECK_MODE_IMMEDIATE`: check/uncheck the cookies group will toggle the consent to specific group of cookies
		     * - `EUCookieLaw.CHECK_MODE_ON_SCROLL`: scrolling the page will notify the user consent
		     * - `EUCookieLaw.CHECK_MODE_ON_CLICK`: clicking wherever on the page will set user consent to all groups
		     * - `EUCookieLaw.CHECK_MODE_ON_CONSENT`: clicking on the close dialog button the consent will be recorded
		     *
		     * This setting can be given to EUCookieLaw through startup settings and can be changed at run-time
		     * using the `setAgreeMode` method.
		     */
		    agreeMethod:       EUCookieLaw.CHECK_MODE_IMMEDIATE,
		    scrollTolerance:   200,
		    /*
		     * Should EUCookieLaw set the minimal style for elements?
		     */
		    applyMinimalStyle: true,
		    /*
		     * Contains the details about each managed node and how to vaule its attributes on replacement.
		     */
		    handledNodes:      {
			    'IFRAME': {
				    attr: {
					    src: 'about:blank'
				    }
			    },
			    'IMG':    {
				    attr: {
					    /*
					     * Empty white pixel
					     */
					    src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
				    }
			    },
			    'SCRIPT': {
				    attr:            {
					    /*
					     * Do nothing
					     */
					    src: 'about:blank'
				    },
				    removeContent:   true,
				    lookupInnerText: true
			    },
			    'LINK':   {
				    attr: {
					    href: 'about:blank'
				    }
			    }
		    },

		    openCallback: function ( item ) {
			    try {

				    /*
				     * Try the jQuery + bootstrap method for opening the consent dialog.
				     */
				    if ( typeof(jQuery) !== 'undefined' && typeof(jQuery.fn.modal) !== 'undefined' ) {
					    jQuery( item ).modal( 'show' );
				    } else {
					    /*
					     * If one of them is not loaded uses the DOM manipulation to emulate the same behavior
					     */
					    item.classList.add( 'in' );
					    // item.style.display = 'block';
					    document.querySelector( 'body' ).classList.add( 'modal-open' );

				    }
				    return true;
			    } catch ( e ) {

			    }

			    return false;

		    },

		    dialogCookieGroupsListHiddenClass:     'hidden',
		    dialogCookieGroupsListDefaultIsHidden: true,

		    dialogCookieItemApprovedClass: 'approved',
		    dialogCookieItemRejectedClass: 'rejected',

		    dialogBuilder: {
			    // dialog container
			    id:      'dialog-container',
			    html:    '<div data-eucookielaw-id="{{id}}" id="eucookielaw-{{instanceId}}" class="modal fade eucookielaw-modal {{classes}}">{{content}}</div>',
			    classes: '',
			    content: {
				    // Dialog
				    id:      'dialog',
				    html:    '<div data-eucookielaw-id="{{id}}" class="modal-dialog modal-lg {{classes}}">{{content}}</div>',
				    classes: '',
				    content: {
					    // Dialog Content
					    id:      'dialog-content',
					    html:    '<div data-eucookielaw-id="{{id}}" class="modal-content {{classes}}">{{content}}</div>',
					    classes: '',
					    content: [
						    {
							    // Header Container
							    id:       'header-container',
							    html:     '<div data-eucookielaw-id="{{id}}" class="modal-header {{classes}}"><{{titleTag}} class="modal-title">{{content}}</{{titleTag}}></div>',
							    classes:  '',
							    titleTag: 'strong',
							    content:  'Cookie Policy agreement'
						    },
						    {
							    // Body container
							    id:      'body-container',
							    html:    '<div data-eucookielaw-id="{{id}}" class="modal-body">{{content}}</div>',
							    content: [
								    {
									    id:      'body-text-content',
									    html:    '<p data-eucookielaw-id="{{id}}" class="{{classes}}">{{content}}</p>',
									    classes: '',
									    content: 'This site uses cookies'
								    },
								    {
									    id:      'body-button-container',
									    html:    '<p data-eucookielaw-id="{{id}}" class="eucokielaw-dialog-button-container {{classes}}">{{content}}</p>',
									    classes: '',
									    content: {
										    id:                    'review-button',
										    // Expand Button
										    isCookieDetailsButton: true,
										    html:                  '<a data-eucookielaw-id="{{id}}" href="#" class="btn btn-default btn-block {{classes}}">{{content}}</a>',
										    classes:               '',
										    content:               'Review consents'
									    }
								    },
								    {
									    // Cookie Groups List
									    id:                     'cookie-group-list',
									    html:                   '<div data-eucookielaw-id="{{id}}" class="list-group {{classes}}">{{content}}</div>',
									    classes:                '',
									    isCookieGroupContainer: true,
									    content:                {
										    // Cookie Group List Item
										    id:   'cookie-group-list-item',
										    html: '<div data-eucookielaw-id="{{id}}" class="list-group-item {{status}}">' +
										          '<strong>{{content}}</strong><br />' +
										          '<span class="text-muted">{{description}}</span>' +
										          '</div>'
									    }
								    },
								    {
									    id:      'button-container',
									    html:    '<div data-eucookielaw-id="{{id}}" class="buttons text-right {{classes}}">{{content}}</div>',
									    classes: '',
									    content: [
										    {
											    id:            'close-button',
											    isCloseButton: true,
											    html:          '<a data-dismiss="modal" data-eucookielaw-id="{{id}}" href="#" class="btn btn-primary {{classes}}">{{content}}</a>',
											    classes:       '',
											    content:       'Close'
										    }
									    ]
								    }
							    ]
						    },
						    {
							    // Footer container
							    id:      'footer-container',
							    html:    '<div data-eucookielaw-id="{{id}}" class="modal-footer">{{content}}</div>',
							    content: {
								    html:    '<div class="eucookielaw-dialog-footer">{{content}}</div>',
								    content: '<small>Powered by <a href="https://diegolamonica.info/tools/eucookielaw/">EUCookieLaw <img src="data:image/png;base64,iVBO' +
								             'Rw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAA' +
								             'AELElEQVQ4jY3UT0ibdxzH8feTJ08e85fUJyYxsWal082trsWDMhOcrjCZ2DWH0ZYd' +
								             '2sNOxdMOhcIQBsXbYAhedll3XmG9CQUVVqSpTGjHaLLQBTpnTJ8GNf//Pf920WLdOv' +
								             'q9/eD3e/1+/L58P/Dm5QYC4+Pj0fn5ecfrNgn/J9jt9qFkMjk3MzPzcU9PT7/D4RA6' +
								             'nY4tlUrVKpXK6aWlpcobgaFQ6NTFixd/PH/+/MTIyAiKoiCKIuVyGZvNRi6XY3V1dX' +
								             '10dPTT2dnZ2iuPOH5Bf39/+Nq1a39OT0/bPB4Psizj9Xqx2+34fD6azSaFQgFFURL5' +
								             'fP5LYPEoIB4Do5cvX/55cnLypM/nIxgMsru7i2VZuFwubDYbkiQRiUSIxWKsrKzEx8' +
								             'bGHA8ePPjlELAdwWJnzpwZV1V1zOl00mw2qdfrzM3NIUkS1WqVra0tMpkMAOFwmGQy' +
								             '6U2n018vLi6GjoMy8LaiKN9GIhGcTiemaeL1erl9+zaWZfH8+XMePXrE0tIS9XodgI' +
								             'GBASYmJuzPnj3rPQ6GXC5X1OFw9IdCIURRxO/3k8lkKBaLqKqKaZoMDw9z48YNLMsC' +
								             'wOfzMTU1JdTr9c+O/qEAfBAKhd4JBAKfDA4OMjg4yPDwMLqu02q1kGWZ3d1dZFlGEA' +
								             'T8fj92ux1N04hEIrRaram+vr5vNE0zbQedDsmyHDUMA1mWabfbXLhwgY2NDfx+P5Ik' +
								             'sbGxwd27dzEMg3w+T7FY5OrVq3Q6HS5dusT169cZGhr6wn7wSpdpmn9ZlkWlUkEURW' +
								             '7evAlAtVpFFEXi8TixWIxyuYwkSezv71OpVLh37x7xeJx2u82LFy9cIiAB70uSVFYU' +
								             '5XOPx4MkSQQCAWRZZnt7m3a7TXd3N61Wi729PSRJwufzMTMzgyiKaJpGPp/n/v37yz' +
								             'bAANrFYrGuaRqFQgFVVSkUCjgcDgzD4M6dO+i6TqPRwDAMnE4nT548YX9//+UEbW5u' +
								             '4na7vxMBCwgD7yqKkul0Oh8eQpZl4XQ6SSQSZLNZqtUqgUCAEydOsLCwwLlz5yiXy+' +
								             'zt7bG8vPzr2trarUMQ4L1qtfowGAxeKZVKtp6eHkRRRNd1dnZ20HWdbDZLs9mkq6uL' +
								             'RCKBIAiUy2XW1tZIpVJJVVXzh6PXAMK6rg90d3f/IYri2M7OjuDxeABwu93Iskw+n2' +
								             'd0dJRcLsfTp0+p1Wqsr6+TSqXm0+n0T4B1NG36gWnAF41G1b6+vu/tdrurt7eXs2fP' +
								             'voQty6Krq4t0Ok02m6VUKi1sbm7eAtrw7/g6CXwE9MqyvDIyMvIVcMU0TcnhcBAMBh' +
								             'EEwVBV1Wi1Wg81Tfvh8ePHq8D2IfBfeagAk8BbQAf4PRAIWIIghEVRVCqVyt+NRqMG' +
								             'mMBvQOno4dcltgs4DZwCPAeNMwENqAE5YOtg/Ur9A4rvtmO4NgDnAAAAAElFTkSuQmCC" /></small>'
							    }
						    }
					    ]
				    }
			    }
		    }
	    },
	    AgreementStatus = {
		    OK: 'ok',
		    KO: 'ko'
	    },
	    KeyType         = {
		    STATUS: 'status',
		    DATE:   'date'
	    },
	    Node            =
		    {
			    ELEMENT_NODE:                1,
			    ATTRIBUTE_NODE:              2,
			    TEXT_NODE:                   3,
			    CDATA_SECTION_NODE:          4,
			    ENTITY_REFERENCE_NODE:       5,
			    ENTITY_NODE:                 6,
			    PROCESSING_INSTRUCTION_NODE: 7,
			    COMMENT_NODE:                8,
			    DOCUMENT_NODE:               9,
			    DOCUMENT_TYPE_NODE:          10,
			    DOCUMENT_FRAGMENT_NODE:      11,
			    NOTATION_NODE:               12
		    },
	    observer        = null;

	// Applying default settings where custom settings are not available
	if ( settings === undefined ) settings = {};
	for ( var setting in defaultSettings ) {
		if ( settings[ setting ] === undefined ) {
			settings[ setting ] = defaultSettings[ setting ];
		}
	}
	DEBUG = settings.debugEnabled || false;


	DEBUG && console.log( settings );

	if ( settings.applyMinimalStyle ) {
		/*
		 * Defining specific rules for reject and approve items
		 */
		var sheet = (function () {
			var style = element( "style" );
			append( style, text( '' ) );
			append( document.head, style );
			return style.sheet;
		})();

		sheet.insertRule( '#eucookielaw-' + instanceId + ' .' + settings.dialogCookieItemRejectedClass + ',#eucookielaw-' + instanceId + ' .' + settings.dialogCookieItemApprovedClass + '{	cursor: pointer; }', 0 );
		sheet.insertRule( '#eucookielaw-' + instanceId + ' .' + settings.dialogCookieItemRejectedClass + ':before { content: "×"; color: #a00; }', 0 );
		sheet.insertRule( '#eucookielaw-' + instanceId + ' .' + settings.dialogCookieItemApprovedClass + ':before { content: "✓"; color: #080; }', 0 );
	}
	var handledNodes = settings.handledNodes;
	var avoidedURLs = {};

	function getAcceptedKey ( type, groupName ) {
		return 'eucookielaw-accepted-' + groupName + '-' + type;
	}

	function getAcceptedStatusKey ( groupName ) {
		return getAcceptedKey( KeyType.STATUS, groupName );
	}

	function getAcceptedDateKey ( groupName ) {
		return getAcceptedKey( KeyType.DATE, groupName );
	}

	/*
	 * check if user has accepted for specific URLs group
	 * and period is not expired
	 */
	function getGroupStatus ( groupName ) {
		var acceptedDate   = localStorage.getItem( getAcceptedDateKey( groupName ) || false ),
		    acceptedStatus = localStorage.getItem( getAcceptedStatusKey( groupName ) || false ),
		    accepted       = false;

		if ( acceptedDate ) {

			/*
			 * Creating a Date Object and shifting in the future by expiring period (expressed in days)
			 */
			var expiringDate = new Date( acceptedDate ),
			    futureDate   = expiringDate.setDate( expiringDate.getDate() + settings.expiringPeriod );

			/*
			 * Checking if the date is expired
			 */
			if ( futureDate > (new Date()) ) {
				accepted = acceptedStatus;
			}

		}

		return accepted;
	}

	function isGroupTreated ( groupName ) {
		return isGroupAccepted( groupName ) || isGroupRejected( groupName );
	}

	function isGroupAccepted ( groupName ) {
		return getGroupStatus( groupName ) === AgreementStatus.OK;
	}

	function isGroupRejected ( groupName ) {
		return getGroupStatus( groupName ) === AgreementStatus.KO;
	}

	/*
	 * Mark the group of URLs accepted by the user
	 */
	function acceptGroup ( groupName ) {
		var currentDate = new Date();
		localStorage.setItem( getAcceptedStatusKey( groupName ), AgreementStatus.OK );
		localStorage.setItem( getAcceptedDateKey( groupName ), currentDate.toISOString() );
		if ( window[ 'userConsentCallback' ] && typeof(window.userConsentCallback) === 'function' ) {
			window.userConsentCallback( groupName, AgreementStatus.OK, currentDate.toISOString() );
		}
		all( '[data-eucookielaw-related-group="' + groupName + '"]' ).forEach( function ( item ) {
			/*
			 * To avoid some issues i store data as base64 value
			 */
			var rightValues = item.getAttribute( 'data-eucookielaw-rightvalue' ) || false;
			var text = atob( item.getAttribute( 'data-eucookielaw-inner-text' ) || '' ),
			    html = atob( item.getAttribute( 'data-eucookielaw-inner-html' ) || '' );

			if ( rightValues ) {

				var keyPairs = rightValues.split( ';' );

				keyPairs.forEach( function ( keyPair ) {
					if ( keyPair !== '' ) {
						var kp   = keyPair.split( ':' ),
						    key  = kp[ 0 ],
						    pair = atob( kp[ 1 ] );

						item.setAttribute( key, pair );
					}

				} );

				if ( item.nodeName.toLowerCase() === 'script' ) {
					// Special treatment for executing some scripts again (if needed)

					var type   = item.getAttribute( 'type' ),
					    async  = item.getAttribute( 'async' ),
					    defer  = item.getAttribute( 'defer' ),
					    src    = item.getAttribute( 'src' ),
					    cloned = element( 'script' );

					if ( type ) cloned.setAttribute( 'type', type );
					if ( async ) cloned.setAttribute( 'async', async );
					if ( defer ) cloned.setAttribute( 'defer', defer );
					if ( src ) cloned.setAttribute( 'src', src );

					before( cloned, item );
					item.remove();

					item = cloned;

				}
			}
			if ( DEBUG ) console.log( 'Approved group', groupName );
			if ( text !== '' ) {
				item.innerText = text;
				item.removeAttribute( 'data-eucookielaw-inner-text' );
			}
			if ( html !== '' ) {
				item.innerHTML = html;
				item.removeAttribute( 'data-eucookielaw-inner-html' );
			}
		} );
	}

	function revokeGroup ( groupId ) {
		var currentDate = new Date();
		localStorage.setItem( getAcceptedStatusKey( groupId ), AgreementStatus.KO );
		localStorage.setItem( getAcceptedDateKey( groupId ), currentDate.toISOString() );

		if ( window[ 'userConsentCallback' ] && typeof(window.userConsentCallback) === 'function' ) {

			window.userConsentCallback( groupId, AgreementStatus.KO, currentDate.toISOString() );
		}
		all( '[data-eucookielaw-related-group="' + groupId + '"]' ).forEach( function ( item ) {

			alterNode( item, groupId );
		} );
	}

	function mkRegExp ( string, prefix, suffix ) {
		prefix = prefix || '';
		suffix = suffix || '';
		var s = prefix + string.replace( /\\/g, '\\\\' )
		                       .replace( /\//g, '\\/' )
		                       .replace( /^\./, '##__HASANYPREFIX__##' )
		                       .replace( /\./g, '\\.' )
		                       .replace( /^##__HASANYPREFIX__##/, '.*' ) + suffix;
		return new RegExp( s );
	}

	function getGroupByURL ( URL ) {
		DEBUG && console.log( 'getGroupByURL', 'checking for', URL );
		for ( var groupName in avoidedURLs ) {
			if ( avoidedURLs.hasOwnProperty( groupName ) ) {
				DEBUG && console.log( 'analyzing', groupName, avoidedURLs[ groupName ] );
				for ( var avoidedURLIndex in avoidedURLs[ groupName ].URL ) {
					if ( avoidedURLs[ groupName ].URL.hasOwnProperty( avoidedURLIndex ) ) {
						var avoidedURL = avoidedURLs[ groupName ].URL[ avoidedURLIndex ],
						    rx         = mkRegExp( avoidedURL, '^' );

						DEBUG && console.log( 'getGroupByURL', 'testing for', avoidedURL, rx );
						if ( rx.test( URL ) ) {
							return groupName;
						}
					}
				}
			}
		}

		return false;
	}

	function getGroupByContent ( content ) {
		if ( content !== '' ) {
			for ( var groupName in avoidedURLs ) {
				if ( avoidedURLs.hasOwnProperty( groupName ) ) {
					for ( var avoidedURLIndex in avoidedURLs[ groupName ].URL ) {
						if ( avoidedURLs[ groupName ].URL.hasOwnProperty( avoidedURLIndex ) ) {
							var avoidedURL = avoidedURLs[ groupName ].URL[ avoidedURLIndex ];

							var rx = mkRegExp( avoidedURL );
							if ( rx.test( content ) ) {
								return groupName;
							}
						}
					}
				}
			}
		}
		return false;
	}

	var linearizedProperties = [];

	function linearizeDialogPropeties ( props ) {

		if ( props === undefined ) {
		} else if ( typeof (props) === 'string' ) { // Is the content a string ?
			return;
		} else if ( props.length === undefined ) { // Is it an object?

			if ( props.id !== undefined ) {
				linearizedProperties[ props.id ] = props;
			}
			for ( var key in props ) {
				if ( props.hasOwnProperty( key ) && htmlBuilderReservedWords.indexOf( key ) === -1 ) {
					linearizeDialogPropeties( props[ key ] );
				}
			}

		} else { // Otherwise is an array of objects
			for ( var i = 0; i < props.length; i++ ) {
				linearizeDialogPropeties( props[ i ] );
			}
		}

	}

	function closeModal ( fromButton ) {
		if ( typeof(jQuery) === 'undefined' || typeof(jQuery.fn.modal) === 'undefined' ) {
			document.querySelector( 'body' ).classList.remove( 'modal-open' );
			mainContainer.classList.remove( 'in' );
			// mainContainer.style.display = 'none';
		} else if ( !fromButton ) {

			$( currentDialog ).modal( 'hide' );

		}
	}

	function enableCookies () {
		if ( originalCookie !== undefined ) {
			delete document.cookie;
			originalCookie = undefined;
		}
	}

	var blockCookie = function () {
		set( document, 'cookie', function ( cookie ) {

			if ( DEBUG ) console.info( "Trying to write the cookie " + cookie );

			if ( !settings.cookieEnabled ) {

				if ( DEBUG ) console.log( "But document cookie is not enabled" );

				var cookiePart    = cookie.split( '=' ),
				    cookieAllowed = false;

				if ( /^__eucookielaw$/.test( cookiePart[ 0 ] ) ) {
					if ( DEBUG ) console.info( "Is the technical cookie" );
					cookieAllowed = true;
				} else {
					if ( DEBUG ) console.log( "Checking in cookie list" );
					for ( var cookieIndex = 0; cookieIndex < settings.cookieWhiteList.length; cookieIndex++ ) {
						/*
						 * * If starts with a `.` (dot char), it means that the cookie ends with the word that follows the dot
						 *   ( `.lorem` supposes as allowed cookies `lorem`, `mylorem` and `my_lorem` but disallow `loremipsum` ).
						 *
						 * * If ends with a `.` (dot char), it means that the cookies begins with the word that preceed the dot
						 *   ( `lorem.` supposes as allowed cookies `lorem`, `loremipsum` and `lorem_ipsum` but don't accept `my_lorem` ).
						 *
						 * * If both starts and ends with a `.` (dot char), all cookies that contains the world into the name (merging both the above rules)
						 *
						 * * If no dots is signed both on begin and at the end of the keyword, only the exact name is accepted.
						 */
						var cookieKey      = settings.cookieWhiteList[ cookieIndex ],
						    startsWildChar = cookieKey.substr( 0, 1 ) === '.',
						    endsWildChar   = cookieKey.substr( -1 ) === '.',
						    cookiePattern  = cookieKey.substring( startsWildChar ? 1 : 0, cookieKey.length - (endsWildChar ? -1 : 0) ),
						    regexString    = "^" +
							    (startsWildChar ? '.*' : '') +
							    cookiePattern.replace( /([(|\.{^$\[\]}*+])/g, '\\$1' ) +
							    (endsWildChar ? '.*' : '') +
							    "$",
						    regexCookie    = new RegExp( regexString );
						if ( DEBUG ) console.log( "Checking if the cookie '" + cookiePart[ 0 ] + "' matches the value defined in " + cookieKey + " (rule: " + regexString + ")" );
						if ( regexCookie.test( cookiePart[ 0 ] ) ) {
							cookieAllowed = true;
							break;
						}
					}
				}
				if ( cookieAllowed ) {
					if ( DEBUG ) console.log( "The cookie " + cookiePart[ 0 ] + ' is allowed' );
					settings.cookieEnabled = true;
					document.cookie = cookie;
					settings.cookieEnabled = false;
					if ( DEBUG ) console.info( document.cookie );
				} else {
					if ( DEBUG ) console.log( "The cookie " + cookiePart[ 0 ] + ' is not allowed' );

				}
				return false;
			} else {
				if ( DEBUG ) console.warn( "I'm resetting the original document cookie" );
				delete document.cookie;
				document.cookie = cookie;
			}
			return cookie;
		}, function () {
			return originalCookie;
		} );
	};

	this.allowCookie = function ( cookieName ) {
		settings.cookieWhiteList.push( cookieName );
	};

	this.setAgreeMode = function ( mode ) {
		settings.agreeMethod = mode;
	};

	this.registerGroup = function ( groupId, groupName, groupDescription, enabledByDefault ) {
		if ( avoidedURLs[ groupId ] === undefined ) {
			avoidedURLs[ groupId ] = {
				name:             groupName,
				description:      groupDescription,
				accepted:         isGroupAccepted( groupId ),
				enabledByDefault: enabledByDefault,
				URL:              []
			};
		}
	};

	/**
	 * Register an URL into a specific group
	 * @param groupId
	 * @param URL
	 */
	this.registerURL = function ( groupId, URL ) {
		if ( avoidedURLs[ groupId ] === undefined ) this.registerGroup( groupId, groupId, '' );
		if ( typeof(URL) === 'string' ) {
			avoidedURLs[ groupId ].URL.push( URL );
		} else {
			URL.forEach( function ( value ) {
				avoidedURLs[ groupId ].URL.push( value );
			} );
		}

	};

	this.handleNode = function ( nodeName, attributes, contentManagement ) {
		DEBUG && console.log( 'adding handler for', nodeName, contentManagement );
		/*
		 * Ensure the node is stores as uppecase to avoid duplicates and incorrect representations
		 */
		settings.handledNodes[ nodeName.toUpperCase() ] = {
			attr:            attributes,
			removeContent:   contentManagement.removeContent,
			lookupInnerText: contentManagement.lookupContent
		};
	};


	/**
	 * Updates a dialog property before rendering it
	 *
	 * @param id
	 * @param propertyName
	 * @param value
	 */

	this.updateDialogProperty = function ( id, propertyName, value ) {
		linearizedProperties[ id ][ propertyName ] = value;
	};


	function getAllHandledAttributes () {
		var theAttributes = [];
		for ( var nodeName in settings.handledNodes ) {
			var node       = settings.handledNodes[ nodeName ],
			    attributes = Object.keys( node.attr || {} );

			attributes.forEach( function ( item ) {
				theAttributes.push( item );
			} );
		}


		return theAttributes.unique();
	}

	function startObserver () {
		if(DEBUG) console.log( getAllHandledAttributes() );
		var config     = {
			    attributes:            true,
			    characterData:         true,
			    childList:             true,
			    subtree:               true,
			    attributeOldValue:     true,
			    characterDataOldValue: true,
			    attributeFilter:       getAllHandledAttributes()

		    },
		    targetNode = one( 'html' );
		// Create an observer instance linked to the callback function
		observer = new MutationObserver( mutationObserverCallback );

		// Start observing the target node for configured mutations
		observer.observe( targetNode, config );

	}

	function alterNode ( node, asGroupId ) {

		if ( [ Node.TEXT_NODE, Node.COMMENT_NODE ].indexOf( node.nodeType ) === -1 ) {
			/* node is not into excluded nodes */
			var nodeName    = node.nodeName.toUpperCase(),
			    handledNode = handledNodes[ nodeName ] || false;

			if ( handledNode ) {
				// node.parentNode.removeChild(node);return;

				var shouldRemoveContent = false;
				for ( var attr in handledNode.attr ) {

					if ( handledNode.attr.hasOwnProperty( attr ) ) {
						var replacement = handledNode.attr[ attr ],
						    url         = node.getAttribute( attr );
						DEBUG && console.log( attr, url );
						var groupName = asGroupId || getGroupByURL( url );
						if ( groupName ) {
							node.setAttribute( 'data-eucookielaw-related-group', groupName );
							if ( isGroupAccepted( groupName ) ) {
								/* Continue user expressly accepted group */
								// console.log( "URL is managed and user accepted it before", url, node );
							} else {
								/* Wait!!! User doesn't agreed */
								//console.log( "URL is managed and user did not accepted it before", url );
								if ( url != null ) {
									var rightValue = node.getAttribute( 'data-eucookielaw-rightvalue' ) || '';
									rightValue += attr + ':' + btoa( url ) + ';';
									node.setAttribute( 'data-eucookielaw-rightvalue', rightValue );

									node.setAttribute( attr, replacement );
									if ( attr.toUpperCase() === 'SRC' && ([ 'IFRAME', 'SCRIPT' ].indexOf( nodeName ) !== -1) ) {
										// Evenif the src has been changed the content is still loaded.
										// So we need to replace it with new html content.
										node.onreadystatechange = function ( event ) {
											if(DEBUG) console.log( 'this is loading', this, event );
											return false;
										};
										var theNode   = element( nodeName ),
										    theParent = node.parentNode;
										for ( var oldNodeAttrIndex = 0; oldNodeAttrIndex < node.attributes.length; oldNodeAttrIndex++ ) {
											var oldNodeAttr = node.attributes[ oldNodeAttrIndex ];
											theNode.setAttribute( oldNodeAttr.name, oldNodeAttr.value );
										}
										// console.log('dropping out', node);
										theParent.insertBefore( theNode, node );
										theParent.removeChild( node );
										node = null;
										node = theNode;

									}
									shouldRemoveContent = true;
									DEBUG && console.info( 'Should Remove Content for ', nodeName, node );
								}

							}
						} else {
							// console.log( "URL is not managed", url );
						}
					}
					var currentEUCookielawInnerHTML = node.getAttribute( 'data-eucookielaw-inner-html' ) || false;
					if ( handledNode.removeContent && !handledNode.lookupInnerText && currentEUCookielawInnerHTML === false && shouldRemoveContent ) {
						var html = node.innerHTML;

						DEBUG && console.group( 'updating inner-html attribute start', html );

						node.setAttribute( 'data-eucookielaw-inner-html', btoa( html ) );
						node.innerHTML = '';

						DEBUG && console.groupEnd();
					}
				}

				if ( handledNode.lookupInnerText ) {
					DEBUG && console.log( 'looking up into inner text for', nodeName );
					var text = node.innerText;

					groupName = asGroupId || getGroupByContent( text );
					if ( groupName ) {
						node.setAttribute( 'data-eucookielaw-related-group', groupName );
						if ( !isGroupAccepted( groupName ) ) {
							node.setAttribute( 'data-eucookielaw-inner-text', btoa( text ) );
							node.innerText = '';
						}
					}
				}

			}


		}


	}

	var insideObserver = false;

	/**
	 * callback function to execute when mutations are observed
	 */
	var mutationObserverCallback = function ( mutationsList ) {
		if ( !insideObserver ) {
			DEBUG && console.group( 'mutationObserverCallback' );
			DEBUG && console.log( 'starting' );
			insideObserver = true;

			mutationsList.forEach( function ( mutation ) {
				if ( mutation.type === 'childList' ) {

					for ( var addedNodeIndex = 0; addedNodeIndex < mutation.addedNodes.length; addedNodeIndex++ ) {
						var addedNode = mutation.addedNodes[ addedNodeIndex ];
						alterNode( addedNode );
					}
				}
				else if ( mutation.type === 'attributes' ) {
					if(DEBUG) console.log( 'The ' + mutation.attributeName + ' attribute was modified from ' + mutation.oldValue + ' into ', mutation.target[ mutation.attributeName ] );
				}
			} );

			insideObserver = false;
			DEBUG && console.groupEnd();
		}
	};

	var htmlBuilderReservedWords = [ 'html', 'isCookieGroupContainer', 'isAgreeButton', 'isCloseButton', 'isCookieDetailsButton' ];
	linearizeDialogPropeties( settings );

	var mkHTML = function ( content ) {


		var buffer = '';
		if ( content === undefined ) {
			buffer = '';
		} else if ( typeof (content) === 'string' ) { // Is the content a string ?
			buffer = content;
		} else if ( content.length === undefined ) { // Is it an object?

			buffer = content.html || '';
			buffer = buffer.replace( /{{instanceId}}/g, instanceId );

			for ( var key in content ) {
				if ( content.hasOwnProperty( key ) && htmlBuilderReservedWords.indexOf( key ) === -1 ) {

					buffer = buffer.replace( new RegExp( '\{\{' + key + '\}\}', 'g' ), mkHTML( content[ key ] ) );

				}
			}

		} else { // Otherwise is an array of objects
			for ( var i = 0; i < content.length; i++ ) {
				buffer += mkHTML( content[ i ] );
			}
		}

		return buffer;

	};


	function deferredConsent () {
		all( '[data-eucookielaw-id="cookie-group-list-item"]' ).forEach( function ( item ) {
			var groupId = item.getAttribute( 'data-group' );
			if ( item.classList.contains( settings.dialogCookieItemApprovedClass ) ) {
				if ( DEBUG ) console.log( groupId, 'has been accepted' );
				acceptGroup( groupId );
			} else {
				if ( DEBUG ) console.log( groupId, 'has been revoked' );
				revokeGroup( groupId );
			}
		} );
	}


	this.showAlert = function () {

		if ( currentDialog ) {
			if ( settings.openCallback && settings.openCallback( currentDialog ) ) {

			} else {
				currentDialog.setAttribute( 'open', 'open' );
			}
			return;
		}

		var cookieItemSection = linearizedProperties[ 'cookie-group-list-item' ];

		linearizedProperties[ 'cookie-group-list-item' ] = undefined;
		var groupListItems = [];

		for ( var groupId in avoidedURLs ) {
			// Cloning item
			var cookieItemSectionCloned = JSON.parse( JSON.stringify( cookieItemSection ) );
			cookieItemSectionCloned.status = isGroupAccepted( groupId ) || !isGroupTreated( groupId ) && avoidedURLs[ groupId ].enabledByDefault ?
			                                 settings.dialogCookieItemApprovedClass :
			                                 settings.dialogCookieItemRejectedClass;
			cookieItemSectionCloned.content = avoidedURLs[ groupId ].name;
			cookieItemSectionCloned.description = avoidedURLs[ groupId ].description;
			cookieItemSectionCloned.group = groupId;

			groupListItems.push( cookieItemSectionCloned );

		}
		this.updateDialogProperty( 'cookie-group-list', 'content', groupListItems );

		var dialog = mkHTML( settings.dialogBuilder );

		var eucookielawContainer = document.createDocumentFragment();
		var div = element( 'div' );
		div.innerHTML = dialog;
		append( eucookielawContainer, div );

		mainContainer = div.firstChild;

		if ( settings.openCallback && settings.openCallback( mainContainer ) ) {
		} else {
			mainContainer.setAttribute( 'open', 'open' );

		}

		one( 'body' ).appendChild( mainContainer );
		currentDialog = mainContainer;
		all( '[data-eucookielaw-id="cookie-group-list-item"]', mainContainer ).forEach( function ( item, index ) {
			(function ( item ) {
				item.setAttribute( 'data-group', groupListItems[ index ].group );
				item.addEventListener( 'click', function ( event ) {
					if ( DEBUG ) console.log( 'firing click event', this );
					event.preventDefault();
					event.stopImmediatePropagation();
					if ( settings.agreeMethod === EUCookieLaw.CHECK_MODE_IMMEDIATE || settings.agreeMethod === EUCookieLaw.CHECK_MODE_ON_SCROLL ) {
						if ( this.classList.contains( settings.dialogCookieItemRejectedClass ) ) {
							acceptGroup( this.getAttribute( 'data-group' ) );

						} else {
							revokeGroup( this.getAttribute( 'data-group' ) );
						}
					}
					this.classList.toggle( settings.dialogCookieItemApprovedClass );
					this.classList.toggle( settings.dialogCookieItemRejectedClass );
				} );
			})( item );
		} );

		var theGroupListClasses = one( '[data-eucookielaw-id="cookie-group-list"]', mainContainer ).classList;

		one( '[data-eucookielaw-id="review-button"]', mainContainer )
			.addEventListener( 'click', function ( event ) {
				event.preventDefault();
				event.stopImmediatePropagation();
				theGroupListClasses.toggle( settings.dialogCookieGroupsListHiddenClass );
				theGroupListClasses.toggle( 'expanded' );
				theGroupListClasses.toggle( 'collapsed' );
			} );

		one( '[data-eucookielaw-id="close-button"]', mainContainer )
			.addEventListener( 'click', function ( event ) {

				deferredConsent();
				closeModal( true );

			} );
		if ( settings.dialogCookieGroupsListDefaultIsHidden ) {
			[ settings.dialogCookieGroupsListHiddenClass, 'collapsed' ].forEach( function ( item ) {
				theGroupListClasses.add( item );
			} );
		} else {
			theGroupListClasses.add( 'expanded' );
		}

		if ( settings.agreeMethod === EUCookieLaw.CHECK_MODE_ON_SCROLL ) {
			window.addEventListener( 'scroll', consentOnScrollCB );
		}
	};

	this.run = function () {
		blockCookie();
		startObserver();
	};


	if ( settings.runLegacyMode ) {
		console.info( 'Running in Legacy Mode, please regenerate configuration through builder https://diegolamonica.info/tools/eucookielaw/builder/' );
		this.run();
	}

	var that = this;
	document.addEventListener( 'DOMContentLoaded', function () {

		var mustShowDialog = false;
		initialScroll = window.scrollY;
		for ( var groupName in avoidedURLs ) {

			if ( !isGroupAccepted( groupName ) && !isGroupRejected( groupName ) ) {
				mustShowDialog = true;
				break;
			}

		}

		if ( mustShowDialog ) {
			that.showAlert();
		} else {
			enableCookies();
		}

	} );


	document.addEventListener( 'click', function ( event ) {
		if(DEBUG) console.log( settings.agreeMethod, event );
		if ( settings.agreeMethod === EUCookieLaw.CHECK_MODE_ON_CLICK &&
			!document.querySelector( '.eucookielaw-modal' ).contains( event.target ) ) {

			deferredConsent();
			closeModal();
			settings.agreeMethod = EUCookieLaw.CHECK_MODE_IMMEDIATE;

		}

	} );

};

/*
 * EUCookieLaw global constants
 */
EUCookieLaw.CHECK_MODE_ON_SCROLL = 1;
EUCookieLaw.CHECK_MODE_IMMEDIATE = 2;
EUCookieLaw.CHECK_MODE_ON_CLICK = 4;
EUCookieLaw.CHECK_MODE_ON_CONSENT = 8;
