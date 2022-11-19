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
            if(i !== 0) {
                for (let j = 0; j < 10; j++) {
                    carte = new Carte(i);
                    carte.setColor();
                    this.pioche.push(carte)      
               }
            }
        }

        this.discard = [];
        this.carteTmp;
    }

    shuffle() {
       this.pioche.sort(() => Math.random() - 0.5);
    }

    distribute(players) {
        players.forEach(p => {
            p.main = new Main();
        });
        
        for (let i = 0; i < 12; i++) {
            players.forEach(p => {
                let c= this.pioche.shift();
				//console.log(c);
                p.main.addCarte(c);
            })
        }

        players.forEach(p => {
            //console.log(p.main);
            p.main.verifierMain(this.discard);
        });

        let carte = this.pioche.shift();
        carte.retourner();
        this.discard.push(carte);
        this.discard.push(null);
    }
    
    selectedCardPioche() {
        this.pioche[0].retourner();
        this.pioche[0].choosed =true;
    }
    
    selectedCardDefausse() {
        this.discard[0].choosed = true;
    }
    
    pickedPioche() {
        let carte = this.pioche.shift();
        carte.choosed = false;
        this.discard.unshift(carte);
    }

    intervertirCarte(l, c, player, choice) {
        let carte = player.main.cartes[l][c];
        if(choice === "pioche") {
            player.main.cartes[l][c] = this.jeu.shift()
        }else {
            player.main.cartes[l][c] = this.discard.shift()
        }
        player.main.cartes[l][c].choosed = false;
        this.discard.unshift(carte);
    }



    getDiscard2Cards() {
        return [this.discard[0], this.discard[1]];
    }
    
    getPioche2Cards() {
        return [this.pioche[0], this.pioche[1]];
    }

    getSizePioche() {
        let size = 0;
        this.pioche.forEach(p => {
            if(p !== null) {
               ++size;
            }
        });

        return size; 
    }

    getSizeDiscard() {
        let size =0;
        this.discard.forEach(d => {
            if(d !== null) {
                ++size;
            }
        });
        return size;
    }
}

module.exports = Jeu;
