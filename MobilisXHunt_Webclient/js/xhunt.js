var xhunt = {
	NAME: 		localStorage.getItem('mobilis.xhunt.username'),
	SERVER: 	localStorage.getItem('mobilis.xhunt.server'),
	JID: 		localStorage.getItem('mobilis.xhunt.jid'),
	PASSWORD: 	localStorage.getItem('mobilis.xhunt.password'),
	gameinfo: {
		joined : false
	},
	position: {
	},
	target: {
	},
	tickets :{
		'4' : {
			'title' : 'Black',
			'url' :  'css/images/ti_black.png'
		},
		'1' : {
			'title' : 'Tram',
			'url' :  'css/images/ti_tram.png'
		},
		'2' : {
			'title' : 'Bus',
			'url' :  'css/images/ti_bus.png'
		},
		'3' : {
			'title' : 'Railway',
			'url' :  'css/images/ti_railway.png'
		}
	},
	icons : {
		blue : {
			url : 'css/images/ic_player_blue_36.png',
			color : '#04F',
			used : false,
			markericon : new google.maps.MarkerImage('css/images/ic_player_blue_36.png',
				new google.maps.Size(36, 36),
				new google.maps.Point(0, 0),
				new google.maps.Point(18, 26),
				new google.maps.Size(36, 36)),
		},
		green : {
			url : 'css/images/ic_player_green_36.png',
			color : '#2F0',
			used : false,
			markericon : new google.maps.MarkerImage('css/images/ic_player_green_36.png',
				new google.maps.Size(36, 36),
				new google.maps.Point(0, 0),
				new google.maps.Point(18, 26),
				new google.maps.Size(36, 36)),
		},
		orange : {
			url : 'css/images/ic_player_orange_36.png',
			color : '#F90',
			used : false,
			markericon : new google.maps.MarkerImage('css/images/ic_player_orange_36.png',
				new google.maps.Size(36, 36),
				new google.maps.Point(0, 0),
				new google.maps.Point(18, 26),
				new google.maps.Size(36, 36)),
		},
		red : {
			url : 'css/images/ic_player_red_36.png',
			color : '#F00',
			used : false,
			markericon : new google.maps.MarkerImage('css/images/ic_player_red_36.png',
				new google.maps.Size(36, 36),
				new google.maps.Point(0, 0),
				new google.maps.Point(18, 26),
				new google.maps.Size(36, 36)),
		},
		yellow : {
			url : 'css/images/ic_player_yellow_36.png',
			color : '#EF0',
			used : false,
			markericon : new google.maps.MarkerImage('css/images/ic_player_yellow_36.png',
				new google.maps.Size(36, 36),
				new google.maps.Point(0, 0),
				new google.maps.Point(18, 26),
				new google.maps.Size(36, 36)),
		},
		black : {
			url : 'css/images/ic_player_mrx_36.png',
			color : '#000',
			used : false,
			markericon : new google.maps.MarkerImage('css/images/ic_player_mrx_36.png',
				new google.maps.Size(36, 36),
				new google.maps.Point(0, 0),
				new google.maps.Point(18, 26),
				new google.maps.Size(36, 36)),
		}
	},
	hlst: new google.maps.MarkerImage('css/images/station_50px.gif',
		new google.maps.Size(18, 18),
		new google.maps.Point(0, 0),
		new google.maps.Point(9, 9),
		new google.maps.Size(18, 18)),
	colors: ['#800000', '#008000', '#0000A0'],
	stations: {},
	players: {},
















/* ============================================================================================================== 

 #    #  #    #  #    #  #    #  #####      #    #    ##    #    #  #####   #       ######  #####    ####  
  #  #   #    #  #    #  ##   #    #        #    #   #  #   ##   #  #    #  #       #       #    #  #      
   ##    ######  #    #  # #  #    #        ######  #    #  # #  #  #    #  #       #####   #    #   ####  
   ##    #    #  #    #  #  # #    #        #    #  ######  #  # #  #    #  #       #       #####        # 
  #  #   #    #  #    #  #   ##    #        #    #  #    #  #   ##  #    #  #       #       #   #   #    # 
 #    #  #    #   ####   #    #    #        #    #  #    #  #    #  #####   ######  ######  #    #   ####  

============================================================================================================== */









	onPlayersRequest: function (iq) { //  <PlayersRequest xmlns="mobilisxhunt:iq:players">
		console.log('iq: ', iq);
		Mobilis.xhunt.respondPlayer(
			$(iq).attr('from'), // gameJID
			$(iq).attr('id'), // iqid
			function (result){  // resultcallback
				console.log('respondPlayer result:', result);
			},
			function (error){ // errorcallback
				console.log('respondPlayer error:', error);
				console.log($(error).find('text').text());
			}
		);

		$('#player-list').empty();

		$(iq).find('PlayerInfo').each(function(){ 

			var jid = $(this).find('Jid').text();

			if (!xhunt.players[jid]) {
				xhunt.players[jid] = {
					'name'  : '',
					'lat'   : '',
					'lon'   : '',
					'tlat'  : '',
					'tlon'  : '',
					'ismrx' : '',
					'ismod' : '',
					'icon'  : '',
					'round' : '0'
				}
			};

			var player = xhunt.players[jid];

			player.name = $(this).find('PlayerName').text();
			player.color = $(this).find('IconColorID').text();
			player.ismod = Boolean($(this).find('IsModerator').text().match(/^true$/i));
			player.ismrx = Boolean($(this).find('IsMrX').text().match(/^true$/i));
			var isready = Boolean($(this).find('IsReady').text().match(/^true$/i));

			player.icon.used = false;
			var mrxHtml = '';
			if (player.ismrx) {
				player.icon = xhunt.icons.black;
				xhunt.icons.black.used = true;
				mrxHtml = '<span class="ui-li-count">X</span>';
			} else {
				console.log('player.color: ', player.color);
				switch (player.color) {
					case "0" : player.icon = xhunt.icons.blue; break;
					case "1" : player.icon = xhunt.icons.green; break;
					case "2" : player.icon = xhunt.icons.orange; break;
					case "3" : player.icon = xhunt.icons.red; break;
					case "4" : player.icon = xhunt.icons.yellow; break;
					default :
						console.log('oldschool color assignment');
						$.each(xhunt.icons, function(index, value){
							if (!value.used) {
								value.used = true;
								player.icon = value;
								return false;
							}
						});
						break;
				}

			}

			var modHtml = (player.ismod) ? '<span class="ui-li-count">M</span>' : '';
			var rdyHtml = (isready) ? '  &#10003;' : '';

			$('#player-list').append('<li><img src="' 
									+ player.icon.url 
									+ ' "/>' 
									+ player.name 
									+ rdyHtml 
									+ modHtml 
									+ mrxHtml 
									+ '</li>')
			.listview('refresh');
		});

		var info = $(iq).find('Info').text();
		console.log('PlayersRequest Info: ', info );

		return true;   
	},










	onStartRoundRequest : function (iq) { // <StartRoundRequest xmlns="mobilisxhunt:iq:startround">

		Mobilis.xhunt.respondStartRound(
			localStorage.getItem('mobilis.xhunt.gamejid'), // gameJID			
			iq.getAttribute('id'), // iqid
			function (result){  // resultcallback
				console.log('respondStartRound result:', result);
				console.log($(result).find('text').text());
			},
			function (error){ // errorcallback
				console.log('respondStartRound error:', error);
				console.log($(error).find('text').text());
			}
		);

		//$('#waitingforplayers-tooltip').popup('close');

		var round = $(iq).find('Round').text();
		var nextround = parseInt( round, 10 ) + 1 ;
		var showmrx = Boolean($(this).find('ShowMrX').text().match(/^true$/i));

		console.log('Round '+round+' started.');

		console.log('Choose new Target!');

		$.each(xhunt.players, function(index, player) { 
			console.log(player);
			if (parseInt( player.round , 10 )=== parseInt( round, 10 )){
				player.round = nextround;
				// $(iq).find('TicketAmount').each(function(){
				// 	var ticketid = $(this).find('ID').text();
				// 	var ticketamount =$(this).find('Amount').text();
				// 	//$('#' + index + '_' + ticketid).html('<img class="ticketicon" src="'+ xhunt.tickets[ticketid].url +'"/> ' + ticketamount);
				// })
				//return false;
			} 
		});
		return true;
	},










/*	on_startRoundIQ: function (iq) {
		var round = $(iq).find('gameround').text();
		var nextround = parseInt( round, 10 ) + 1 ;
		$('#roundinfo').html('<div id="roundinfo_content">Round : ' + 
			round + '   Show MrX: <span id="showmrx"></span></div>');
		var showmrx = $(iq).find('ShowMrX').text();
		if (showmrx === 'true')
			$('#showmrx').html('YES');
		else {
			$('#showmrx').html('NO');
		}
		$.each(xhunt.players, function(index, value) { 
			if (parseInt( value.round , 10 )=== parseInt( round, 10 )){
				value.round = nextround;
				$(iq).find('ticket').each(function(){
					var ticketid = $(this).find('ticketid').text();
					var ticketamount =$(this).find('ticketamount').text();
					$('#' + index + '_' + ticketid).html('<img class="ticketicon" src="'+ xhunt.tickets[ticketid].url +'"/> ' + ticketamount);
				})                    
				return false;
			} 
		});

		return true;   
	},
*/

	onLocationRequest : function(iq) { // <LocationRequest xmlns="mobilisxhunt:iq:location">
		Mobilis.xhunt.respondLocation(

			localStorage.getItem('mobilis.xhunt.gamejid'), // gameJID
			Mobilis.connection.jid, // playerJid
			iq.getAttribute('id'), // iqid
			Math.round(xhunt.position.latitude  * 1000000), // latitude
			Math.round(xhunt.position.longitude * 1000000), // longitude
			function (result){  // resultcallback
				console.log('respondLocation result:', result);
				console.log($(result).find('Text').text());
			},
			function (error){ // errorcallback
				console.log('respondLocation error:', error);
				console.log($(error).find('Text').text());
			}
		);

		$(iq).find('LocationInfo').each(function(){
			var jid = $(this).find('Jid').text(	);
			var lat = parseInt( $(this).find('Latitude').text(), 10 )/ 1000000;
			var lon = parseInt( $(this).find('Longitude').text(), 10 )/ 1000000;
			xhunt.players[jid].lat = lat;
			xhunt.players[jid].lon = lon;

			// console.log('xhunt.players[jid]', xhunt.players[jid]);

			$('#map').gmap3({
			  action:'clear',
			  name:'marker',
			  tag: jid, 
			});
			$('#map').gmap3({
				action: 'addMarker',
				latLng: [lat, lon],
				options: { 
					icon: xhunt.players[jid].icon.markericon,
				},
				tag: jid,
				events: {
					click: function(marker){

						// var plat = xhunt.position.latitude;
						// var plon = xhunt.position.longitude;
						// var nearest = 1;
						// // console.log(plat,plon);
						// $.each(xhunt.stations, function(index, value){
						// 	// console.log(value.lat, value.lon);
						// 	var slat = Number( value.lat, 10 );
						// 	var slon = Number( value.lon, 10 );
						// 	var dist = Math.sqrt(Math.pow(slat-plat, 2)+Math.pow(slon-plon, 2));
						// 	if (dist < nearest) {
						// 		nlat = slat;
						// 		nlon = slon;
						// 		nearest = dist;
						// 	}
						// 	// console.log(slat,plat,lat);
						// 	// console.log(slon,plon,nlon);
						// 	// console.log('dist:', dist);
						// });
						// console.log('nearest:',nlat,nlon);

						if ( jid.split('/')[0] == xhunt.JID ) {

							xhunt.position.latitude = xhunt.target.latitude;
							xhunt.position.longitude = xhunt.target.longitude;
							$('#map').gmap3({
								action: 'clear',
								tag: 'pointer'
							});
						} else {
							console.log('wrong player');
						}

					}
				}
			});
		});

		return true;
	},


	onGameOverRequest : function (iq) {
		console.log('GameOverRequest');
		Mobilis.xhunt.respondGameOver(
			$(iq).attr('from'), // gameJID
			$(iq).attr('id'), // iqid
			function (result){  // resultcallback
				console.log('respondGameOver result:', result);
				console.log($(result).find('text').text());
			},
			function (error){ // errorcallback
				console.log('respondGameOver error:', error);
				console.log($(error).find('text').text());
			}
		);
		$.each(xhunt.players, function(index, player) { 
			$('#map').gmap3({
				action:'clear',
				name:'marker',
				tag: player, 
			});
		});
		console.log('Game Over IQ:', iq);
		return true;
	},

/*	on_gameOverIQ: function (iq) {
		console.log('Game Over');
		//$.jGrowl('Game Over');
		console.log($(iq).find('reason').text(), {sticky: true });   
		//$.jGrowl($(iq).find('reason').text(), {sticky: true });   
		return true;  
	},
*/	
	onUpdateTicketsRequest : function (iq) {
		//todo
	},
/*	on_usedTicketsIQ: function (iq) {
		$(iq).find('player').each(function(){
			var jid = Strophe.getNodeFromJid($(this).find('playername').text());
			var ticket = $(this).find('ticketid').text();
			$('#' + jid + '_' + ticket).append('+');
		});
		//console.log('usedTickets');
		//console.log(iq);   
		return true;
	},
*/	

	onRoundStatusRequest : function (iq) {
		Mobilis.xhunt.respondRoundStatus(
			$(iq).attr('from'), // gameJID
			$(iq).attr('id'), // iqid
			function (result){  // resultcallback
				console.log('respondRoundStatus result:', result);
				console.log($(result).find('text').text());
			},
			function (error){ // errorcallback
				console.log('respondRoundStatus error:', error);
				console.log($(error).find('text').text());
			}
		);
		
		$(iq).find('RoundStatusInfo').each(function(){

			if ( $(this).find('PlayerJid').text().split('/')[0] == xhunt.JID ) {

				var target = xhunt.stations[parseInt($(this).find('TargetId').text(), 10 )];

				console.log('target:',target.name, 'round:',$(iq).find('Round').text());

				xhunt.target['latitude'] = Number( target.lat, 10);
				xhunt.target['longitude'] = Number( target.lon, 10);

				$('#map').gmap3({
					action: 'addPolyline',
					tag: 'pointer',
					options: {
						strokeColor: '#f00',
						strokeOpacity: 0.5,
						strokeWeight: 2
					},
					path: [
						[ xhunt.position.latitude, xhunt.position.longitude ],
						[ xhunt.target.latitude, xhunt.target.longitude ]
					]
				});
			}
		});
		return true;
	},
/*	on_roundStatusIQ: function (iq) {
		
		$(iq).find('player').each(function(){

			var jid = Strophe.getNodeFromJid($(this).find('jid').text());
			var stationID = $(this).find('stationid').text();
			var isfinal = $(this).find('isfinal').text();
			var arrived = $(this).find('arrived').text();
			if (xhunt.stations[stationID])
				var stationName = xhunt.stations[stationID].name;
			else
				var stationName = '-';
			if (arrived === 'true') {
				$('#' + jid + ' > .playertarget').html('Target Station: -');
				$('#map').gmap3({
				  action:'clear',
				  name:'polyline',
				  tag: jid, 
				});   
			} else {
				$('#' + jid + ' > .playertarget').html('Target Station: ' + stationName);
				if (xhunt.stations[stationID]){
					//.log('setTargetPolyline');
					xhunt.players[jid].tlat = xhunt.stations[stationID].lat;
					xhunt.players[jid].tlon = xhunt.stations[stationID].lon;
				}
				$('#map').gmap3(
				   {
					   action: 'addPolyline',
					   options: {
						   strokeColor: xhunt.players[jid].icon.color,
						   strokeOpacity: 1.0,
						   strokeWeight: 8
					   },
					   path: [[xhunt.players[jid].lat , xhunt.players[jid].lon], [xhunt.players[jid].tlat, xhunt.players[jid].tlon]],
					   tag: jid
				   }
				);
			}  


  
		});
		return true;   
	}, 
*/

/*	on_invitation: function (iq) {
		var gameJid = $(iq).find('param').first().text();
		var gameName = $(iq).find('param').next().text();
		xhunt.gameinfo['gameJID'] = gameJid;
		xhunt.gameinfo['name'] = gameName;
		xhunt.joinGame( { jid: $(this).attr('id') } );
		$('#login_dialog').dialog('close');
		return true;   
	},
*/













/* ============================================================================================================== 

 #    #  #    #  #    #  #    #  #####      #    #  ######  #####  #    #   ####   #####    ####  
  #  #   #    #  #    #  ##   #    #        ##  ##  #         #    #    #  #    #  #    #  #      
   ##    ######  #    #  # #  #    #        # ## #  #####     #    ######  #    #  #    #   ####  
   ##    #    #  #    #  #  # #    #        #    #  #         #    #    #  #    #  #    #       # 
  #  #   #    #  #    #  #   ##    #        #    #  #         #    #    #  #    #  #    #  #    # 
 #    #  #    #   ####   #    #    #        #    #  ######    #    #    #   ####   #####    ####  

============================================================================================================== */








	addHandlers : function () {
		Mobilis.xhunt.addGameOverHandler(xhunt.onGameOverRequest);
		Mobilis.xhunt.addLocationHandler(xhunt.onLocationRequest);
		Mobilis.xhunt.addPlayersHandler(xhunt.onPlayersRequest);
		Mobilis.xhunt.addRoundStatusHandler(xhunt.onRoundStatusRequest);
		Mobilis.xhunt.addStartRoundHandler(xhunt.onStartRoundRequest);
	},

	connectServer : function() {
		// if (Mobilis.core.Status.CONNECTED){
		// 	Mobilis.core.disconnect('reconnect');
		// };
		console.log('connect: ', xhunt.SERVER, xhunt.JID, xhunt.PASSWORD);
		Mobilis.core.connect(
			xhunt.SERVER,
			xhunt.JID,
			xhunt.PASSWORD,
			function(status) {
				
				if (status == Mobilis.core.Status.CONNECTED) {

					xhunt.queryGames();

				} 
			}
		);
	},

	queryGames : function() {
		console.log('querying games...');
		Mobilis.core.mobilisServiceDiscovery(
			[Mobilis.core.NS.XHUNT],
			function (iq) {
				$('#game-list').empty().listview();
				console.log('listing games...');
				if ($(iq).find('mobilisService').length){
					$(iq).find('mobilisService').each( function() {
						Mobilis.core.SERVICES[$(this).attr('namespace')] = {
							'version': $(this).attr('version'),
							'jid': $(this).attr('jid'),
							'servicename' : $(this).attr('serviceName')
						};
						$('#game-list').append('<li><a class="available-game" id="'
												 + $(this).attr('jid') 
												 + '" href="lobby.html" data-transition="slide">' 
												 + $(this).attr('serviceName') 
												 + '</a></li>');
					});
				} else {
					$('#game-list').append('<li>No games found</li>');
				}
				$('#game-list').listview('refresh');
			}
		);
	},

	sendMessage : function (message) {
		console.log('sending message...');

		if (xhunt.gameinfo['room']) {
			Mobilis.connection.muc.message(
				xhunt.gameinfo['room'],
				xhunt.gameinfo['nick'], 
				message, 
				'groupchat');
		}
		return true;
	},

	updatePlayer : function (updates) {
		console.log('updating player...');

		Mobilis.xhunt.updatePlayer(
			localStorage.getItem('mobilis.xhunt.gamejid'), //gameJID
			Mobilis.connection.jid, //playerJid
			xhunt.NAME, //playerName
			updates.ismod, //isModerator
			updates.ismrx, //isMrX
			updates.ready, //isReady
			function (result){  // resultcallback
				console.log('updatePlayer Info:', result);
				console.log($(result).find('text').text());
			},
			function (error){ // errorcallback
				console.log('updatePlayer Error:', error);
				console.log($(error).find('text').text());
			}
		);
		return true;
	},

	joinGame : function (data) {
		console.log('joining game...');

		Mobilis.xhunt.joinGame(
			data.jid, //gameJID
			xhunt.NAME, //playerName
			function (result){  // resultcallback: <JoinGameResponse xmlns="mobilisxhunt:iq:joingame">

				var room = $(result).find('ChatRoom').text();
				var pwd = $(result).find('ChatPassword').text();
				//console.log('xhunt.gameinfo.name:');console.log(xhunt.gameinfo.name);
				//$('title').append(xhunt.gameinfo.name + ' Lobby | Mobilis XHunt');
				//$('#header').append(xhunt.gameinfo.name + ' Lobby');

				xhunt.gameinfo['room'] = room.toLowerCase();
				xhunt.gameinfo['pwd'] = pwd;
				xhunt.gameinfo['nick'] = xhunt.NAME;

				if (xhunt.gameinfo['joined'] == false){
					Mobilis.connection.muc.join(
						xhunt.gameinfo['room'], // room
						xhunt.gameinfo['nick'], // nick
						function(message) {     // msg_handler_cb: <message .../>
							if ( from = Strophe.getResourceFromJid($(message).attr('from')) ){
								console.log(from + ' says: ' + $(message).find('body').text() );
							}
							return true;
						}, 						
						function (presence){       // pres_handler_cb: <presence ... />

							if ( from = Strophe.getResourceFromJid($(presence).attr('from')) ){
								console.log('presence: ' + from);
							}
							return true;
						},
						xhunt.gameinfo['pwd']  // password
					);
					xhunt.gameinfo['joined'] = true;
				}
			},
			function (error){ // errorcallback
				console.log('joinGame error:', error);
				console.log($(error).find('text').text());
			}
		);
	},

	exitGame : function () {
		console.log('exiting game...');

		if (Mobilis.connection.connected) {
			if (Mobilis.xhunt.gameJID){
				Mobilis.xhunt.playerExit(
					localStorage.getItem('mobilis.xhunt.gamejid'), //gameJID
					Mobilis.connection.jid, //playerJid
					function (result){  // resultcallback
						console.log('playerExit result:', result);
						console.log($(result).find('text').text());
					}, 
					function (error){ // errorcallback
						console.log('playerExit error:', error);
						console.log($(error).find('text').text());
					}
				);

				xhunt.queryGames();
				// $('#players').html('');  
				// $('#roundinfo').html('');
				// $('#chatdisplay').html(''); 
				// $('#gameinformation').html('Game Information');
				// $('#map_canvas').gmap3({
				// 	action:'clear',
				// 	name:'polyline'
				// });  
				// $('#map_canvas').gmap3({
				// 	action:'clear',
				// 	name:'marker'
				// });

			}
		}
	},

	requestTarget : function(data) {
		//todo
	},

	initMap : function(data) {
		// if (navigator.geolocation) {
		// 	console.log('yes we have a geolocation');
		navigator.geolocation.getCurrentPosition( function (position) {

			var current_latitude = xhunt.position.latitude; console.log(current_latitude);
			var current_longitude = xhunt.position.longitude; console.log(current_longitude);

			$('#map').gmap3({
				action: 'init',
					options:{
						center: [current_latitude, current_longitude],
						zoom: 15,
						mapTypeId: google.maps.MapTypeId.MAP,
						mapTypeControl: false,
						navigationControl: true,
						scrollwheel: true,
						streetViewControl: false
					}
				}
			).height($(document).height()-42); // 42 = Header Height

			$.ajax({
				type: "GET",
				url: data.xml,
				dataType: "xml",
				success: function(xml) {
					$(xml).find('Station').each(function() {
						xhunt.stations[$(this).attr('id')] = {
							'abbrev': $(this).attr('abbrev'),
							'name': $(this).attr('name'),
							'lat': $(this).attr('latitude'),
							'lon' : $(this).attr('longitude')
						};
						$('#map').gmap3({
							action: 'addMarker',
							latLng: [$(this).attr('latitude'), $(this).attr('longitude')],
							marker: {
								options: {
									icon: xhunt.hlst,
									title: $(this).attr('name'),
									id: $(this).attr('id')
								},
								events: {
									click: function(marker){
										console.log(marker.id, marker.title);
									}
								}

							}

						},'autofit');
					});

					$(xml).find('Route').each(function() {
						var stops = [];
						var i = 0;
						var colornummer = $(this).attr('type');
						$(this).find('stop').each(function() {
							$(xml).find("Station[id='" + $(this).text() + "']").each(function() {
								var latitude = $(this).attr('latitude');
								var longitude = $(this).attr('longitude');
								stops[i] = [];
								stops[i][0] = latitude;
								stops[i][1] = longitude;
								i++;
							});

							// key-value hashmap mit jeder haltestelle die in der route davor und oder danach ist
							// key ist n int, value ist liste von ints der jeweiligen stationen
							
						});
						$('#map').gmap3({
							action: 'addPolyline',
							options: {
								strokeColor: xhunt.colors[colornummer],
								strokeOpacity: 1.0,
								strokeWeight: 2
							},
							path: stops
						});
					});
				}
			});

			// $('#waitingforplayers-tooltip').popup('open', {
			// 	positionTo: 'window',
			// 	theme: 'a'
			// });

		},
		function (msg) {
			console.log(typeof msg == 'string' ? 'GeoLocation Error: ' + msg : 'unknown GeoLocation Error');
		});
		// } else {
		// 	console.log('HTML5 GeoLocation not supported');
		// }
	},

	watchPosition: function () {
		navigator.geolocation.watchPosition(function(position) {
			console.log('current latitude:',xhunt.position['latitude'] = position.coords.latitude);
			console.log('current longitude:',xhunt.position['longitude'] = position.coords.longitude);
		});
	},
	randomizePosition: function () {
		console.log('randomized latitude:',xhunt.position['latitude'] = (510+Math.random())/10);
		console.log('randomized longitude:',xhunt.position['longitude'] = (137+Math.random())/10);
	}
};















/* ============================================================================================================== 

      #   ####   #    #  ######  #####   #   #      #    #    ##    #    #  #####   #       ######  #####    ####  
      #  #    #  #    #  #       #    #   # #       #    #   #  #   ##   #  #    #  #       #       #    #  #      
      #  #    #  #    #  #####   #    #    #        ######  #    #  # #  #  #    #  #       #####   #    #   ####  
      #  #  # #  #    #  #       #####     #        #    #  ######  #  # #  #    #  #       #       #####        # 
 #    #  #   #   #    #  #       #   #     #        #    #  #    #  #   ##  #    #  #       #       #   #   #    # 
  ####    ### #   ####   ######  #    #    #        #    #  #    #  #    #  #####   ######  ######  #    #   ####  

============================================================================================================== */








$(document).on('pageinit', '#games-page', function() {

	if ( (navigator.geolocation) && (localStorage.getItem('mobilis.xhunt.staticmode') == 'off') ) {

		xhunt.watchPosition();
		xhunt.connectServer();

	} else {
		console.log('Deploying Static Mode…');
		xhunt.randomizePosition();
		xhunt.connectServer();
	}

});


$(document).on('click', '.available-game', function () {

	localStorage.setItem('mobilis.xhunt.gamejid', $(this).attr('id'));

	xhunt.gameinfo['gameJID'] = $(this).attr('id');
	xhunt.gameinfo['name'] = $(this).text();


	xhunt.addHandlers();
	xhunt.joinGame( { jid: $(this).attr('id') } );
	
});


// $(document).on('click', '#send-message-button', function () {
// 	xhunt.sendChat('Chat!');
// });


$(document).on('click', '#getready-button', function() {
	xhunt.updatePlayer( {
		'ready': true
	});
});


$(document).on('click', '#exitgame-button', function() {
	xhunt.exitGame();
});

$(document).on('click', '#refresh-button', function() {
	xhunt.queryGames();
});


$(document).on('click', '#ingamemenu-button', function() {
	$('#ingamemenu-container').popup('open', {
		positionTo: 'window',
		theme: 'b',
		corners: true
	});
});
$(document).on('click', '#message-button', function() {
	$('#message-container').popup('open', {
		positionTo: 'window',
		theme: 'b',
		corners: true
	});
});

$(document).on('click', '#message-form #submit', function() {
	var message = $('#message-form #message').val();
	if (message) {
		console.debug(message);
		xhunt.sendMessage(message);
	}
	$('#message-container').popup('close');
	return false;
});



$(document).on('pageinit', '#game-page', function() {
	// $('title').append(xhunt.gameinfo.name + ' | Mobilis XHunt');
	// $('#header').append(xhunt.gameinfo.name);

	xhunt.initMap( { xml: 'data/sites.xml' } );
});


$(document).on('pageinit', '#settings-page', function() {
	$('#settings-form #username').val(localStorage.getItem('mobilis.xhunt.username'));
	$('#settings-form #server').val(localStorage.getItem('mobilis.xhunt.server'));
	$('#settings-form #jid').val(localStorage.getItem('mobilis.xhunt.jid'));
	$('#settings-form #password').val(localStorage.getItem('mobilis.xhunt.password'));
	if (localStorage.getItem('mobilis.xhunt.staticmode') == 'on') {
		var staticmode = $('#settings-form #staticmode');
		staticmode[0].selectedIndex = 1;
		staticmode.slider('refresh');
	}
});


$(document).on('click', '#settings-form #submit', function() {
	localStorage.setItem('mobilis.xhunt.username', $('#settings-form #username').val());
	localStorage.setItem('mobilis.xhunt.server', $('#settings-form #server').val());
	localStorage.setItem('mobilis.xhunt.jid', $('#settings-form #jid').val());
	localStorage.setItem('mobilis.xhunt.password', $('#settings-form #password').val());
	localStorage.setItem('mobilis.xhunt.staticmode', $('#settings-form #staticmode').val());
	console.log(localStorage.getItem('mobilis.xhunt.username'));
	console.log(localStorage.getItem('mobilis.xhunt.server'));
	console.log(localStorage.getItem('mobilis.xhunt.jid'));
	console.log(localStorage.getItem('mobilis.xhunt.password'));
	console.log(localStorage.getItem('mobilis.xhunt.staticmode'));
	$('#settings-form #username').val(localStorage.getItem('mobilis.xhunt.username'));
	$('#settings-form #server').val(localStorage.getItem('mobilis.xhunt.server'));
	$('#settings-form #jid').val(localStorage.getItem('mobilis.xhunt.jid'));
	$('#settings-form #password').val(localStorage.getItem('mobilis.xhunt.password'));
	if (localStorage.getItem('mobilis.xhunt.staticmode') == 'on') {
		var staticmode = $('#settings-form #staticmode');
		staticmode[0].selectedIndex = 1;
		staticmode.slider('refresh');
	}

	return true;
});



// $(window).on('orientationchange resize pageshow', function() {

// 	/* http://www.semicomplete.com/blog/geekery/jquery-mobile-full-height-content
// 	 * Some orientation changes leave the scroll position at something
// 	 * that isn't 0,0. This is annoying for user experience. */
// 	scroll(0, 0);

// 	/* Calculate the geometry that our content area should take */
// 	var header = $("#header:visible");
// 	//var footer = $("#footer:visible");
// 	var content = $("#content:visible");
// 	var viewport_height = $(window).height();
// 	var content_height = viewport_height - header.outerHeight();// - footer.outerHeight();

// 	/* Trim margin/border/padding height */
// 	content_height -= (content.outerHeight() - content.height());
// 	content.height(content_height);
// });
