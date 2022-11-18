const Carte = require("./carte.js")
const Main = require("./main.js")

class Jeu {
    constructor() {
        this.pioche = [];
        var carte;
        for (let i = 0; i < 5; i++) {
            carte = new Carte(-2);
            carte.setColor();
            this.pioche.push(carte);   
        }
        for (let i = 0; i < 15; i++) {
            carte = new Carte(0);
            carte.setColor();
            this.pioche.push(carte)   
        }
        for (let i = -1; i <= 12; i++) {
            for (let j = 0; j < 10; j++) {
                carte = new Carte(i);
                carte.setColor();
                this.pioche.push(carte)      
            }
        }

        this.discard = [];
    }

    shuffle() {
       this.pioche.sort(() => Math.random() - 0.5);
    }

    distribute(players) {
        let nbPlayers = players.length;
        players.forEach(p => {
            p.main = new Main();
        });

        for (let i = 0; i < 12; i++) {
            players.forEach(p => {
                p.main.addCarte(this.pioche.shift());
            })
        }
        
        this.discard.push(this.pioche.shift());
        this.discard.push(null);
        
    }
    
    getDiscard() {
        return this.discard;
    }
    
    getPioche2Cards() {
        return [this.pioche[0], this.pioche[1]];
    }

    getSizePioche() {
        return this.pioche.length; 
    }

    getSizeDicard() {
        let size ;
        this.discard.forEach(d => {
            if(d !== null) {
                ++size;
            }
        });
        return this.discard.length;
    }
}

module.exports = Jeu;
