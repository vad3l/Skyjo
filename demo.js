const { all } = require('proxy-addr');
const { Builder, until, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { assert } = require("sinon");

const players = ["Dorine Tabary", "Fréderic Dadeau", "Eric MERLET"];

var partie = true;
var screenWidth = 1920;
var screenHeight = 1080;

const chromeDriver = './chromedriver/chromedriver.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const service = new chrome.ServiceBuilder(chromeDriver);
const options = new chrome.Options();
options.setChromeBinaryPath(chromePath);

async function nomRalentit(element, nom) {
    for (let char of nom) {
        await element.sendKeys(char);
        await driver.sleep(150)
    }
}

const driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

async function connectionServer(PlayerName) {
    await driver.get('http://localhost:8080/');
    await driver.manage().window().setRect({ x: 0, y: 0, width: screenWidth, height: screenHeight });
    await driver.sleep(2000);
    await nomRalentit(driver.findElement({ id: 'pseudo' }), PlayerName);
    await driver.sleep(2000);
    await driver.findElement({ id: 'btnConnecter' }).click();
}

async function createRoom() {
    await driver.sleep(3000);
    await driver.findElement({ id: 'btnCreateRoom' }).click(); 
    await driver.sleep(3000);
}

async function joinRoom() {
    await driver.sleep(3000);
    const element = await driver.findElement(By.css("li"))
    await driver.actions({ bridge: true}).doubleClick(element).perform()
    await driver.sleep(3000);
}

async function startGame() {
    await driver.sleep(3000);
    await driver.findElement({ id: 'btnLancerPartie' }).click();
    await driver.sleep(3000);
}

async function newPlayerInRoom(playerName, connecte = true) {
    await driver.switchTo().newWindow('window');
    await connectionServer(playerName);
    if(connecte) {
        await joinRoom();
    }
    return await driver.getWindowHandle(); 
}

async function chooseCardPlateau(carteAlreadyReturn = null) {
    var all_card = await driver.findElements(By.css('tr > .card--back'));
    var card;
    do {
        card = all_card[Math.floor(Math.random() * all_card.length)];
    } while (card == carteAlreadyReturn);

    await card.click();
    return card;
}

async function choose2Cards() {
    var carteAlreadyReturn = await chooseCardPlateau();
    await driver.sleep(1000);
    await chooseCardPlateau(carteAlreadyReturn);
}

async function simulateMovement() {
    var choice  = Math.floor(Math.random() * 3);
    var pioche = await driver.findElement({ id: 'pioche' });
    var defausse = await driver.findElement({ id: 'defausse' });
    
    switch (choice) {
        case 0: // pioche -> plateau
            pioche.click();
            await driver.sleep(2500);
            chooseCardPlateau();
            break;
        case 1: // pioche -> defausse -> return carte 
            pioche.click();
            await driver.sleep(2500);
            defausse.click();
            await driver.sleep(2500);
            chooseCardPlateau();
            break;
        case 2: // defausse -> plateau
            defausse.click();
            await driver.sleep(2500);
            chooseCardPlateau();
            break;
    }
}

async function playTurn(windowsList, idCurrentWindow) {
    await driver.switchTo().window(idCurrentWindow);
    var all_card = await driver.findElements(By.css('tr > .card'));
    var all_card_back = await driver.findElements(By.css('tr > .card--back'));
    if (all_card_back.length == 0) {
        await driver.sleep(3000);
        await driver.findElement({ id: 'btnRelancerPartie' }).click();
        await driver.sleep(3000);
        partie = false;
        return null;
    }
    if (all_card_back.length == 12 && all_card.length == 12) {
        await choose2Cards();
    } else {
        await simulateMovement();
    }
    await driver.sleep(2500);
    return windowsList[(windowsList.indexOf(idCurrentWindow) + 1) % windowsList.length];

}

async function demo() {
    var fenetre1 = await driver.getWindowHandle();

    await connectionServer(players[0]);
    await createRoom();

    var fenetre2 = await newPlayerInRoom(players[1]);

    await driver.switchTo().window(fenetre1);
    await driver.manage().window().setRect({ x: 0, y: 0, width: screenWidth / 2-200, height: screenHeight });

    await driver.switchTo().window(fenetre2);
    await driver.manage().window().setRect({ x: (screenWidth / 2) - 200, y: 0, width: (screenWidth / 2 ) - 200, height: screenHeight });    

    await driver.switchTo().window(fenetre1);
    await driver.sleep(2500);
    await startGame(); 

    var windowsList = await driver.getAllWindowHandles();
    var idCurrentWindow = windowsList[0];
    while (partie) {
        idCurrentWindow = await playTurn(windowsList, idCurrentWindow);
    }
}

demo();