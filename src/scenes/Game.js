import { Scene } from 'phaser';

let doubleJump = false;

const WIDTH = 1024;
const HEIGHT = 768;

export class Game extends Scene {
    constructor() {
        super('Game');
        this.player = null;

        let player;
        let ground;
        let clouds;
        
    }

    preload() {
        // load assets
        this.load.spritesheet("dino","assets/dino-run.png", {frameWidth: 88, frameHeight: 94});
        this.load.image("ground", "assets/ground.png");
        this.load.image("cloud", "assets/cloud.png");
        this.load.image("gameover", "assets/game-over.png");
        this.load.image("restart", "assets/restart.png");
        this.load.image("dino-hurt", "assets/dino-hurt.png");
        this.load.spritesheet("dino-down","assets/dino-down.png", {frameWidth: 118, frameHeight: 56});
        this.load.spritesheet("obstacle-7", "assets/enemy-bird.png", {frameWidth: 34, frameHeight: 24});

        // load cactuses (different type)
        for (let i=0; i<6; i++) {
            const cactusNum = i+1;
            // console.log(`cactus${cactusNum}`)
            this.load.image(`obstacle-${cactusNum}`, `assets/cactuses_${cactusNum}.png`);
        }
    }

    create() {
        // initialize game
        this.player = this.physics.add.sprite(200, 300, "dino")
            .setDepth(1)
            .setOrigin(0)
            .setGravityY(2500)
            .setCollideWorldBounds(true)
            .setBodySize(44, 92);

        // Create an animation for the dino sprite
        this.anims.create({
            key: 'dino-run',
            frames: this.anims.generateFrameNumbers('dino', { start: 0, end: 3 }),
            frameRate: 30,
            repeat: -1 // Loop the animation indefinitely
        });

        this.playerDown = this.physics.add.sprite(200, 250, "dino-down")
            .setDepth(1)
            .setOrigin(1)
            .setGravityY(2500)
            .setCollideWorldBounds(true)
            .setBodySize(118, 56);


        // Create an animation for the dino-down sprite
        this.anims.create({
            key: 'dino-down',
            frames: this.anims.generateFrameNumbers('dino-down', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1 // Loop the animation indefinitely
        });
        

        // Play the animation
        this.player.play('dino-run');
        this.playerDown.play('dino-down');
        this.ground = this.add.tileSprite(0, 400, 1000, 30, "ground").setOrigin(0);

        // add ground collider
        this.groundCollider = this.physics.add.staticSprite(0,425, "ground").setOrigin(0);
        this.groundCollider.body.setSize(1000, 30);
        this.groundCollider.setVisible(false);  // hide the static ground 

        this.physics.add.collider(this.player, this.groundCollider);
        this.physics.add.collider(this.playerDown, this.groundCollider);

        this.clouds = this.add.group()
        this.clouds = this.clouds.addMultiple([
            this.add.image(300, 100, "cloud"),
            this.add.image(400, 120, "cloud"),
            this.add.image(550, 70, "cloud"),
            this.add.image(150, 70, "cloud"),
        ])

        this.gameSpeed = 5;

        this.obstacles = this.physics.add.group({
            allowGravity: false, //no gravity for cactuses
        })

        this.timer = 0; //timer for the game

        // create cursor obj
        this.cursors = this.input.keyboard.createCursorKeys();

        // add collider for player and obstacle
        this.physics.add.collider(this.obstacles, this.player, this.gameOver, null, this);
        this.physics.add.collider(this.obstacles, this.playerDown, this.gameOver, null, this);
        this.isGameRunning = true;

        this.gameOverText = this.add.image(-10, -20 , "gameover")
        this.restartText = this.add.image(0, -50, "restart").setInteractive();

        // Add score text at the right corner of the screen
        this.score = 0;
        this.scoreText = this.add.text(750, 20, this.score, {
            fontSize: '32px',
            fill: '#000000',
        }).setOrigin(1, 0);

        // Update score every second
        this.time.addEvent({
            delay: 40,
            callback: () => {
            if (this.isGameRunning) {
                this.score += 1;
                this.scoreText.setText(this.score.toString().padStart(7, '0'));
            }
            },
            loop: true,
        });
    }

    update(time, delta) {
        this.playerDown.setPosition(this.player.x + 90, this.player.y+92);
        // Play the animation only if the game is running
        this.events.on('update', () => {
            if (this.isGameRunning && !this.player.anims.isPlaying) {
            this.player.play('dino-run');
            this.playerDown.play('dino-down');
            } else if (this.isGameRunning && this.player.anims.isPlaying) {
            } else if (!this.isGameRunning && this.player.anims.isPlaying) {
            this.player.anims.stop();
            this.playerDown.anims.stop();
            }
        });

        // if isGameRunning = false, then exit the game
        // if not isGameRunning -> if not false -> if true
        if (!this.isGameRunning) {return;};
        this.restartText.on('pointerdown', () => {
            this.scene.start('Game');
        })

        // this extract the space and up key and assign to variables
        const {space, up} = this.cursors;
        //if (spacebar is pressed OR up arrow key is pressed) AND dino is on the ground
        if ((Phaser.Input.Keyboard.JustDown(space) || Phaser.Input.Keyboard.JustDown(up))
            && this.player.body.onFloor()){
            this.player.setVelocityY(-1000);    //make dino jump
        }

        // Check if the space key is being held down
        if (space.isDown && space.getDuration() > 250 && doubleJump == false) { // 500ms as the specific length of time
            this.player.setGravityY(1000); 
            this.player.setVelocityY(this.player.body.velocity.y - 100); // make dino jump
            doubleJump = true;
        }

        if (space.isUp) {
            this.player.setGravityY(3300); // reset gravity
        }

        if (this.player.body.onFloor()) {
            this.player.setGravityY(2500); // reset gravity
            doubleJump = false; // reset double jump
        }
        // Switch visibility of player and playerDown based on whether ctrl is being pressed    
        if (this.input.keyboard.addKey('CTRL').isDown) {
            this.player.setVisible(false);
            this.playerDown.setVisible(true);
            
            
        } else {
            this.player.setVisible(true);
            this.playerDown.setVisible(false); 
            
        }
        

        // To add cactus every second
        this.timer += delta;    //delta is in miliseconds
        if (this.timer > 1000) {    //1000ms = 1 sec
            //generate a number in range 1~6
            this.obstacleNum = Math.floor(Math.random() * 7) +1;
            this.obstacles.create(800,340, `obstacle-${this.obstacleNum}`).setOrigin(0);
            this.timer -= 1000; //reset timer
        }

        // to move cactus towards dino
        Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);

        //to destroy and remove the cactus when out of screen
        this.obstacles.getChildren().forEach(obstacle => {
            if(obstacle.getBounds().right < 0) {
                this.obstacles.remove(obstacle);
                obstacle.destroy();
            }
        })

        // game logic
        this.ground.tilePositionX += this.gameSpeed;

        
    }

    gameOver() {
        this.physics.pause();
        this.timer = 0;
        this.isGameRunning = false;
        this.gameOverText.setPosition(380, 200);
        this.restartText.setPosition(380, 260);
        this.player.setTexture('dino-hurt');
        this.playerDown.setVisible(false);
    }

}