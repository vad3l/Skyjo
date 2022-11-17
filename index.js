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
		socket.emit('list rooms',rooms);
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
            
			if(room !== null) { //aprteint a une room
				supprimerPlayerRoom(player);
				console.log(currentID + " quitte la room " + player.roomId);

				checkRoom(rooms[player.roomId]);
				
				// emission pour donner la liste des rooms aux clients (maj nombre players room)
				socket.broadcast.emit('list rooms',rooms);
				io.to(socket.id).emit('list rooms',rooms);
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
				room.players.forEach(player2 => {
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
				
				checkRoom(rooms[player.roomId])
				
				
				// emission pour donner la liste des rooms aux clients (maj nombre players room)
				socket.broadcast.emit('list rooms',rooms);
				io.to(socket.id).emit('list rooms',rooms);
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
		
		// création de la room
		let room = createRoom(player, maxPlace);
		
		// id de la room
		player.roomId = room.id;

		// afficher coter serveur creation room
		console.log(`${currentID} create room ${player.roomId} - ${maxPlace} places`);

		socket.join(room.id);
			
		socket.emit("roomId",player.roomId);
		
		// emission du message de bienvenue sur le chat
		io.in(room.id).emit("message", { from: null, to: null, text: currentID + " a rejoint la partie", date: Date.now() });
		// emission pour donner la liste des rooms aux clients (maj nombre players room)
		socket.broadcast.emit('list rooms',rooms);
		// emission pour donner la liste des players de la room et le nom du host
		io.in(room.id).emit("liste",rooms[room.id].getPlayers(), rooms[room.id].host);
	});

	socket.on("joinRoom", (player, number) => {
		if(number < 0 || number >= rooms.length) {
			return;
		}
				
		player.roomId = number;
		socket.emit("roomId",player.roomId);

		console.log(`${player.username} connect room  ${player.roomId}`);
		rooms[number].addPlayer(player);
		
		socket.join(number);
		

		// emission du message de bienvenue sur le chat
		io.in(player.roomId).emit("message", { from: null, to: null, text: currentID + " a rejoint la partie", date: Date.now() });
		// emission pour donner la liste des rooms aux clients (maj nombre players room)
		socket.broadcast.emit('list rooms',rooms);
		// emission pour donner la liste des players de la room
		io.in(player.roomId).emit("liste",rooms[player.roomId].getPlayers(), rooms[number].host);
	});

	socket.on("leave", (player)=>{
		if(currentID){
			
			//supprimer le player dans la room
			supprimerPlayerRoom(player);
			
			//remettre le roomId à 0
			socket.emit("roomId",null);
			
			console.log(currentID + " quitte la room " + player.roomId);
			checkRoom(rooms[player.roomId]);
			
			socket.leave(player.roomId);
			
			// emission pour donner la liste des rooms aux clients (maj nombre players room)
			socket.broadcast.emit('list rooms',rooms);
			io.to(socket.id).emit('list rooms',rooms);
		}
	});
 	
	/**
	 * check si la room et vide est emet les messages 
	 */
	 function checkRoom(room) {
		if(room.placePrise !== 0) {
			// emission du message de au revoir sur le chat
			io.in(room.id).emit("message", { from: null, to: null, text: currentID + " a quitté la partie", date: Date.now() } );
			// emission pour donner la liste des players de la room
			io.in(room.id).emit("liste",rooms[room.id].players, rooms[room.id].host);
		}else {
			console.log("delete room -> " + room.id)
			rooms = rooms.filter(r => r.id !== room.id);
		}
	}
	/**
	*  Supprime les infos associées à l'utilisateur passé en paramètre.
	*  @param  string  id  l'identifiant de l'utilisateur à effacer
	*/
	function supprimerPlayerRoom(player) {	
		rooms[player.roomId].deletePlayer(player);
	}

	function createRoom(player, maxPlace){
		const room = new Room (rooms.length, maxPlace);
		
		room.addPlayer(player);
		room.setHost(player);
		rooms.push(room);
	
		return room;
	}
});