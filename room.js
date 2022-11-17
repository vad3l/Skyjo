class Room {
    constructor(id, capacite) {
        this.id = id;
        this.placePrise = 0;
        this.placeMax = capacite;
        this.players = [];
        this.host = null;
    }

    getNbJoueur() {
        return this.joueurs.length;
    }

    newPlayer(player) {      
        this.players.push(player);
        this.placePrise++;
    }

    deletePlayer(playerDelete) {
        this.players = this.players.filter(p => p.username !== playerDelete.username)
        this.placePrise--;
    }

    getPlayers() {
        return this.players;
    }

    setHost(player) {
        this.host = player.username;
    }
}

module.exports = Room;