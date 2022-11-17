class Main {
    constructor() {
        this.cartes = [];
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
}
module.exports = Main;