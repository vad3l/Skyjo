class Carte {
    constructor(value) {
        this.value = value;
        this.back = false;
        this.color = "";
    }

    setColor() {
        this.color = "blue";
    }
}

module.exports = Carte;
