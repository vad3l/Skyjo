const Carte = require("./carte.js")
const Main = require("./main.js")

/**
*  Classe représentant un jeu de carte
*/
class Jeu {

    /**
	*  Constructeur de la classe (150 cartes sont crées)
	*/
    constructor() {
        this.pioche = [];
        let carte;
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
    }

    /**
	*  Melanger la pioche
	*/
    shuffle() {
        for (let index = 0; index < 10000; index++) {
            let carte1 = Math.floor(Math.random() * this.pioche.length);
            let carte2 = Math.floor(Math.random() * this.pioche.length);
            let carte = this.pioche[carte1];
            this.pioche[carte1] = this.pioche[carte2]
            this.pioche[carte2] = carte;
        }
       //this.pioche.sort(() => Math.random() - 0.5);
    }

    /**
	*  1 - Distribue 12 cartes à chaque joueur
    *  2 - prend une carte de la pioche et la met sur la défausse
    *  3 - retourne la premier carte de la défausse
	*  @param  players   array Object  players qui vont recevoir leur cartes(12)
	*/
    distribute(players) {
        players.forEach(p => {
            p.main = new Main();
        });
        
        // distribue une carte à la fois à chaque joueurs
        for (let i = 0; i < 12; i++) {
            players.forEach(p => {
                let c= this.pioche.shift();
                p.main.addCarte(c);
            })
        }

        let carte = this.pioche.shift();
        carte.retourner();
        this.discard.push(carte);
    }
    
    /**
	*  Retourne la carte au dessus de la pioche
	*/
    selectedCardPioche() {
        this.pioche[0].retourner();
        this.pioche[0].choosed =true;
    }
    
    /**
	*  Retourne la carte au dessus de la défausse
	*/
    selectedCardDefausse() {
        this.discard[0].choosed = true;
    }
    
    /**
	*  Mettre la carte du dessus de la pioche sur le dessus de la défausse
	*/
    cardPiocheGoToDefausse() {
        let carte = this.pioche.shift();
        carte.choosed = false;
        this.discard.unshift(carte);
        if (this.getSizePioche() == 0) {
            this.putDefausseInPioche();
        }
    }

    /**
	*  Intervertir une carte du plateau avec soit :
    *   - la carte au dessus de la pioche
    *   - la carte au dessus de la défausse
	*/
    intervertirCarte(l, c, player, choice) {
        let carte = player.main.cartes[l][c];
        if(choice === "pioche") {
            player.main.cartes[l][c] = this.pioche.shift();
        }else {
            player.main.cartes[l][c] = this.discard.shift();
        }
        player.main.cartes[l][c].choosed = false;
        this.discard.unshift(carte);
        if (this.getSizePioche() == 0) {
            this.putDefausseInPioche();
        }
    }

    /**
	*  Met toutes les cartes de la défausse (sauf la première)
    *  dans la pioche en les mélangant et en les retournant
	*/
    putDefausseInPioche() {
        while (this.discard.length > 1) {
            this.discard[this.discard.length-1].cacher();
            this.pioche.push(this.discard.pop());
        }
        this.shuffle();
    }

    /**
	*  Retourne les deux première cartes de la pioche 
    *  @return Array les deux première cartes de la pioche 
	*/
    getPioche2Cards() {
        return [this.pioche[0], this.pioche[1]];
    }

    /**
	*  Retourne les deux première cartes de la défausse 
    *  @return Array les deux première cartes de la défausse 
	*/
    getDiscard2Cards() {
        return [this.discard[0], this.discard[1]];
    }
    
    /**
	*  Retourne la taille de la pioche
    *  @return int la taille de la pioche
	*/
    getSizePioche() {
        let size = 0;
        this.pioche.forEach(p => {
            if(p !== null) {
               ++size;
            }
        });

        return size; 
    }

    /**
	*  Retourne la taille de la défausse
    *  @return int la taille de la défausse
	*/
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
