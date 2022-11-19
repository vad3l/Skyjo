const { isObject } = require("util");
const Jeu = require("./jeu.js")

class Room {
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
    }
    
    lancerPartie() {
        this.jeu = new Jeu();
        this.jeu.shuffle();
        //this.jeu.shuffle();
        this.jeu.distribute(this.players);
        
        this.players.forEach(p => {
            p.main.calculatePoints();
        });

        this.turn1 = true;
        this.turnPlayer = null;
        this.playerAllReturnMain = null;
        this.lastTurnDeclanche = false
    }

    addPlayer(player) {      
        this.players.push(player);
        this.placePrise++;
    }

    deletePlayer(playerDelete) {
        this.players = this.players.filter(p => p.username !== playerDelete);
        this.placePrise--;
        if(playerDelete === this.host) {
            this.players.forEach(p => {
                this.setHost(p.username);
                return;
            });
        }
    }

    setHost(username) {
        this.host = username;
    }

    isFull() {
        return this.placeMax == this.placePrise;
    }
    
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
 
   pickedPioche() {
       this.jeu.pickedPioche();
   }


   turnCard(player) {
        let cardsChange = [player.phase.card2];
        this.majMain(player, cardsChange);
   }

    hierarchisePlayers() {    
        this.players.sort(function(a,b){ return b.main.points - a.main.points});
        this.turnPlayer = this.players[0].username;
    }
    
    swapJoueur() {
        let p;
        for (let i = 0; i < this.players.length; i++) {
            if(this.players[i].username === this.turnPlayer) {
                //console.log("i :", this.players[i].username);
                //console.log("i :", this.players[i+1].username);
                if(i === this.players.length-1) {
                    p = this.players[0];  
                }else {
                    p = this.players[i+1];
                }
            }
        }
        this.turnPlayer = p.username;
        return this.turnPlayer;
    }

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
    
    turnAlldecks() {
        let scores= [];
        let scoreJoueurDeclanche;

        this.players.forEach(p => {
            p.main.returnAll();
            let point = p.main.calculatePoints();
            scores.push({username: p.username, points: point}); 
            if(p.username === this.playerAllReturnMain) {
                scoreJoueurDeclanche = point;
            }
        });
        
        console.log(this.playerAllReturnMain +" a declanche la fin de partie")
        console.log(scores);

        console.log("score joueur declanche" , scoreJoueurDeclanche);

        let bool = false;
        scores.forEach(p => {
            if(p.points <= scoreJoueurDeclanche && p.username !== this.playerAllReturnMain) {
                console.log(p.username + " a un plus petit score que le joeur qui declanche (" + this.playerAllReturnMain + ")");
                bool = true;
            }
        });
        
        let i = 0;
        this.players.forEach(p => {
            if(bool && p.username === this.playerAllReturnMain) {
               p.score += scores[i].points * 2;
            }else {
                p.score += scores[i].points;
            }
            ++i;
            //console.log(p)
        })
    }

    getPlayers() {
        return this.players;
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
}

module.exports = Room;