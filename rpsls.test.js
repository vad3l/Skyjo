// Assertions
const assert = require('assert').strict;

const chifoumi = require('./rpsls.js');

describe("Gestion des joueurs", function() {

    it("doit pouvoir ajouter un nouveau joueur", function() {
        assert.strictEqual(chifoumi.ajouter("fred"), true); 
        var score = JSON.parse(chifoumi.scoresJSON());
        assert.strictEqual(score.fred, 0);
    });
    
    it("doit pouvoir refuser un joueur existant", function() {
        assert.strictEqual(chifoumi.ajouter("fred"), false); 
        var score = JSON.parse(chifoumi.scoresJSON());
        assert.strictEqual(score.fred, 0);
    });

    it ("doit pouvoir supprimer un joueur existant", function() {
        var scores = JSON.parse(chifoumi.scoresJSON());
        assert.strictEqual(scores.fred, 0);
        chifoumi.supprimer("fred");
        scores = JSON.parse(chifoumi.scoresJSON());
        assert.strictEqual(scores.fred, undefined);
    });
    
});

describe("Gestion des défis", function() {
    
    it("doit détecter que le joueur qui initie le défi n'existe pas", function() {
        var res = chifoumi.defier("fred", "raph", "rock");
        assert.strictEqual(res.status, -1);
        assert.match(res.message, /fred/);
    });
    
    it("doit détecter que le joueur qui est la cible du défi n'existe pas", function() {
        chifoumi.ajouter("fred");
        var res = chifoumi.defier("fred", "raph", "rock");
        assert.strictEqual(res.status, -1);
        assert.match(res.message, /raph/);
    });

    it ("doit détecter que le choix du joueur n'est pas correct", function() {
        chifoumi.ajouter("raph");
        var res = chifoumi.defier("fred", "raph", "roc");
        assert.strictEqual(res.status, -1);
        assert.match(res.message, /roc(.)+incorrect/);
    });
    
    it("doit accepter un défi lancé pour la première fois", function() {
        var res = chifoumi.defier("fred", "raph", "rock");
        assert.strictEqual(res.status, 1);
        assert.match(res.message, /Défi lancé(.)+raph/);
    });
    
    it("doit refuser de défier un adversaire dont on attend la réponse", function() {
        var res = chifoumi.defier("fred", "raph", "scissors");
        assert.strictEqual(res.status, -2);
        assert.match(res.message, /défi(.)+déjà/);
    });
    
    it("doit accepter la réponse à un défi et déterminer le bon vainqueur", function() {
        var res = chifoumi.defier("raph", "fred", "scissors");
        assert.strictEqual(res.status, 0);
        assert.strictEqual(res.resultat.vainqueur, "fred");
        assert.strictEqual(res.resultat.perdant, "raph");
        assert.match(res.resultat.message, /:rock:/);
        assert.match(res.resultat.message, /:scissors:/);
        assert.match(res.resultat.message, /crushes/);
        var score = JSON.parse(chifoumi.scoresJSON());
        assert.strictEqual(score.fred, 1);
        assert.strictEqual(score.raph, 0);
    });

    it("doit accepter un nouveau défi une fois le premier terminé", function() {
        var res = chifoumi.defier("fred", "raph", "scissors");
        assert.strictEqual(res.status, 1);
    });
        
    it("doit détecter un match nul", function() {
        var res = chifoumi.defier("raph", "fred", "scissors");
        assert.strictEqual(res.status, 0);
        var scoreAvant = chifoumi.scoresJSON();
        assert.strictEqual(res.resultat.vainqueur, null);
        assert.strictEqual(res.resultat.perdant, null);
        assert.match(res.resultat.message, /égalité/);
        assert.strictEqual(chifoumi.scoresJSON(), scoreAvant);
    });
        
    it("doit supprimer les défis associés à un utilisateur supprimé", function() {
        chifoumi.ajouter("maman");
        var res = chifoumi.defier("raph", "maman", "scissors");
        assert.strictEqual(res.status, 1);
        chifoumi.supprimer("raph");
        var scores = JSON.parse(chifoumi.scoresJSON());
        assert.strictEqual(scores.raph, undefined);
        res = chifoumi.defier("raph", "fred", "rock");
        assert.strictEqual(res.status, -1);
        assert.match(res.message, /raph/);
        res = chifoumi.defier("fred", "raph", "rock");
        assert.strictEqual(res.status, -1);
        assert.match(res.message, /raph/);
    });
        
    it("doit refuser un défi lancé à soi-même", function() {
        var res = chifoumi.defier("fred", "fred", "rock");
        assert.strictEqual(res.status, -1);
        assert.match(res.message, /soi\-même/);
    });
    
    
});
