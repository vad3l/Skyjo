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
    res.sendFile(__dirname + '/public/html/lobby.html');
});


/***************************************************************
 *           Gestion des clients et des connexions
 ***************************************************************/

var clients = {};       // { id -> socket, ... }


/***************************************************************
 *              Gestion des défis Chi-Fou-Mi 
 ***************************************************************/

var chifoumi = require("./rpsls");


/**
 *  Supprime les infos associées à l'utilisateur passé en paramètre.
 *  @param  string  id  l'identifiant de l'utilisateur à effacer
 */
function supprimer(id) {
    delete clients[id];
    chifoumi.supprimer(id);
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
        chifoumi.ajouter(currentID);
        // log
        console.log("Nouvel utilisateur : " + currentID);
        // scores 
        var scores = JSON.parse(chifoumi.scoresJSON());
        // envoi d'un message de bienvenue à ce client
        socket.emit("bienvenue", scores);
        // envoi aux autres clients 
        socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() });
        // envoi de la nouvelle liste à tous les clients connectés 
        socket.broadcast.emit("liste", scores);
    });
    
    
    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous  
     */
    socket.on("message", function(msg) {
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
            io.sockets.emit("message", { from: currentID, to: null, text: msg.text, date: Date.now() });
        }
    });
    
    
    /**
     *  Réception d'une demande de défi
     */
    socket.on("chifoumi", function(data) {
        data.choice = data.choice.substring(1, data.choice.length - 1);
        var res = chifoumi.defier(currentID, data.to, data.choice);
        switch (res.status) {
            case 1: 
                clients[data.to].emit("chifoumi", currentID );
            case -1: 
            case -2: 
                socket.emit("message", { from: 0, to: currentID, text: res.message, date: Date.now() });
                break;
            case 0:
                if (res.resultat.vainqueur == null) {
                    socket.emit("message", { from: 0, to: currentID, text: res.resultat.message, date: Date.now() });
                    clients[data.to].emit("message", { from: 0, to: data.to, text: res.resultat.message, date: Date.now() });
                }
                else {
                    clients[res.resultat.vainqueur].emit("message", { from: 0, to: res.resultat.vainqueur, text: res.resultat.message + " - c'est gagné", date: Date.now() });
                    clients[res.resultat.perdant].emit("message", { from: 0, to: res.resultat.perdant, text: res.resultat.message + " - c'est perdu", date: Date.now() });
                    io.sockets.emit("liste", JSON.parse(chifoumi.scoresJSON()));
                }
                break;
        }
    });
    
    /** 
     *  Gestion des déconnexions
     */
    
    // fermeture
    socket.on("logout", function() { 
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            console.log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message", 
                { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() } );
            // suppression de l'entrée
            supprimer(currentID);
            // désinscription du client
            currentID = null;
             // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", JSON.parse(chifoumi.scoresJSON()));
        }
    });
    
    // déconnexion de la socket
    socket.on("disconnect", function(reason) { 
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message", 
                { from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() } );
            // suppression de l'entrée
            supprimer(currentID);
            // désinscription du client
            currentID = null;
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", JSON.parse(chifoumi.scoresJSON()));
        }
        console.log("Client déconnecté");
    });
        
});

