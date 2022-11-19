// Chargement des modules 
const express = require('express');
const app = express();
const http = require('http');
const server = app.listen(8080, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});
const Room = require("./room.js")

// Ecoute sur les websockets
const { Server } = require("socket.io");
const { group } = require('console');
const io = new Server(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to 
app.get('/', function(req, res) {  
    res.sendFile(__dirname + '/public/lobby.html');
});


/***************************************************************
 *           Gestion des clients et des connexions
 ***************************************************************/

var clients = {};       // { id -> socket, ... }

/***************************************************************
 *              Gestion des rooms
 ***************************************************************/

let rooms = [];


/**
 *  Supprime les infos associées à l'utilisateur passé en paramètre.
 *  @param  string  id  l'identifiant de l'utilisateur à effacer
 */
function supprimer(id) {
    delete clients[id];
}

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    
    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;
    
    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
        // si le pseudo est déjà utilisé, on lui envoie l'erreur
        if (clients[id]) {
            socket.emit("erreur-connexion", "Le pseudo est déjà pris.");
            return;
        }
        // sinon on récupère son ID
        currentID = id;
        // initialisation
        clients[currentID] = socket;
        // log
        console.log("Nouvel utilisateur : " + currentID);

		socket.emit("bienvenue");
		// envoyer rooms
		socket.emit('list rooms',getRoomAvailable());
    });

	/*
	socket.on('get rooms',() =>{
		io.to(socket.id).emit('list rooms',rooms);
	});*/
    
    /** 
     *  Gestion des déconnexions
     */   

	 // fermeture
	 socket.on("logout", (player)=> { 
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
			console.log(player);
			let room = rooms.find(r => r.id === player.roomId);
            console.log("Sortie de l'utilisateur " + currentID);
            
			if(room !== undefined) { //aparrtient a une room
				supprimerPlayerRoom(player);
				console.log(currentID + " quitte la room " + player.roomId);

				checkRoom(player.roomId);
				
				// emission pour donner la liste des rooms aux clients (maj nombre players room)
				let roomAvailable = getRoomAvailable();
				socket.broadcast.emit('list rooms', roomAvailable);
				io.to(socket.id).emit('list rooms', roomAvailable);
			}
            
			// suppression de l'entrée
			supprimer(currentID);

            // désinscription du client
            currentID = null;
        }
    });


	// fermeture
	socket.on("disconnect", ()=> { 
		// si client était identifié (devrait toujours être le cas)
		if (currentID) {
			let player = {roomId: null, username: currentID}
		
			rooms.forEach(room => {
				room.getPlayers().forEach(player2 => {
					if(player2.username === currentID) {
						console.log("Sortie de l'utilisateur " + currentID);
						player.roomId =  room.id;
					}
				});
			});
			
			let room = rooms.find(r => r.id === player.roomId);
			
			if(room !== undefined) { //aprteint a room
				supprimerPlayerRoom(player);
				console.log(currentID + " quitte la room " + player.roomId);
				
				checkRoom(player.roomId);
				

				// emission pour donner la liste des rooms aux clients (maj nombre players room)
				let roomAvailable = getRoomAvailable()
				socket.broadcast.emit('list rooms', roomAvailable);
				io.to(socket.id).emit('list rooms', roomAvailable);
			}
			
			// suppression de l'entrée
			supprimer(currentID);

			// désinscription du client
			currentID = null;
		}

		console.log("Client déconnecté");
	});

	    
	/**************************************************
	 *
	 *						chat
	 *
	 * ***********************************************/

    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous  
     */
	 socket.on("message", function(msg,player) {
        console.log("Reçu message");   
        // si message privé, envoi seulement au destinataire
        if (msg.to != null) {
            if (clients[msg.to] !== undefined) {
                console.log(" --> message privé");
                clients[msg.to].emit("message", { from: currentID, to: msg.to, text: msg.text, date: Date.now() });
                if (currentID != msg.to) {
                    socket.emit("message", { from: currentID, to: msg.to, text: msg.text, date: Date.now() });
                }
            }
            else {
                socket.emit("message", { from: null, to: currentID, text: "Utilisateur " + msg.to + " inconnu", date: Date.now() });
            }
        }
        // sinon, envoi à tous les gens connectés
        else {
            console.log(" --> room :",player.roomId);
            io.in(player.roomId).emit("message", { from: currentID, to: null, text: msg.text, date: Date.now() });
        }
    });
 

	/**************************************************
	 *
	 *						ROOM
	 *
	 * ***********************************************/

	
	 socket.on("createRoom", (player, maxPlace) => {
		if(maxPlace > 5) {
			maxPlace = 5;
		}
		if(maxPlace < 2) {
			maxPlace = 2;
		}
		// création de la room
		let room = createRoom(player, maxPlace);
		
		// afficher coter serveur creation room
		console.log(`${currentID} create room ${room.id} - ${maxPlace} places`);

		// id de la room
		player.roomId = room.id;

		socket.join(room.id);
			
		socket.emit("roomId",player.roomId);
		
		// emission du message de bienvenue sur le chat
		io.in(room.id).emit("message", { from: null, to: null, text: currentID + " a rejoint la partie", date: Date.now() });
		// emission pour donner la liste des rooms aux clients (maj nombre players room)
		socket.broadcast.emit('list rooms',getRoomAvailable());
		// emission pour donner la liste des players de la room et le nom du host
		io.in(room.id).emit("liste",rooms[room.id].getPlayers(), rooms[room.id].host);
	});

	socket.on("joinRoom", (player, number) => {	
				
		let room = null;
		rooms.forEach(r => {
			if(r.id === number) {
                room = r;
			}
		});
        
		if(!room) {
            return;
		}

		player.roomId = room.id;

		console.log(`${player.username} connect room  ${player.roomId}`);

		socket.emit("roomId",room.id);

		room.addPlayer(player);

		socket.join(number);
		
		// emission du message de bienvenue sur le chat
		io.in(player.roomId).emit("message", { from: null, to: null, text: currentID + " a rejoint la partie", date: Date.now() });
		// emission pour donner la liste des rooms aux clients (maj nombre players room)
		socket.broadcast.emit('list rooms',getRoomAvailable());
		// emission pour donner la liste des players de la room
		io.in(room.id).emit("liste",room.getPlayers(), room.host);
	});

	socket.on("leave", (player)=>{
		if(currentID){
			
			//supprimer le player dans la room
			supprimerPlayerRoom(player);
			
			//remettre le roomId à 0
			socket.emit("roomId",null);
			
			console.log(currentID + " quitte la room " + player.roomId);
			
			checkRoom(player.roomId);
			
			socket.leave(player.roomId);
			
			// emission pour donner la liste des rooms aux clients (maj nombre players room)
			let roomAvailable = getRoomAvailable()
			socket.broadcast.emit('list rooms', roomAvailable);
			io.to(socket.id).emit('list rooms', roomAvailable);
		}
	});
 	
	/**
	 * check si la room et vide est emet les messages 
	 */
	 function checkRoom(playerRoomId) {
		let room;
		for (let i = 0; i < rooms.length; ++i) {
		    if(rooms[i].id === playerRoomId) {
                room = rooms[i];
			}
		}

		if(room.placePrise !== 0) {
			// emission du message de au revoir sur le chat
			io.in(room.id).emit("message", { from: null, to: null, text: currentID + " a quitté la partie", date: Date.now() } );
			// emission pour donner la liste des players de la room
			io.in(room.id).emit("liste",room.getPlayers(), room.host);
		}else {
			console.log("delete room -> " + room.id)
			rooms = rooms.filter(r => r.id !== room.id);
			//console.log(rooms)
		}
	}

	/**
	*  Supprime les infos associées à l'utilisateur passé en paramètre.
	*  @param  string  id  l'identifiant de l'utilisateur à effacer
	*/
	function supprimerPlayerRoom(player) {	
		let room;
		rooms.forEach(r => {
			if(r.id === player.roomId) {
				room = r;
			}
		});
		room.deletePlayer(player.username);
	}

	function createRoom(player, maxPlace){
		const room = new Room (rooms.length, maxPlace);
		
		room.addPlayer(player);
		room.setHost(player.username);
		rooms.push(room);
	
		return room;
	}

	function getRoomAvailable() {
		let z = rooms.filter(r => !r.isFull())
		return z.filter(r => !r.run)
	}

	
	/**************************************************
	 *
	 *						game
	 *
	 * ***********************************************/
	 socket.on("startManche", (username)=>{
	    console.log("recu start manche")
		rooms.forEach(r => {
			if(r.host === username) {
			    
                if(r.placePrise === 0) { //! remttre 1
				    io.in(r.id).emit("message", { from: null, to: null, text: "Impossible de lancer tour seul. <br> <i>PS : Trouve toi des amis :</i>", date: Date.now() });    
				}else {
					r.run = true;
				    r.lancerJeu();
				    io.in(r.id).emit("defausse", r.getDiscard2Cards(), r.getSizeDiscard());
				    io.in(r.id).emit("pioche", r.getPioche2Cards(), r.getSizePioche());
			        socket.broadcast.emit('list rooms', getRoomAvailable());
					io.in(r.id).emit('liste', r.getPlayers(), r.host);
					io.in(r.id).emit("startTurn1", r.getPlayers());
					io.in(r.id).emit("message", { from: null, to: null, text: "La partie commence !!!", date: Date.now() });
				}
			}
		});
	
	 });

	 socket.on("endTurnJoueur", (player, pioche, discard) => {
		console.log("recu endturnjoueur")
		
		let room = getRoom(player.roomId);
		
		if(room.turn1) {
			console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());

			let cardsChange = [player.phase.card1, player.phase.card2]
			room.majMain(player, cardsChange)

			console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());
            // verifier tout le monde retourner carte 
			if (room.verifierTurn1() === true) {
                room.turn1 = false; // tour 1 terminer
                
				room.hierarchisePlayers();
		        let nom = room.getPlayers()[0].username;
				io.in(room.id).emit("startTurn", room.getPlayers(), nom);
				
				io.in(room.id).emit("message", { from: null, to: null, text: "Fin du tour 1 !!! ", date: Date.now() });
				io.in(room.id).emit("message", { from: null, to: null, text: "C'est à " + nom + " de commencer", date: Date.now() });
			}else {
				io.in(room.id).emit("endTurnJoueur", room.getPlayers());
			}
		}else {
            
            let nom = room.swapJoueur();
            
            if(room.playerAllReturnMain !== null) {
                // dernier tour
                
				if(!room.lastTurnDeclanche) {
					room.lastTurnDeclanche = true;
					io.in(room.id).emit("message", { from: null, to: null, text: "C'est le dernier tour !!!", date: Date.now() });
				}
				
			}
			
			if(room.playerAllReturnMain === nom) {
				
				room.turnAlldecks();
				
				io.in(room.id).emit("deck", room.getPlayers());
                io.in(room.id).emit("liste",room.getPlayers(), room.host);
                
				let jeu = room.verifierEndGame()
				if(jeu.estTerminer) {
                    io.in(room.id).emit("message", { from: null, to: null, text: "Fin du jeu : " + jeu.playersWin.join(', ') + " a gagner ...", date: Date.now() });
				    io.in(room.id).emit("endGame", jeu.playersWin);
					room.run = false;
					socket.broadcast.emit('list rooms', getRoomAvailable());
				}else {
                    io.in(room.id).emit("message", { from: null, to: null, text: "La partie est finit...", date: Date.now() });
					io.in(room.id).emit("endParty");
				}
				
   
				//socket.broadcast.emit('list rooms', getRoomAvailable());
			}else {
                io.in(room.id).emit("startTurn", room.getPlayers(), nom);
		        io.in(room.id).emit("message", { from: null, to: null, text: "C'est au tour " + nom + " de jouer", date: Date.now() });
			}
			
		}


	});
    
	socket.on("pickedPioche", (player) => {
        console.log(player.username + " pioche dans la pioche")
        let room = getRoom(player.roomId);
		
		let sizePioche = room.getSizePioche();
		let sizeDiscard = room.getSizeDiscard();
				
		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());

		
		//debug foutu bug 
		if(sizePioche !== room.getSizePioche() || sizeDiscard !== room.getSizeDiscard()){
            console.log("111111111111111111111111111111111111111: ", sizePioche, ' ',sizeDiscard)
		}

		room.selectedCardPioche();
		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());
		io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
	});

	socket.on("pickedDefausse", (player) => {
        console.log(player.username + " pioche dans la defause")
		
		let room = getRoom(player.roomId);
        
		let sizePioche = room.getSizePioche();
		let sizeDiscard = room.getSizeDiscard();
		
		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());
		
		
		room.selectedCardDefausse();
		
		
		
		//debug foutu bug 
		if(sizePioche !== room.getSizePioche() || sizeDiscard !== room.getSizeDiscard()){
            console.log("2222222222222222222222222222222222: ", sizePioche, ' ', sizeDiscard)
		}

		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());
		io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
	});
	  
	socket.on("putDefausse", (player)=> {
		console.log("put defausse");
		let room = getRoom(player.roomId);
		
		let sizePioche = room.getSizePioche();
		let sizeDiscard = room.getSizeDiscard();
		let cd = room.getDiscard2Cards()[0];
		let cp = room.getPioche2Cards()[0];
		

		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());

		room.pickedPioche(); // pioche to discard

		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());
		
		//debug foutu bug 
		if(sizePioche !== room.getSizePioche()+1 || sizeDiscard !== room.getSizeDiscard()-1 || cp !== room.getDiscard2Cards()[0] ){
            console.log("33333333333333333333333333: ", sizePioche, ' ', room.getSizePioche() , ' ', sizeDiscard, ' ',room.getSizeDiscard() , 'carte au dessus pioche defauuse ', )
		}


		io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
		io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
	});

    socket.on("turnCard", (player)=> {
		console.log("turn card")
		
		let room = getRoom(player.roomId)

		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());

		room.turnCard(player);

		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());
        io.in(room.id).emit("deck", room.getPlayers());
	});

	socket.on("intervertir", (player, choice)=> { // choice pioche defausse
		console.log("intervertir card")
		let room = getRoom(player.roomId);

		let sizePioche = room.getSizePioche();
		let sizeDiscard = room.getSizeDiscard();
		let cd = room.getDiscard2Cards()[0];
		let cp = room.getPioche2Cards()[0];
	

		

		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());



		room.turnCard(player);
		//console.log("d2.5",room.getDiscard2Cards())
		//console.log("size discard",room.getSizeDiscard());
		room.intervertirCarte(player, choice);
		
		console.log("d",room.getDiscard2Cards());
		console.log("p",room.getPioche2Cards());

        if(choice ==="pioche") {
			if(sizePioche !== room.getSizePioche()+1) {
				console.log("4444444444444444444444444444: ", sizePioche, ' ', sizeDiscard,' carte au dessus pioche (ava/apres)', cp, room.getPioche2Cards()[0]);
			}
		}
		


		io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
		io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
		io.in(room.id).emit("deck", room.getPlayers());
	})

	function getRoom(id) {
		let room;
		
		rooms.forEach(r => {
			if(r.id === id) {
				room = r;
			}
		});

		return room;
	}
});