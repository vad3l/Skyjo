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
    }
    
    createJeu() {
        this.jeu = new Jeu();
        this.jeu.shuffle();
        this.jeu.shuffle();
        this.jeu.distribute(this.players);
        this.calculatePoints();
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
    
    calculatePoints() {
        this.players.forEach(p => {
            p.main.calculPoints();
        });
    }

    getPlayers() {
        return this.players;
    }

    getDiscard() {
        return this.jeu.getDiscard();
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