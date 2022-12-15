// Chargement des modules 
const express = require('express');
const app = express();
const http = require('http');
const server = app.listen(8080, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});

const Room = require("./serveur/room.js")
var promisse = null;

// Ecoute sur les websockets
const { Server } = require("socket.io");
const { group } = require('console');
const { recommendCommands } = require('yargs');
const { resolve } = require('path');
const io = new Server(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to 
app.get('/', function(req, res) {  
    res.sendFile(__dirname + '/public/skyjo.html');
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

	
    /** 
     *  Gestion des déconnexions
     */  
	
	/**
     *  Socket d'écoute lorsque un player qui l'application
     *  @param  player  Object le player qui quitte l'application
     */
	 socket.on("logout", (player)=> { 
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
			
			// gerer le player qui quitte l'application
			gestionTourPlayerQuitt(player);

			// suppression de l'entrée
			supprimer(currentID);

            // désinscription du client
            currentID = null;
        }
    });


	/**
     *  Socket d'écoute lorsque un player quitte la page web
     * 
     */
	socket.on("disconnect", ()=> { 
		// si client était identifié (devrait toujours être le cas)
		if (currentID) {
			
			let player = {roomId: null, username: currentID}
			
			//chercher le player qui quitte la page web
			rooms.forEach(room => {
				room.getPlayers().forEach(player2 => {
					if(player2.username === currentID) {
						console.log("Sortie de l'utilisateur " + currentID);
						player.roomId =  room.id;
					}
				});
			});
			
			// gerer le player qui quitte la page web
			gestionTourPlayerQuitt(player);

			// suppression de l'entrée
			supprimer(currentID);

			// désinscription du client
			currentID = null;
		}

		console.log("Client déconnecté");
	});

	/**
     *  Gère lorsque un player qui l'application, page web, room
	 * 	- gère la deconnexion d'un player éventuellement d'un room
	 *  - le remplacer par un bot si la partie est commencer
	 * 	- le faire jouer si c'est son tour
     *  @param  player  le player qui quitte la page web
     */
	function gestionTourPlayerQuitt(player) {
		// trouver la room où est le joueur
		let room = rooms.find(r => r.id === player.roomId);
		
		// si le player appartient à une room
		if(room !== undefined) { 
			
			// supprimer player de la room
			let deletePlayer = supprimerPlayerRoom(player);
			
			console.log(currentID + " quitte la room " + player.roomId);
			
			// supprimer la room si que des robots ou plus de joueurs
			let deleteRoom = checkRoom(player.roomId);
			
			socket.emit("roomId",null);

			socket.leave(player.roomId);

			// si la room à pas supprimer
			if(!deleteRoom) {
				// si c'est pas le tour 1
				if(!room.turn1) {
					// si on à supprimer le player 
					if(deletePlayer) {
						
						io.in(room.id).emit("message", { from: null, to: null, text: currentID + " a été remplacé par un bot", date: Date.now() } );

						// si c'est le tour d'un robot de jouer on les fait joeur jusqu'a que ca soit le tour d'un vrai joueur
						if(room.turnPlayer.robot) { 
							do {
								io.in(room.id).emit("message", { from: null, to: null, text: "C'est au tour de " + room.turnPlayer.username + " de jouer (bot)", date: Date.now() });
								room.simulateMoveRobot(room.turnPlayer);
								room.swapJoueur(room.turnPlayer); // changer le joueur qui doit jouer
							}while(room.turnPlayer.robot);
							// emission de la défausse, pioche
							io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
							io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
							// emission du nom du player qui doit jouer aec le message associé
							io.in(room.id).emit("startTurn", room.getPlayers(), room.turnPlayer.username);
							io.in(room.id).emit("message", { from: null, to: null, text: "C'est au tour de " + room.turnPlayer.username + " de jouer", date: Date.now() });
						}
					}
				}else {
					// emission du nom du player qui à été remplacé par un bot
					if(deletePlayer) io.in(room.id).emit("message", { from: null, to: null, text: currentID + " a été remplacé par un bot", date: Date.now() } );
					
					// retourner les 2 cartes des joueur qui sont des robots
					room.retournerCardTurn1();
					
					// verifier si tous les joueurs ont retourner leur 2 cartes
					if (room.verifierTurn1() === true) {
						room.turn1 = false; // tour 1 terminé
						
						// determiner qui commence et l'ordre
						room.hierarchisePlayers();

						let tabPlayers = room.getPlayers();
						let nom = tabPlayers[0].username; // nom du joeur qui commence
						
						// emission du message de fin de tour 1 et le nom du joueur qui commence 
						io.in(room.id).emit("message", { from: null, to: null, text: "Fin du tour 1 !!! ", date: Date.now() });
						io.in(room.id).emit("message", { from: null, to: null, text: "C'est à " + nom + " de commencer", date: Date.now() });
						
						// faire jouer tous les robots si c'est un robot qui doit jouer
						while(room.turnPlayer.robot) {
							io.in(room.id).emit("message", { from: null, to: null, text: "C'est au tour de " + room.turnPlayer.username + " de jouer (bot)", date: Date.now() });
							room.simulateMoveRobot(room.turnPlayer);
							room.swapJoueur(room.turnPlayer); // changer le joueur qui doit jouer
						}

						// emission de la défausse, pioche
						io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
						io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
						// emission du nom du player qui doit jouer aec le message associé
						io.in(room.id).emit("startTurn", room.getPlayers(), room.turnPlayer.username);
						io.in(room.id).emit("message", { from: null, to: null, text: "C'est au tour de " + room.turnPlayer.username + " de jouer", date: Date.now() });		
					}
				}
				// emission des deck (main) de tous les joueurs
				io.in(room.id).emit("deck", room.getPlayers());
			}
			// emission pour donner la liste des rooms aux clients (maj nombre players room)
			let roomAvailable = getRoomAvailable()
			socket.broadcast.emit('list rooms', roomAvailable);
			io.to(socket.id).emit('list rooms', roomAvailable);
		}
	}
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

	/**
	 *  socket pour créer une room
	 *  @param  player     Object  player qui veut créer la room
	 *  @param  maxPlace   int  nombre de joeurs max de la room
	 */
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

	/**
	 *  socket pour rejoindre une room
	 *  @param  player   Object  player qui veut créer la room
	 *  @param  number    int     numéro de la room qu'on souhaite rejoindre
	 */
	socket.on("joinRoom", (player, number) => {	
				
		let room = null;

		// chercher la room que le joueur vont rejoindre
		rooms.forEach(r => {
			if(r.id === number) {
                room = r;
			}
		});
        
		// si le numéro de la room n'existe pas
		if(!room) {
            return;
		}

		player.roomId = room.id;

		console.log(`${player.username} connect room  ${player.roomId}`);

		socket.emit("roomId",room.id);

		// ajouter le player à la room
		room.addPlayer(player);
		socket.join(number);
		
		// emission du message de bienvenue sur le chat
		io.in(player.roomId).emit("message", { from: null, to: null, text: currentID + " a rejoint la partie", date: Date.now() });
		// emission pour donner la liste des rooms aux clients (maj nombre players room)
		socket.broadcast.emit('list rooms',getRoomAvailable());
		// emission pour donner la liste des players de la room
		io.in(room.id).emit("liste",room.getPlayers(), room.host);
	});

	/**
	 *  socket pour quitter une room
	 *  @param  player   Object  player qui veut quitter la room
	 */
	socket.on("leave", (player)=>{
		if(currentID){
			// gérer le joueur qui souhaite quitter la room
			gestionTourPlayerQuitt(player);
		}
	});
 	
	/**
	 * check si la room et vide ou ne contient pas que des robots => supprimer la room
	 * @param  playerRoomId   int  id de la room
	 */
	 function checkRoom(playerRoomId) {
		let room;

		// chercher la room
		for (let i = 0; i < rooms.length; ++i) {
		    if(rooms[i].id === playerRoomId) {
                room = rooms[i];
			}
		}

		let deleteRoom = false;

		// varifier le nombre de joeurs sur la room et si tous les joueurs sonr des robots 
		if(room.placePrise !== 0 && !room.hasOnlyRobot()) {
			// emission du message de au revoir sur le chat
			io.in(room.id).emit("message", { from: null, to: null, text: currentID + " a quitté la partie", date: Date.now() } );
			// emission pour donner la liste des players de la room
			io.in(room.id).emit("liste",room.getPlayers(), room.host);
		}else { // tous les joeurs sont des robots ou il n'y a pas plus personne sur la room
			console.log("delete room -> " + room.id)
			// enlever la room du tableau de rooms
			rooms = rooms.filter(r => r.id !== room.id);
			deleteRoom = true;
		}

		return deleteRoom;
	}

	/**
	*  Supprime le player d'une room
	*  @param  player   Object  player qui souhaite quitter la room
	*/
	function supprimerPlayerRoom(player) {	
		let room;

		// chercher la room
		rooms.forEach(r => {
			if(r.id === player.roomId) {
				room = r;
			}
		});

		// supprimer le player de la room
		let deletePlayer = room.deletePlayer(player.username);
		
		return deletePlayer;
	}

	/**
	*  Fonction qui créer une room
	*  @param  player    Object  player qui souhaite créer la room
	*  @param  maxPlace  int     nombre de joueur max de la room
	*/
	function createRoom(player, maxPlace){
		const room = new Room (rooms.length, maxPlace);
		
		// ajouter player room
		room.addPlayer(player);

		// mettre l'hôte de la room
		room.setHost(player.username);

		rooms.push(room);
	
		return room;
	}

	/**
	*  Fonction qui recupère les rooms disponible :
	*  - room pas pleine 
	*  - room pas démarrer
	*/
	function getRoomAvailable() {
		let z = rooms.filter(r => !r.isFull())
		return z.filter(r => !r.run)
	}

	
	/**************************************************
	 *
	 *						game
	 *
	 * ***********************************************/
	 
	/**
	*  Socket pour lancer le debut de la manche
	*  @param  username  String  nom de la personne qui souhaite demarrer la partie 
	*/
	 socket.on("startManche", (username)=>{
	    
		// chercher dans quelle room le player est hôte
		rooms.forEach(r => {
			if(r.host === username) {
			    
                if(r.placePrise === 1) { 
				    io.in(r.id).emit("message", { from: null, to: null, text: "Impossible de lancer tous seul. <br> <i>PS : Trouve toi des amis :</i>", date: Date.now() });    
				}else {
					r.run = true;
				    // lancer la manche
					r.lancerJeu();
				    // emission de la défausse, pioche
					io.in(r.id).emit("defausse", r.getDiscard2Cards(), r.getSizeDiscard());
				    io.in(r.id).emit("pioche", r.getPioche2Cards(), r.getSizePioche());
			        
					// emission des rooms possible de rejoindre
					socket.broadcast.emit('list rooms', getRoomAvailable());
					io.in(r.id).emit('liste', r.getPlayers(), r.host);
					
					// emmision du démarage du tour 1 et du message associé
					io.in(r.id).emit("startTurn1", r.getPlayers());
					io.in(r.id).emit("message", { from: null, to: null, text: "La manche commence !!!", date: Date.now() });
				}
			}
		});
	
	 });
	 

	/**
	*  Socket qui est recu lorsque un joueur à terminer sont tour 
	*  @param  player     Object  player qui à terminer son tour
	*/
	 socket.on("endTurnJoueur", (player) => {
		console.log("fin du tour de " + player.username);
		
		// chercher la room 
		let room = getRoom(player.roomId);
		
		if(room.turn1) { // si on est dans le tour 1
			
			//mettre à jour les cartes du joueur
			let cardsChange = [player.phase.card1, player.phase.card2]
			room.majMain(player, cardsChange)

			
            // vérifier tout le monde retourner carte 
			if (room.verifierTurn1() === true) {
                room.turn1 = false; // tour 1 terminer
                
				// chercher qui commence et l'ordre des joeurs
				room.hierarchisePlayers();
				let tabPlayers = room.getPlayers();
				let nom = tabPlayers[0].username;
				
				// emmsion du message de fin de tour 1 et le nom du joueur qui commence
				io.in(room.id).emit("message", { from: null, to: null, text: "Fin du tour 1 !!! ", date: Date.now() });
				io.in(room.id).emit("message", { from: null, to: null, text: "C'est à " + nom + " de commencer", date: Date.now() });
				
				// faire jouer si c'est un robot de jouer
				while(room.turnPlayer.robot) {
					io.in(room.id).emit("message", { from: null, to: null, text: "C'est au tour de " + room.turnPlayer.username + " de jouer (bot)", date: Date.now() });
					room.simulateMoveRobot(room.turnPlayer);
					// changer le joueur qui doit joueur
					room.swapJoueur(room.turnPlayer);
				}
				
				// emission de la defausse et de la pioche
				io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
				io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
				// emission du debut du tour et du message associé 
				io.in(room.id).emit("startTurn", room.getPlayers(), room.turnPlayer.username);
				io.in(room.id).emit("message", { from: null, to: null, text: "C'est au tour de " + room.turnPlayer.username + " de jouer", date: Date.now() });			
				
			}else {
				io.in(room.id).emit("endTurnJoueur", room.getPlayers());
			}
		}else {
            
			// changer le joueur qui doit jouer
            let playerTurn = room.swapJoueur();
			let nom = playerTurn.username;

			// tant que c'est à un robot de jouer et qur le joueur qui doit jouer n'es pas celui qui à declanché la fin de la partie
			while (playerTurn.robot && nom!==room.playerAllReturnMain) {
				io.in(room.id).emit("message", { from: null, to: null, text: "C'est au tour de " + nom + " de jouer (bot)", date: Date.now() });
				room.simulateMoveRobot(playerTurn);
				// emission de la defausse et de la pioche
				io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
				io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
				// emission des mains des joueurs
				io.in(room.id).emit("deck", room.getPlayers());
				io.in(room.id).emit("liste",room.getPlayers(), room.host);
				// changer le joeur qui doit jouer
				playerTurn = room.swapJoueur();
				nom = playerTurn.username;
			}
            
			// si un joueur à retourner toute ses cartes (dernier tour)
            if(room.playerAllReturnMain !== null) {
                // dernier tour
                
				// emission du mesage de dernier tour
				if(!room.lastTurnDeclanche) {
					room.lastTurnDeclanche = true;
					io.in(room.id).emit("message", { from: null, to: null, text: "C'est le dernier tour !!!", date: Date.now() });
				}
			}
			
			// si le joueur qui doit jouer et le joeur qui à déclancher la fin de la manche (manche finit)
			if(room.playerAllReturnMain === nom) {
				// manche finit

				// retourner les cartes de tous les joueurs
				room.turnAlldecks();
				
				// emission des mains des joueurs
				io.in(room.id).emit("deck", room.getPlayers());
                io.in(room.id).emit("liste",room.getPlayers(), room.host);
                
				// verifier si la partie est finit (score > 100)
				let jeu = room.verifierEndGame();

				if(jeu.estTerminer) { // jeu est finit
					// supprimre tous les robots a la fin de la game
					room.deleteRobot(); 
                    // emission du message de fin de jeu des rooms disponivle de rejoindre
					io.in(room.id).emit("message", { from: null, to: null, text: "Fin du jeu : " + jeu.playersWin.join(', ') + ((jeu.playersWin.length > 1) ? " ont gagnés" : " gagné") + "...", date: Date.now() });
				    io.in(room.id).emit("endGame", jeu.playersWin);
					room.run = false;
					io.in(room.id).emit('liste', room.getPlayers(), room.host); 
					socket.broadcast.emit('list rooms', getRoomAvailable());
				}else { // manche finit
                    io.in(room.id).emit("message", { from: null, to: null, text: "La manche est finit...", date: Date.now() });				
					io.in(room.id).emit("endParty");
				}
   
			}else {
                io.in(room.id).emit("startTurn", room.getPlayers(), nom);
		        io.in(room.id).emit("message", { from: null, to: null, text: "C'est au tour de " + nom + " de jouer", date: Date.now() });
				
			}
		}
		// lancement d'une promesse et supprsion de la promesse du joueur d'avant
		if(promisse !=null) promisse.cancel(console.log("enlever promisse"));
		if(room.turnPlayer == null) myPromise(10000, room.id, null);		// tour 1 
		else promisse = myPromise(10000, room.id, room.turnPlayer.username);		
	});
	
	/**
	*  foction pour créer une prommesse
	*  @param  ms     int  temps en ms avant le time out (trop de temps pour jouer)
	*  @param  id     int  id de la room
	*  @param  name   String  nom du joueur qui doit jouer
	*/
	function myPromise(ms, id, name) {
		
		let p = new Promise(function(resolve, reject) {
			//Set up the timeout
			timeout = setTimeout(function() {
				let phrase = "tout ceux qui ont pas retournés leur 2 cartes : bouge vous :fuck:"
				if(name != null) {
					phrase = name + " bouge toi : espèce de foutriquet :fuck:"
				}
				io.in(id).emit("message", { from: null, to: null, text: phrase, date: Date.now() });
			}, ms);
		});
		// fonction pour supprimer la promesse si le joeur à jouer dans le temps impartis
		p.cancel = function () {
			clearTimeout(timeout);
		}
		return p;
	}

	/**
	*  Socket qui est recu lorsque un joueur pioche dans la pioche
	*  @param  player     Object  player qui souhaite pioché
	*/
	socket.on("pickedPioche", (player) => {
        console.log(player.username + " pioche dans la pioche")
    
		// chercher la room
		let room = getRoom(player.roomId);
		
		// retourner la carte au dessus de la pioche
		room.selectedCardPioche();
		
		// emission de la pioche
		io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
	});

	/**
	*  Socket qui est recu lorsque un joueur pioche dans la défausse
	*  @param  player     Object  player qui souhaite pioché
	*/
	socket.on("pickedDefausse", (player) => {
        console.log(player.username + " pioche dans la déffause")
		
		// chercher la room
		let room = getRoom(player.roomId);
        
		// retourner la carte au dessus de la défausse
		room.selectedCardDefausse();
		
		// emission de la défausse
		io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
	});
	  
	/**
	*  Socket qui est recu lorsque un joueur souhaite mettre une carte dans la défausse
	*  carte va de la pioche à la défausse
	*  @param  player     Object  player qui souhaite mettre une carte dans la défausse
	*/
	socket.on("putDefausse", (player)=> {
		console.log( player.username+ " met dans la defausse");
		
		// chercher la room 
		let room = getRoom(player.roomId);
		
		// mettre la carte du dessus de la pioche dans la défausse
		room.cardPiocheGoToDefausse(); 

		// émission de la défausse et de la pioche
		io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
		io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
	});

	/**
	*  Socket qui est recu lorsque un joueur souhaite tourner une carte de son plateau
	*  le joueur à tout d'abord mis une carte dans la defausse
	*  @param  player     Object  player qui souhaite tourner une carte de son plateau
	*/
    socket.on("turnCard", (player)=> {
		console.log(player.username + "tourne une carte sur son plateau")
		
		// chercher room
		let room = getRoom(player.roomId)

		// tourner la carte souhaite
		room.turnCardPlateau(player);

		// emission de la nouvelle main du joueur
        io.in(room.id).emit("deck", room.getPlayers());
	});

	socket.on("intervertir", (player, choice)=> { // choice pioche defausse
		console.log("intervertir card")

		// chercher la room
		let room = getRoom(player.roomId);

		// retourner la carte du plateau qui à été selectionner par le joueur
		room.turnCardGoToDefausse(player);
		
		// internertir la carte du plateau avec soit la carte du dessus de la pioche ou défausse
		room.intervertirCarte(player, choice);
		
		// émission de la défausse, pioche et la nouvelle main du joueur
		io.in(room.id).emit("defausse", room.getDiscard2Cards(), room.getSizeDiscard());
		io.in(room.id).emit("pioche", room.getPioche2Cards(), room.getSizePioche());
		io.in(room.id).emit("deck", room.getPlayers());
	})

	/**
	*  Fonction pour chercher une room dans le tableau de rooms en focntion de sont id
	*  @param  id     int  id de la room cherché
	*/
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