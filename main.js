class Main {
    constructor() {
        this.cartes = [];
    }

    addCarte(carte) {
        let size = this.cartes.length;
        switch (size) {
            case 0:
                this.cartes.push([]);
                this.cartes[0].push(carte)
                break;
            case 1:

                break;
            case 2:
            
                break;
            
        }
    }
}
module.exports = Main;