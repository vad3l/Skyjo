const { bool } = require("assert-plus");
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
        this.endGame = false;
    }
    
    lancerJeu() {
        this.jeu = new Jeu();
        this.jeu.shuffle();
        //this.jeu.shuffle();
        this.jeu.distribute(this.players);
        
        this.players.forEach(p => {
            p.main.calculatePoints();
            // remttre a 0 le sacore des joueurs si nouvelle partie (quelequn a gagner)
            if(this.endGame) {
                p.score = 0;
            }
        });
        
        this.turn1 = true;
        this.turnPlayer = null;
        this.playerAllReturnMain = null;
        this.lastTurnDeclanche = false;
        this.endGame = false;
    }

    addPlayer(player) {      
        this.players.push(player);
        this.placePrise++;
    }

    deletePlayer(playerDelete) {
        if(playerDelete === this.host) { //avnt pas de palyedelete.userneme
            this.players.forEach(p => {
                if(!p.robot) {
                    this.setHost(p.username);
                    return;
                }
            });
        }

        let bool = false;
        if(!this.run) {
            this.players = this.players.filter(p => p.username !== playerDelete);
            this.placePrise--;
            console.log("supprimer players")        
        }else {
            console.log("remplacer par un bot")        
            this.players.forEach(p => {
                if(playerDelete === p.username) {
                    p.username = "Bot - " + p.username;
                    p.robot = true;
                    bool = true;
                }
            })
        }  
        
        return bool;
    }

    deleteRobot() {
        this.players.forEach(p => {
            if(p.robot) {
                console.log("supprimer bot " + p.username);
                this.placePrise--;
            }
        });
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


   turnCardPlateau(player) {
        let cardsChange = [player.phase.card2];
        this.majMain(player, cardsChange);
   }

   turnCardGoToDefausse(player) {
    let cardsChange = [player.phase.card2];
    //console.log(player.phase.card2)
    //console.log("card cgange", cardsChange)
    this.players.forEach(p => {
        if(p.username === player.username) {
            p.main.majMain(cardsChange);
        }
    });
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
        return p;
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
            //console.log(p);
        })
    }
    
    verifierEndGame() {
        let end = false;
        let ps = [];
        let min = 500;

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


    simulateMoveRobot(robot) {
        let min = 15;
        let l;
        let c;
        console.log("main : ",robot.phase)
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                if(robot.main.cartes[i][j].value < min && robot.main.cartes[i][j].back) {
                    l = i;
                    c = j;
                }
            }
        }
        robot.phase = {card1: null, card2: null};
        robot.phase.card2 = {ligne : l, colonne: c}
        
        console.log("robot return l/c" , l , c)
        this.turnCardGoToDefausse(robot);

        
        this.intervertirCarte(robot, "pioche");
    }
}

module.exports = Room;