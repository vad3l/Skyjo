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
        this.cartes.forEach(e => {
            this.points = 0;
            e.forEach(carte => {
                if(carte !== null && carte.back === false) {
                   this.points += a.value;
                }
            });
        });
    }

    verifierMain() {
        //console.log(this.cartes);
        for (let i = 4; i < 4; i++) {
            console.log("carte",this.cartes[0][i].value , this.cartes[1][i].value ,this.cartes[2][i].value)
            if(this.cartes[0][i].value === this.cartes[1][i].value === this.cartes[2][i].value) {
                this.carte[0][i] = this.carte[1][i] = this.carte[2][i] = null;
            }
        }
        
    }

    getNbCartesRetourne() {
        let nb = 0;
        for (let i = 0; i < 4; ++i) {
            for (let j = 0; j < 3; ++j) {
                if(this.carte[i][j] !== null && !this.cartes[i][j].back) {
                    nb++;
                }
            }
        }
        return nb;
    }
}
module.exports = Main;