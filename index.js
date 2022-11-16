// Chargement des modules 
const express = require('express');
const app = express();
const http = require('http');
const server = app.listen(8080, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Ecoute sur les websockets
const { Server } = require("socket.io");
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
		

    });


	socket.on('get rooms',() =>{
		io.to(socket.id).emit('list rooms',rooms);

	});
    
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
            console.log(" --> broadcast");
            io.in(player.roomId).emit("message", { from: currentID, to: null, text: msg.text, date: Date.now() });
        }
    });
    
	socket.on("playerData",(player)=>{
		console.log(`playerData ${player.username}`);

		let room = null;
		if(player.roomId == null){
			room = createRoom(player);
			console.log(`create room - ${room.id} - ${player.username}`);
		}else{
			room = rooms.find(r => r.id === player.roomId);
			
			if(room === undefined){
				return;
				console.log("erreur cette room n'existe pas");
			}
			console.log(`connect room ( ${room.id} - ${player.username}`);

			room.players.push(player);
			room.placeActuelle++;
		}

		console.log(player);
		socket.join(room.id);
		io.in(room.id).emit("message", { from: null, to: null, text: currentID + " a rejoint la partie", date: Date.now() });
		socket.emit("player",player.roomId);
		
		socket.broadcast.emit('list rooms',rooms);
		socket.emit('list rooms',rooms);
	});
        
    /** 
     *  Gestion des déconnexions
     */


	socket.on("leave",(player)=>{
		if(currentID){
			
			io.in(player.roomId).emit("message", { from: null, to: null, text: currentID + " a quitté la partie", date: Date.now() } );
			supprimerRoom(player);
			
			room = rooms.find(r => r.id === player.roomId);

			io.in(player.roomId).emit("liste",room.players);
			socket.broadcast.emit('list rooms',rooms);
			socket.emit('list rooms',rooms);
		}
	});
    
    // fermeture
    socket.on("logout", (player)=> { 
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
			console.log(player);
			room = rooms.find(r => r.id === player.roomId);
            console.log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a quitté la partie", date: Date.now() } );
            // suppression de l'entrée
            supprimerRoom(player);
			supprimer(currentID);
            // désinscription du client
            currentID = null;
			//envoie de la nouvelle liste à jour
			
			io.in(room.id).emit("liste",room.players);
        }
    });
    
    // déconnexion de la socket
    socket.on("disconnect",(player)=> { 
        // si client était identifié
        if (currentID) {
			room = rooms.find(r => r.id === player.roomId);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message", { from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() } );
            // suppression de l'entrée
            supprimerRoom(player);
			supprimer(currentID);
            // désinscription du clienta
            currentID = null;
			//envoie de la nouvelle liste à jour
			if(room != undefined){

				io.in(room.id).emit("liste",room.players);
			}
		}
        console.log("Client déconnecté");
    });
    

	/**
	*  Supprime les infos associées à l'utilisateur passé en paramètre.
	*  @param  string  id  l'identifiant de l'utilisateur à effacer
	*/
	function supprimerRoom(player) {
		console.log(player);
		room = rooms.find(r => r.id === player.roomId);
		if(room === undefined){
			return;
		}
	    for( let i = 0; i < room.players.length; i++){ 
                                   
	        if ( room.players[i].username === player.username) { 
	            room.players.splice(i, 1); 
	            i--; 
	        }
	    }

		rooms.forEach(r => {
			r.players.forEach(p =>{
				if(p.host && p.socketId === socket.id){
					room = r;
					rooms = rooms.filter(r => r !== room);
				}
			})
		})
	}



});

function createRoom(player){
	const room = {id : rooms.length,players : [],placeActuelle : 0,placeMax :player.max};

	player.roomId = room.id;
	room.players.push(player);
	room.placeActuelle++;
	rooms.push(room);

	return room;
}
