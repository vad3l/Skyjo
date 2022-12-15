/**
*  Classe représentant une carte
*/
class Carte {
    
    /**
	*  Consctructeur de la classe
	*  @param  value  int  valeur de la carte (entre -2 et 12)
	*/
    constructor(value) {
        this.value = value;
        this.back = true;
        this.color = "";
        this.choosed = false;
    }

    /**
	*  Definis la couleur de la carte
	*/
    setColor() {
        switch(this.value){
			case -2:
                this.color = "#2c2d8a";
                break;
			case -1:
                this.color = "#2c2d8a";
                break;
			case 0:
                this.color = "#5fc7ee";
                break;
			case 1:
                this.color = "#5daf2f";
                break;
			case 2:
                this.color = "#5daf2f";
                break;
			case 3:
                this.color = "#5daf2f";
                break;
			case 4:
                this.color = "#5daf2f";
                break;
			case 5:
                this.color = "#ffeb2a";
                break;
			case 6:
                this.color = "#ffeb2a";
                break;
			case 7:
                this.color = "#ffeb2a";
                break;
			case 8:
                this.color = "#ffeb2a";
                break;
			case 9:
                this.color = "#ff6855";
		        break;
			case 10:
                this.color = "#ff6855";
                break;
			case 11:
                this.color = "#ff6855";
                break;
			case 12:
                this.color = "#ff6855";
                break;
		}
    }

    /**
	*  Retourne une carte
	*/
    retourner() {
        this.back = false;    
    }

    /**
	*  cache une carte
	*/
    cacher() {
        this.back = true;    
    }
}

module.exports = Carte;
