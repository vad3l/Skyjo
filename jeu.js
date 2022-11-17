const Carte = require("./carte.js")
const Main = require("./main.js")

class Jeu {
    constructor() {
        this.cartes = [];
        var carte;
        for (let i = 0; i < 5; i++) {
            carte = new Carte(-2);
            carte.setColor();
            this.cartes.push(carte);   
        }
        for (let i = 0; i < 15; i++) {
            carte = new Carte(0);
            carte.setColor();
            this.cartes.push(carte)   
        }
        for (let i = -1; i <= 12; i++) {
            for (let j = 0; j < 10; j++) {
                carte = new Carte(i);
                carte.setColor();
                this.cartes.push(carte)      
            }
        }
    }

    shuffle() {
            
    }

    distribuer(players) {
        let nbPlayers = players.length;
        players.forEach(p => {
            p.main = new Main();
        });

        for (let i = 0; i < 12; i++) {
            players.forEach(p => {
                p.main.addCarte(this.cartes.shift());
            })
        }
        console.log(players)
        
    }


}

module.exports = Jeu;
