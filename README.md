# SKYJO University Web Project

This the SKYJO game in a Website !

## Install

```
git clone https://github.com/Vad3L/Skyjo.git
cd Skyjo
npm install
node .
```

## Usage

### Quick start

Open your favorite browser and type localhost:8080

After you just have to log you.<br>
[<img src="./public/img/login.png" width="250px"/>](./public/img/login.png)

Once logged you'r in the lobby, here you can create or join a party.<br>
[<img src="./public/img/lobby.png" width="500px"/>](./public/img/lobby.png)

After the game launch, you can see the beautiful game board and chat.<br>
[<img src="./public/img/gameBoard.png" width="400px"/>](./public/img/gameBoard.png)
[<img src="./public/img/chat.png" width="400px"/>](./public/img/chat.png)

### Additional Feature

#### Responsive
If you want to play on your smartphone you can to !<br>
[<img src="./public/img/responsive.png" width="300px"/>](./public/img/responsive.png)

#### Dark Theme
Your eye's is on fire front of a white screen ?
Don't worry a dark theme is here for you !

Just a little combo of two keys [CTRL+Y] and tou can change theme.<br>
[<img src="./public/img/darkTheme.png" width="500px"/>](./public/img/darkTheme.png)

#### Animation
For a dynamic game, small animations are available.

When you wait in the menu of a party there is a small svg that rotates to occupe you'r eyes.<br>
Or <br>
When the party start you have a little animation on the chat (BUZZZ).

#### Who Speak ?
To have an even more lively game.

There is a voice synthesizer that gives information to the players:<br>
+	The game starts.
+	The turn is over.
+	This is the last round.
+	It is the player's turn. 

And if your to slow the vocie synthesizer can insult you!

#### CSS GOD 
The beautiful cards are made in CSS

## Author 
Léo Vandrepol<br>
Anthony Gasca-Gimeno


### University tutor
Dorine Tabary

### Server config
#### Works on Ubuntu 20.04

`sudo apt update`

`sudo apt install build-essential libssl-dev`

`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash`

`nvm install node`

`nvm which node`

`nano /etc/systemd/system/skyjo.service`

```bash
[Unit]
Description=Skyjo Node App

[Service]
Type=simple
ExecStart=/root/.nvm/versions/node/v19.4.0/bin/node /root/Skyjo/
WorkingDirectory=/root/Skyjo/
Restart=always

[Install]
WantedBy=multi-user.target
```

`sudo systemctl daemon-reload`

`sudo systemctl enable skyjo`

`sudo service skyjo start`

`systemctl status skyjo.service`

`sudo apt-get install nginx screen
`
`sudo systemctl start nginx
sudo systemctl enable nginx`

`nano /etc/nginx/sites-available/skyjo`

```bash
server {
    listen 80;
    server_name localhost;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`sudo ln -s /etc/nginx/sites-available/skyjo /etc/nginx/sites-enabled/skyjo`

`sudo rm /etc/nginx/sites-enabled/default`

`sudo nginx -t`

`sudo systemctl restart nginx`
