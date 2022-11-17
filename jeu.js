const Carte = require("./carte.js")
class Jeu {
    constructor() {
        this.cartes = [];
        let carte;
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
        
    }
}

module.exports = Jeu;
