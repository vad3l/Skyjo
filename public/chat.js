"use strict";

document.addEventListener("DOMContentLoaded", function(_e) {

    // socket ouverte vers le client
    var sock = io.connect();
    
    // utilisateur courant 
    var currentUser = null;
    
    // tous les utilisateurs (utile pour la complétion) 
    var users = [];
    
    // tous les caractères spéciaux (utile pour les remplacements et la complétion) 
    var specialChars = {
        ":paper:": "&#128220;",
        ":rock:": "&#129704;",
        ":scissors:": "&#9988;",
        ":lizard:": "&#128013;",
        ":spock:": "&#128406;",
        ":smile:": "&#128578;",
        ":sad:": "&#128577;",
        ":laugh:": "&#128512;",
        ":wink:": "&#128521;",
        ":love:": "&#129392;",
        ":coeur:": "&#10084;",
        ":bisou:": "&#128536;",
        ":peur:": "&#128561;",
        ":whoa:": "&#128562;",
        ":mask:" : "&#128567;"
    }

    // réception du message de bienvenue
    sock.on("bienvenue", function(liste) {    
        if (currentUser) {
            // on change l'affichage du bouton
            document.getElementById("btnConnecter").value = "Se connecter";
            document.getElementById("btnConnecter").disabled = false;
            // on vide les zones de saisie
            document.querySelector("#content main").innerHTML = "";
            document.getElementById("monMessage").value = "";
            document.getElementById("login").innerHTML = currentUser;
            document.getElementById("radio2").checked = true;
            document.getElementById("monMessage").focus();
            afficherListe(liste);
        }
    });
    // réception d'une erreur de connexion
    sock.on("erreur-connexion", function(msg) {
        alert(msg);   
        document.getElementById("btnConnecter").value = "Se connecter";
        document.getElementById("btnConnecter").disabled = false;
    });
    
    // réception d'un message classique
    sock.on("message", function(msg) {
        if (currentUser) {
            afficherMessage(msg);
        }
    });
    // réception de la mise à jour d'une liste
    sock.on("liste", function(liste) {
        if (currentUser) {
            afficherListe(liste);
        }
    });
    
    // réception d'un défi
    sock.on("chifoumi", function(adversaire) {
        // petit effet spécial (class "buzz" à ajouter pour faire vibrer l'affichage)
        document.getElementById("content").classList.add("buzz");
        setTimeout(function() {
            document.getElementById("content").classList.remove("buzz");
        }, 500);
        
        var btnRepondre = document.createElement("button");
        btnRepondre.innerHTML = "lui répondre";
        btnRepondre.addEventListener("click", function() { initierDefi(adversaire); });
        var p = document.createElement("p");
        p.classList.add("chifoumi");
        p.innerHTML = getLocalTime(new Date()) + 
                        " - [chifoumi] : " + adversaire + " te défie à Rock-Paper-Scissors-Lizard-Spock ";     
        p.appendChild(btnRepondre);
        document.querySelector("#content main").appendChild(p);
    });
    
    // gestion des déconnexions de la socket --> retour à l'accueil
    sock.on("disconnect", function(reason) {
        currentUser = null;
        document.getElementById("radio1").checked = true;
        document.getElementById("pseudo").focus();
    });
    
    /** 
     *  Connexion de l'utilisateur au chat.
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
     *  Affichage des messages 
     *  @param  object  msg    { from: auteur, text: texte du message, date: horodatage (ms) }
     */
    function afficherMessage(msg) {
        // si réception du message alors que l'on est déconnecté du service
        if (!currentUser) return;   
        
        // affichage des nouveaux messages 
        var bcMessages = document.querySelector("#content main");

        // identification de la classe à appliquer pour l'affichage
        var classe = "";        

        // cas des messages privés 
        if (msg.from != null && msg.to != null && msg.from != 0) {
            classe = "mp";  
            if (msg.from == currentUser) {
                msg.from += " [privé @" + msg.to + "]";   
            }
            else {
                msg.from += " [privé]"
            }
        }
        
        // cas des messages ayant une origine spécifique (soi-même ou le serveur)
        if (msg.from == currentUser) {
            classe = "moi";   
        }
        else if (msg.from == null) {
            classe = "system";
            msg.from = "[admin]";
        }
        else if (msg.from === 0) {
            classe = "chifoumi";
            msg.from = "[chifoumi]";
        }
        
        // affichage de la date format ISO pour avoir les HH:MM:SS finales qu'on extrait ensuite
        var date = getLocalTime(msg.date);
        // remplacement des caractères spéciaux par des émoji
        msg.text = traiterTexte(msg.text);
        // affichage du message
        bcMessages.innerHTML += "<p class='" + classe + "'>" + date + " - " + msg.from + " : " + msg.text + "</p>"; 
        // scroll pour que le texte ajouté soit visible à l'écran
        document.querySelector("main > p:last-child").scrollIntoView();
    };
    

    function getLocalTime(date) {
        return (new Date(date)).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }).substring(11);
    }
    
    
    // traitement des emojis
    function traiterTexte(txt) {
        // remplacement de quelques smileys par les :commandes: correspondantes
        txt = txt.replace(/:[-]?\)/g,':smile:');
        txt = txt.replace(/:[-]?[Dd]/g,':laugh:');
        txt = txt.replace(/;[-]?\)/g,':wink:');
        txt = txt.replace(/:[-]?[oO]/g,':whoa:');
        txt = txt.replace(/:[-]?\*/g,':bisou:');
        txt = txt.replace(/<3/g,':coeur:');
        // remplacement des :commandes: par leur caractère spécial associé 
        for (let sp in specialChars) {
            txt = txt.replace(new RegExp(sp, "gi"), specialChars[sp]);   
        }
        return txt;   
    }

    
    /**
     *  Affichage de la liste de joueurs.
     */
    function afficherListe(newList) {
        // liste des joueurs
        users = Object.keys(newList);
        // tri des joueurs en fonction de leur classement
        users.sort(function(u1, u2) { return newList[u2] - newList[u1]; });
        // affichage en utilisant l'attribut personnalisé data-score
        document.querySelector("#content aside").innerHTML = 
            users.map(u => "<p data-score='" + newList[u] + "'>" + u + "</p>").join("");
    }


    /**
     *  Envoi d'un message : 
     *      - Récupération du message dans la zone de saisie.
     *      - Identification des cas spéciaux : @pseudo ... ou /chifoumi @pseudo :choix:
     *      - Envoi au serveur via la socket
     */ 
    function envoyer() {
        
        var msg = document.getElementById("monMessage").value.trim();
        if (!msg) return;   

        // Cas des messages privés
        var to = null;
        if (msg.startsWith("@")) {
            var i = msg.indexOf(" ");
            to = msg.substring(1, i);
            msg = msg.substring(i);
        }
        
        // Cas d'un chifoumi
        if (msg.startsWith("/chifoumi")) {
            var args = msg.split(" ").filter(e => e.length > 0);
            if (args.length < 3) {
                afficherMessage({from: null, text: "Usage : /chifoumi @adversaire :choix:", date: Date.now() });
                return;
            }
            if (args[1].charAt(0) != "@") {
                afficherMessage({from: null, text: "Le second argument doit être le nom de l'adversaire précédé de @", date: Date.now() });
                return;
            }
            to = args[1].substr(1);
            if (to == currentUser) {
                afficherMessage({from: null, text: "Il est impossible de se défier soi-même !", date: Date.now() });
                return;
            }
            if ([":rock:", ":scissors:", ":paper:", ":lizard:", ":spock:"].indexOf(args[2]) < 0) {
                afficherMessage({from: null, text: "Le troisième argument est incorrect.", date: Date.now() });
                return;
            }
            sock.emit("chifoumi", { to: to, choice: args[2] });
        }
        else {
            // envoi
            sock.emit("message", { to: to, text: msg });
        }
        // enregistrement de la commande dans l'historique
        historique.ajouter();
        // effacement de la zone de saisie
        document.getElementById("monMessage").value = "";
    }

    
    function initierDefi(adversaire) {
        document.getElementById("monMessage").value = "/chifoumi @" + adversaire + " :";
        document.getElementById("monMessage").focus();
        completion.reset();
    }
    
    
    /**
     *  Quitter le chat et revenir à la page d'accueil.
     */
    function quitter() { 
        if (confirm("Quitter le chat ?")) {
            currentUser = null;
            sock.emit("logout");
            document.getElementById("radio1").checked = true;
        }
    };    
    

    // Objet singleton gérant l'auto-complétion
    var completion = {
        // le texte de base que l'on souhaite compléter
        text: null,
        // l'indice de la proposition courant de complétion
        index: -1,
        // la liste des propositions de complétion
        props: [],
        // remise à zéro
        reset: function() {
            this.text = null;
            this.index = -1;
        },
        // calcul de la proposition suivante et affichage à l'emplacement choisi
        next: function() {
            if (this.text === null) {
                this.text = document.getElementById("monMessage").value;
                this.props = this.calculePropositions();
                this.text = this.text.substring(0, this.text.lastIndexOf(":"));
                this.index = -1;
                if (this.props.length == 0) {
                    this.text = null;
                    return;
                }
            }
            this.index = (this.index + 1) % this.props.length;
            document.getElementById("monMessage").value = this.text + this.props[this.index];   
        },
        // calcul des propositions de compétion
        calculePropositions: function() {
            var i = this.text.lastIndexOf(":");
            if (i >= 0) { 
                var prefixe = this.text.substr(i);
                return Object.keys(specialChars).filter(e => e.startsWith(prefixe));
            }
            return [];
        }
    };
    
    // Objet singleton gérant l'historique des commandes saisies
    var historique = {
        // contenu de l'historique
        content: [],
        // indice courant lors du parcours
        index: -1,
        // sauvegarde de la saisie en cour
        currentInput: "",
        
         precedent: function() {
            if (this.index >= this.content.length - 1) {
                return;
            }
            // sauvegarde de la saisie en cours
            if (this.index == -1) {
                this.currentInput = document.getElementById("monMessage").value;
            }
            this.index++;
            document.getElementById("monMessage").value = this.content[this.index];
            completion.reset();
        },
        suivant: function() {
            if (this.index == -1){
                return;
            }
            this.index--;
            if (this.index == -1) {
                document.getElementById("monMessage").value = this.currentInput;
            }
            else{
                document.getElementById("monMessage").value = this.content[this.index];
            }
            completion.reset();
        },
        ajouter: function() {
            this.content.splice(0, 0, document.getElementById("monMessage").value);
            this.index = -1;
        }
    }
    
    
    /** 
     *  Mapping des boutons de l'interface avec des fonctions du client.
     */
    document.getElementById("btnConnecter").addEventListener("click", connect);
    document.getElementById("btnQuitter").addEventListener("click", quitter);
    document.getElementById("btnEnvoyer").addEventListener("click", envoyer);
    
    /**
     *  Ecouteurs clavier
     */
    document.getElementById("pseudo").addEventListener("keydown", function(e) {
        if (e.keyCode == 13) // touche entrée
            connect();
    });
    document.getElementById("monMessage").addEventListener("keydown", function(e) {
        switch (e.keyCode) {
            case 9 : // tabulation
                e.preventDefault();     // empêche de perdre le focus
                completion.next();
                break;
            case 38 :   // fleche haut
                e.preventDefault();     // empêche de faire revenir le curseur au début du texte
                historique.precedent();
                break;
            case 40 :   // fleche bas
                e.preventDefault();     // par principe
                historique.suivant();
                break;
            case 13 :   // touche entrée
                envoyer();
            default: 
                completion.reset();
        }
    });
    document.querySelector("#content aside").addEventListener("dblclick", function(e) {
        if (e.target.tagName == "P") {
            initierDefi(e.target.innerHTML);
        }
    });
    
    // Au démarrage : force l'affichage de l'écran de connexion
    document.getElementById("radio1").checked = true;
    document.getElementById("pseudo").focus();
    
});
    