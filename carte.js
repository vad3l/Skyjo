class Carte {
    constructor(value) {
        this.value = value;
        this.back = true;
        this.color = "";
    }

    setColor() {
        this.color = "blue";
    }
}

module.exports = Carte;