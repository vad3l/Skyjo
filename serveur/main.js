/**
*  Classe représentant une main d'un joueur
*/
class Main {
    
    /**
	*  Constructeur de la classe
	*/
    constructor() {
        this.cartes = []; // sa main
        this.points = null; // points du joueur => valuer cartes retournées
    }

    /**
	*  Fonction qui ajoute une carte à la main d'un joueur
    *  @param carte Object respresentant la carte à ajoutée dans la main
	*/
    addCarte(carte) {
        let size = this.cartes.length;
        
        switch (size) {
            case 0:
                this.cartes.push(new Array());
                this.cartes[0].push(carte)
                break;
            case 1:
                this.cartes[0].push(carte);
                if(this.cartes[0].length === 4) {
                    this.cartes.push(new Array());
                }
                break;
            case 2:
                this.cartes[1].push(carte);
                if(this.cartes[1].length === 4) {
                    this.cartes.push(new Array());
                }
                break;
            case 3:
                this.cartes[2].push(carte);
                break;
        }
    }

    /**
	*  Calcul la valeur de toutes ses cartes retournées
	*/
    calculatePoints() {
        this.points = 0;
        this.cartes.forEach(e => {
            e.forEach(carte => {
                if(carte !== null && carte.back === false) {
                   this.points += carte.value;
                }
            });
        });

        return this.points;
    }

    /**
	* Verifie si dans la main il ya une colonne avec des cartes 
    * toutes retournées et de même valeur
    * @param discard Object reprensentant la défausse 
	*/
    verifierMain(discard) {
        for (let i = 0; i < 4; i++) {
            // si une des cartes de la colonne est null (pas de carte)
            if(this.cartes[0][i] === null || this.cartes[1][i] === null || this.cartes[2][i].value === null) {
                continue;
            }
            // si une des cartes de la colonne est retourner (impossible de faire une colonne)
            if(this.cartes[0][i].back || this.cartes[1][i].back || this.cartes[2][i].back) {
                continue;
            }
            if(this.cartes[0][i].value === this.cartes[1][i].value ) {
                if(this.cartes[1][i].value === this.cartes[2][i].value) {
                    console.log( "enlever carte "  + this.cartes[0][i].value , this.cartes[1][i].value ,this.cartes[2][i].value)
                    discard.unshift(this.cartes[0][i]);
                    discard.unshift(this.cartes[1][i]);
                    discard.unshift(this.cartes[2][i]);
                    this.cartes[0][i] = null;
                    this.cartes[1][i] = null;
                    this.cartes[2][i] = null;
                }
            }
        }
    }

    /**
	* Fonction qui compte le nombre de cartes retournéées dans sa main
    * @return int le nombre de cartes retournées
	*/
    getNbCartesRetourne() {
        let nb = 0;
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 4; ++j) {
                if(this.cartes[i][j] !== null && !this.cartes[i][j].back) {
                    nb++;
                }
            }
        }
        return nb;
    }

    /**
	* Fonction qui compte le nombre de cartes retournéées dans sa main
    * @return bool true si toutes les cartes de la main sont retournées, false sinon
	*/
    isAllReturn() {
        let bool = true;
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 4; ++j) {
                if(this.cartes[i][j] != null && this.cartes[i][j].back) {
                    bool = false;
                }    
            }
        }
        return bool;    
    }

    /**
	* Fonction qui retourne des cartes de la main d'un joueur
	*/
    majMain(cardsChange) {
        cardsChange.forEach(c => {
            if(this.cartes[c.ligne][c.colonne] != null) {
                this.cartes[c.ligne][c.colonne].retourner();
            }
        });
    }
    
    /**
	* Fonction qui retourne  toutes les cartes de la main d'un joueur
	*/
    returnAll() {
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 4; ++j) {
                if(this.cartes[i][j] != null) {
                    this.cartes[i][j].retourner();
                }    
            }
        }
    }
}
module.exports = Main;