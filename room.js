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
    }
    
    createJeu() {
        this.jeu = new Jeu();
        this.jeu.shuffle();
        this.jeu.shuffle();
        this.jeu.distribute(this.players);
        
        this.players.forEach(p => {
            p.main.calculatePoints();
        });

        this.turn1 = true;
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
        this.players.forEach(p => {
            if(p.main.getNbCartesRetourne() < 2) {
                return false;
            }
        });
        return true;
    }

    majMain(player) {
        for(let i =0; i < this.players.length; ++i) {
            if(this.players[i].username === player.username) {
                this.players.main = player.main;
                this.players[i].main.calculatePoints();
                return;
            }
        }
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

    getSizeDicard() {
        return this.jeu.getSizeDicard();
    }
}

module.exports = Room;