class Main {
    constructor() {
        this.cartes = [];
        this.points = null;
    }

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

    verifierMain(discard) {
        //console.log(this.cartes)
        console.log("laaaaaaaaaaaaaaaaaaaaaaaaaaaa :" , discard)
        for (let i = 0; i < 4; i++) {
            if(this.cartes[0][i] === null || this.cartes[1][i] === null || this.cartes[2][i].value === null) {
                continue;
            }
            console.log("la,",this.cartes[0][i].value , this.cartes[1][i].value ,this.cartes[2][i].value);
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
            console.log("la,",this.cartes[0][i], this.cartes[1][i] ,this.cartes[2][i]);
        }
        console.log("apressssssssssss :" , discard)
    }

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

    majMain(cardsChange) {
        cardsChange.forEach(c => {
            //console.log("retourner", this.cartes[c.ligne][c.colonne])
            if(this.cartes[c.ligne][c.colonne] != null) {
                this.cartes[c.ligne][c.colonne].retourner();
            }
        });
    }
    
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