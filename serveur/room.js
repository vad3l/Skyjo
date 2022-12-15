const { bool } = require("assert-plus");
const { isObject } = require("util");
const Jeu = require("./jeu.js")

/**
*  Classe représentant une room
*/
class Room {
    /**
	*  Constructeur de la classe
	*/
    constructor(id, capacite) {
        this.id = id;
        this.placePrise = 0;
        this.placeMax = capacite;
        this.players = [];
        this.host = null;
        this.run = false;
        this.jeu = null;
        this.turn1 = false;
        this.turnPlayer = null;
        this.playerAllReturnMain = null;
        this.lastTurnDeclanche = false;
        this.endGame = false;
    }
    
    /**
	*  Fonction qui démmare une manche
    *  - mélange le jeu
    *  - distribue au joueurs ses cartes
	*/
    lancerJeu() {
        this.jeu = new Jeu();
        this.jeu.shuffle();
        
        this.jeu.distribute(this.players);
        
        this.players.forEach(p => {
            // remettre a 0 le score du joueur si nouvelle partie (quelq'un a gagner)
            if(this.endGame) {
                // => fin de partie
                p.score = 0;
            }
        });
        
        this.turn1 = true;
        this.turnPlayer = null;
        this.playerAllReturnMain = null;
        this.lastTurnDeclanche = false;
        this.endGame = false;
    }

    /**
	*  Fonction qui ajoute un joueur à la room
    *  @param player Object player à ajouter dans la room
	*/
    addPlayer(player) {      
        this.players.push(player);
        this.placePrise++;
    }

    /**
	*  Fonction qui enlève un joueur à la room
    * - on change l'hote de la game (pas un autre joueur qui n'est pas un robot)
    * - on remplace le joueur par un robot
    *  @param player Object player à enleve dans la room
	*/
    deletePlayer(playerDelete) {
        if(playerDelete === this.host) { 
            this.players.forEach(p => {
                if(!p.robot && p.username != playerDelete) {
                    console.log("set host ", p.username)
                    this.setHost(p.username);
                    return;
                }
            });
        }
 
        let bool = false; // flag pour savoir si on la remplace par un robot
        if(!this.run) { // le jeu est pas lancé donc on le remplace pas par un robot
            this.players = this.players.filter(p => p.username !== playerDelete);
            this.placePrise--;   
        }else { // le jeu est lancé donc on le remplace  par un robot 
            this.players.forEach(p => {
                if(playerDelete === p.username) {
                    // le joueur est remplacée par un robot
                    p.username = "Bot - " + p.username;
                    p.robot = true;
                    bool = true;
                    // si c'est sont tour de jouer le faire jouer 
                }
            })
        }  
        
        return bool;
    }

    /**
	*  Fonction qui retourne 2 cartes a tous les robots
	*/
    retournerCardTurn1() {
        this.players.forEach(p => {
            if(p.robot) {
                let cardsChange = [];
                let i=0;
                let j=0;
                while(p.main.getNbCartesRetourne()+cardsChange.length < 2) {
                    cardsChange.push({ligne : i, colonne: j});
                    i++;
                    j++;
                }
                
                // mise à jour de sa main des ses points 
                p.main.majMain(cardsChange);
                p.main.calculatePoints();
            } 
        });
    }

    /**
	*  Fonction qui supprime tous les robots de la room
	*/
    deleteRobot() {
        this.players = this.players.filter(p => !p.robot);
        this.placePrise = this.players.length;
    }

    /**
	*  Fonction qui regarde le nombre de robot dans la room
    *  @return bool true si il y'a que des robots dans la room ,false sinon
	*/
    hasOnlyRobot() {
        let bool = true;

        this.players.forEach(p => {
            if(!p.robot) {
                bool = false;
            }
        });
        return bool;
    }

    /**
	*  Fonction qui change l'host(propriétaire) de la room
    *  le propriétaire à le droit de relancer une manche, une partie
	*/
    setHost(username) {
        this.host = username;
    }

    /**
	*  Fonction qui regarde si il ya encore de la place dans la room
    *  @return bool true si il la room est pleine, false sinon
	*/
    isFull() {
        return this.placeMax == this.placePrise;
    }
    
    /**
	*  Fonction qui regarde si tous les joueurs int retournés leurs 2 cartes
    *  @return bool true si tous les joueurs (robot inclus) ont retourné leur 2 cartes,false sinon
	*/
    verifierTurn1() {
        let bool = true;
        this.players.forEach(p => {
            //console.log("nb vcarte retourne : ", p.main.getNbCartesRetourne())
            if(p.main.getNbCartesRetourne() != 2) {
                bool = false;
            }
        });
        return bool;
    }

    /**
	*  Fonction qui regarde le nombre de robot dans la room
    *  @param player      Object le player dont on veut mettre à jour la main
    *  @param cardsChange Object les cards qui vont subir un changement
	*/
    majMain(player, cardsChange) {
        this.players.forEach(p => {
            if(player.username === p.username) {
                p.main.majMain(cardsChange);
                p.main.verifierMain(this.jeu.discard);
                //console.log(this.jeu.discard)
                p.main.calculatePoints();
                if (this.playerAllReturnMain == null && p.main.isAllReturn()) {
                    this.playerAllReturnMain = p.username;
                }
            }
        });
    }


    selectedCardPioche() {
        this.jeu.selectedCardPioche();
    }

    selectedCardDefausse() {
       this.jeu.selectedCardDefausse();
    }
 
    cardPiocheGoToDefausse() {
        this.jeu.cardPiocheGoToDefausse();
    }

   /**
	*  Fonction qui retourne une carte de la main du joueur passé en paramètre
    *  @param player      Object le player sur lequel on souhaite retourner la carte
	*/
   turnCardPlateau(player) {
        let cardsChange = [player.phase.card2];
        this.majMain(player, cardsChange);
   }

    /**
    *  Fonction qui retourne de la main du joueur qui va aller dans la défausse plus tard
    *  @param player      Object le player sur lequel on souhaite retourner la carte
    */   
   turnCardGoToDefausse(player) {
    let cardsChange = [player.phase.card2];
    
    this.players.forEach(p => {
        if(p.username === player.username) {
            p.main.majMain(cardsChange);
        }
    });
    }

    
    /**
	*  Fonction qui intervit une carte de la main du joueur avec soit :
    *  - la première carte de la pioche
    *  - la première carte de la défausse
	*/
    intervertirCarte(player, choice) {
        this.players.forEach(p => {
            if(p.username === player.username){
                let l = player.phase.card2.ligne;
                let c =  player.phase.card2.colonne;
                this.jeu.intervertirCarte(l, c, p, choice);
            }
       });
       this.majMain(player, [])
    }
    
    /**
	*  Fonction qui détermine qui commence (celui qui à le plusde points) et
    *  l'ordre des joueurs qui joueront après
	*/
    hierarchisePlayers() {    
        this.players.sort(function(a,b){ return b.main.points - a.main.points});
        this.turnPlayer = this.players[0];
    }
    
    /**
	*  Fonction qui change le player qui doit joué
	*/
    swapJoueur() {
        let p;
        for (let i = 0; i < this.players.length; i++) {
            if(this.players[i].username === this.turnPlayer.username) {
                if(i === this.players.length-1) {
                    p = this.players[0];  
                }else {
                    p = this.players[i+1];
                }
            }
        }
        this.turnPlayer = p;
        return p;
    }

    /**
	*  Fonction qui returne toutes les cartes de la main de tous les joueurs
    *  et qui additionne au score total du joueur son nombre de points de la manche
    *  (* 2) si il déclanché la fin de la manche et qu'il na pas le plus petit score (strictement)
	*/
    turnAlldecks() {
        let scores= [];
        let scoreJoueurDeclanche;

        // recherche du score du joueur qui à declanché la fin de la manche
        this.players.forEach(p => {
            p.main.returnAll();
            let point = p.main.calculatePoints();
            scores.push({username: p.username, points: point}); 
            if(p.username === this.playerAllReturnMain) {
                scoreJoueurDeclanche = point;
            }
        });
        
        // recherche du plus petit score entre tous les joueurs
        let bool = false;
        scores.forEach(p => {
            if(p.points <= scoreJoueurDeclanche && p.username !== this.playerAllReturnMain) {
                console.log(p.username + " a un plus petit score que le joeur qui declanche (" + this.playerAllReturnMain + ")");
                bool = true;
            }
        });
        
        let i = 0;
        this.players.forEach(p => {
            if(bool && p.username === this.playerAllReturnMain) { // pas plus petit score
                // => prendre le double de points
               p.score += Math.abs(scores[i].points) * 2;
            }else {
                p.score += scores[i].points;
            }
            ++i;
        })
    }
    
    /**
	*  Fonction qui regarde si un joueur à perdu et regarder dans ce cas ci, quelle est les gagnants
    *  @return Object premier element:  bool, true si le jeu est terminer, false sinon
	*                 deuxième element:  [String], le(s) nom du(des) joueur(s) qui a(ont) le plus petit score (gagné)
    */
    verifierEndGame() {
        let end = false;
        let ps = [];
        let min = 500;

        // recherche du plus petit score entre tous les joueurs
        this.players.forEach(p => {
            if(p.score >= 100) {
                end = true;
                this.endGame = true;
            }
            if(p.score < min) {
                min = p.score;
                ps.splice(0, ps.length);
                ps.push(p.username);
            }else if(p.score === min) {
                ps.push(p.username);
            }
        });
        
        return {estTerminer: end, playersWin: ps};
    }

    /**
	*  Fonction qui retourner les players en obfusqant les cartes retournées de sa main
    */
    getPlayers() {
        let allplayers = JSON.parse(JSON.stringify(this.players));

        allplayers.forEach(tab => {
            for (let i = 0; i < 3; ++i) {
                for (let j = 0; j < 4; ++j) {
                    if(tab.main != null && tab.main.cartes[i][j] != null && tab.main.cartes[i][j].back == true) {
                        tab.main.cartes[i][j].value = 15;
                        tab.main.cartes[i][j].color = "#FFFFFF";
                    }
                }
            }
        });
        return allplayers;
    }

    getDiscard2Cards() {
        return this.jeu.getDiscard2Cards();
    }

    getPioche2Cards() {
        return this.jeu.getPioche2Cards();
    }

    getSizePioche() {
        return this.jeu.getSizePioche(); 
    }

    getSizeDiscard() {
        return this.jeu.getSizeDiscard();
    }

    /**
	*  Fonction qui simule le tour d'un joueur
    *  @param robot  Object le robot(player) sur lequel on souhaite retourner la carte
    */
    simulateMoveRobot(robot) {
        let max = -3;
        let l;
        let c;
        
        // recherche carte maximum dans sa main
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                if(robot.main.cartes[i][j] != null && robot.main.cartes[i][j].value > max) {
                    l = i;
                    c = j;
                    max = robot.main.cartes[i][j].value;
                }
            }
        }
        robot.phase = {card1 :null, card2: null};
        robot.phase.card2 = {ligne: l, colonne:c}
        
        let val_pioche = this.jeu.pioche[0];
        let val_defausse = this.jeu.discard[0];

        if(val_pioche < val_defausse) { // valeur carte pioche plus intérressante
            console.log("bot pioche dans la pioche");
            if(val_pioche > max) { //
                console.log("bot pose defausse et tourne une carte");
                // retourner la carte au dessus de la pioche
                this.selectedCardPioche();
                // mettre dans la defausse la carte
                this.cardPiocheGoToDefausse();
                // tourner une carte sur le plateau
                this.turnCardPlateau(robot);
            }else { 
                console.log("bot pose sur son plateau");
                // retourner la carte au dessus de la pioche
                this.selectedCardPioche();
                // retourner la carte qui va aller dans la défausse
                this.turnCardGoToDefausse(robot);
                // intervertir avec la carte au dessus de la pioche
                this.intervertirCarte(robot, "pioche");
            }
        }else { // valeur carte défausse plus intérressante
            console.log("bot pioche dans la defausse et remplace par une carte de son plateau");
            // selectionner la carte au dessus de la défausse
            this.selectedCardDefausse();
            // retourner la carte qui va aller dans la défausse
            this.turnCardGoToDefausse(robot);
            // intervertir avec la carte au dessus de la défausse
            this.intervertirCarte(robot, "defausse");
        }        
    }
}

module.exports = Room;
