"use strict";

document.addEventListener("DOMContentLoaded", function(_e) {

    // socket ouverte vers le client
    var sock = io.connect();
    
    // utilisateur courant 
    var currentUser = null;
    
    // réception du message de bienvenue
    sock.on("bienvenue", function(liste) {    
        if (currentUser) {
            // on change l'affichage du bouton
            document.getElementById("btnConnecter").value = "Se connecter";
            document.getElementById("btnConnecter").disabled = false;
            // on vide les zones de saisie
            // go to
            window.location = "lobby.html"
        }
    });
    
    // réception d'une erreur de connexion
    sock.on("erreur-connexion", function(msg) {
        alert(msg);   
        document.getElementById("btnConnecter").value = "Se connecter";
        document.getElementById("btnConnecter").disabled = false;
    });
    
    /** 
     *  Connexion de l'utilisateur au lobby.
     */
    function connect() {
        // recupération du pseudo
        var user = document.getElementById("pseudo").value.trim();
        if (! user) return;
        currentUser = user; 
        // ouverture de la connexion
        sock.emit("login", user);
        document.getElementById("btnConnecter").value = "En attente...";
        document.getElementById("btnConnecter").disabled = true;
    } 
       
    /** 
     *  Mapping des boutons de l'interface avec des fonctions du client.
     */
    document.getElementById("btnConnecter").addEventListener("click", connect);
    
    /**
     *  Ecouteurs clavier
     */
    document.getElementById("pseudo").addEventListener("keydown", function(e) {
        if (e.keyCode == 13) // touche entrée
            connect();
    });
        
    // Au démarrage : force l'affichage de l'écran de connexion
    document.getElementById("radio1").checked = true;
    document.getElementById("pseudo").focus();
    
});
    