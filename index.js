const canvas = document.querySelector('canvas');
const drawCanvas = canvas.getContext('2d');

function lerp (start, end, amt){
    return (1-amt)*start+amt*end;
}

class Lane {
    constructor(startX, endX){
        this.startX = startX;
        this.endX = endX;
        this.carX = startX + laneMargin;
    }
}

class Collider {
    constructor(x, y, width, height, prot = 6){
        this.x = x + prot;
        this.y = y + prot;
        this.width = width - prot * 2;
        this.height = height - prot * 2;
    }

    update(x,y){
        this.x = x;
        this.y = y;
    }

    collides(otherCollider){
        if (this.x < otherCollider.x + otherCollider.width &&
            this.x + this.width > otherCollider.x &&
            this.y < otherCollider.y + otherCollider.height &&
            this.y + this.height > otherCollider.y) {
             return true;
        }
        return false;
    }
}

class Player {
    constructor(y, width, height, color, currentLane){
        this.currentLane = currentLane;
        this.x = lanes[currentLane].carX;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.collider = new Collider(this.x, this.y, this.width, this.height);
        this.botEnabled = false;
    }

    move(direction){
        this.currentLane = Math.min(Math.max(this.currentLane + direction, 0), lanes.length - 1);
    }

    update(){
        var currentLane = lanes[this.currentLane];
        if(Math.abs(this.x - currentLane.carX) > carLerpAmnFinish){
            this.x = lerp(this.x, currentLane.carX, carLerpAmn);
        }
        else{
            this.x = currentLane.carX;
        }
        this.collider.update(this.x, this.y);

        if(this.botEnabled){
            this.bot(state.obstacles);
        }
    }

    bot(obstacles){
        var analyzedObstacle = undefined;

        if(obstacles[0].currentLane == this.currentLane){
            analyzedObstacle = obstacles[1];
        }
        else if(obstacles[1].currentLane == this.currentLane){
            analyzedObstacle = obstacles[0];
        }
        else {
            if(this.currentLane == 0){
                var obstacle = obstacles.find(o => o.currentLane == 1);
                if(!obstacle){
                    this.currentLane = 1;
                }
            }
            else if(this.currentLane == 3){
                var obstacle = obstacles.find(o => o.currentLane == 2);
                if(!obstacle){
                    this.currentLane = 2;
                }
            }
            return;
        }

        if(this.currentLane == 2 && (analyzedObstacle.currentLane == 3 || analyzedObstacle.currentLane == 0)){
            this.currentLane = 1;
        }        
        else if(this.currentLane == 2 && analyzedObstacle.currentLane == 1){
            this.currentLane = 3;
        }              
        else if(this.currentLane == 1 && (analyzedObstacle.currentLane == 3 || analyzedObstacle.currentLane == 0)){
            this.currentLane = 2;
        }      
        else if(this.currentLane == 1 && analyzedObstacle.currentLane == 2){
            this.currentLane = 0;
        }      
        else if(this.currentLane == 0 && analyzedObstacle.currentLane != 1){
            this.currentLane = 1;
        }      
        else if(this.currentLane == 3 && analyzedObstacle.currentLane != 2){
            this.currentLane = 2;
        }    
        else if(this.currentLane == 0 && analyzedObstacle.currentLane == 1){
            var c = this.y - analyzedObstacle.y + carLength;
            console.log(`0 - y: ${this.y} ; oy: ${analyzedObstacle.y} ; dc: ${c}`)
            if(c < 0 || c > carLength + 15){
                this.currentLane = 1;
            }
        }      
        else if(this.currentLane == 3 && analyzedObstacle.currentLane == 2){
            var c = this.y - analyzedObstacle.y + carLength;
            console.log(`0 - y: ${this.y} ; oy: ${analyzedObstacle.y} ; dc: ${c}`)
            if(c > 0 || c > carLength + 15){
                this.currentLane = 2;
            }
        }
    }

    draw(){
        this.drawLights();
        drawCanvas.beginPath();        
        drawCanvas.save();
        drawCanvas.translate(this.x, this.y);
        drawCanvas.rotate(Math.PI);
        drawCanvas.shadowBlur = 10;
        drawCanvas.shadowColor = "black";
        drawCanvas.drawImage(carImg, -this.width, -this.height, this.width, this.height)
        drawCanvas.restore();
        drawCanvas.drawImage(logo, this.x + 10, this.y + 40, this.width - 20, this.width - 20);
    }

    drawLights(){
        drawCanvas.shadowColor = "#ffff99";
        drawCanvas.shadowOffsetY = -75;
        drawCanvas.shadowBlur = 50;
        drawCanvas.fillStyle = "white"
        drawCanvas.fillRect(this.x + 7, this.y + 10, this.width - 14, this.height - 15);
        drawCanvas.shadowOffsetY = 0;
        drawCanvas.shadowBlur = 0;
    }
}

class CarObstacle {
    constructor(lane, width, height, color){
        this.currentLane = lane;
        this.x = lanes[lane].carX;
        this.y = -125 - Math.random() * 200;
        this.width = width;
        this.height = height;
        this.color = color;
        this.velocity = Math.random() * (Math.random() > 0.5 ? -1 : 1);
        this.collider = new Collider(this.x, this.y, this.width, this.height);
    }

    reset(currentVelocity, otherObstacle){
        this.y = -200 + (Math.random() * 75 * (Math.random() > 0.5 ? -1 : 1));
        this.velocity = currentVelocity * 0.125 * (Math.random() > 0.5 ? -1 : 1) + (Math.random() * currentVelocity * 0.3);

        this.currentLane = Math.floor(Math.random() * 400) %  4;

        var otherObstacleXDiff = Math.abs(this.y - otherObstacle.y);

        if(otherObstacleXDiff < 150)
        {
            while(this.currentLane == otherObstacle.currentLane){        
                this.currentLane = Math.floor(Math.random() * 400) %  4;
            }
        }
    }

    update(velocity, otherObstacle){        
        if(this.y > (canvas.height + carLength)){
            this.reset(velocity, otherObstacle);
        }
        
        this.y += velocity + this.velocity * interval / 1000;
        var currentLane = lanes[this.currentLane];
        if(Math.abs(this.x - currentLane.carX) > carLerpAmnFinish){
            this.x = lerp(this.x, currentLane.carX, carLerpAmn * (velocity / 8));
        }
        else{
            this.x = currentLane.carX;
        }

        this.collider.update(this.x, this.y);
    }

    draw(){
        this.drawLights();        
        drawCanvas.save();
        drawCanvas.filter = "sepia(0.75)"
        drawCanvas.translate(this.x, this.y);
        drawCanvas.rotate(Math.PI);
        drawCanvas.shadowBlur = 10;
        drawCanvas.shadowColor = "black";
        drawCanvas.drawImage(this.color, -this.width, -this.height, this.width, this.height)
        drawCanvas.filter = "none"
        drawCanvas.restore();
    }
    
    drawLights(){
        drawCanvas.shadowColor = "#f8f8f8";
        drawCanvas.shadowOffsetY = -75;
        drawCanvas.shadowBlur = 50;
        drawCanvas.fillStyle = "white"
        drawCanvas.fillRect(this.x + 7, this.y + 10, this.width - 14, this.height - 15);
        drawCanvas.shadowOffsetY = 0;
        drawCanvas.shadowBlur = 0;
    }
}

class Color {
    constructor(r,g,b){
        this.r = r;
        this.g = g;
        this.b = b;
    }

    lerpTo(color,lerpam){
        return new Color(lerp(this.r, color.r, lerpam),lerp(this.g, color.g, lerpam),lerp(this.b, color.b, lerpam))
    }

    asColor(){
        return `rgb(${this.r},${this.g},${this.b}, 1)`;
    }
}

class Background {
    constructor(){
        this.backgroundScoreBreaks = [75, 175, 325, 550, 775];
        this.blurColors = [new Color(125,253,254),new Color(255,20,147),new Color(127,255,0),new Color(138,43,226)]
        this.backgroundScoreAlphaSwitchFrames = 120.0;
        this.reset();
    }

    reset(){
        this.currentBackground = 0;
        this.backgroundScoreAlphaSwitchCurrentFrames = 0;
        this.alphaMix = 0.0;
        this.switch = false;
        this.final = false;
        this.blur = 0;
        this.blurIndex = 0;
        this.blurScoreBreak = 75;
        this.lastBlurScore = 0;
        this.currentBlurColor = new Color(0,0,0);
        this.currentTargetColor = this.blurColors[0];
    }

    update(score){       
        if(this.switch){
            if(this.backgroundScoreAlphaSwitchCurrentFrames == this.backgroundScoreAlphaSwitchFrames){
                this.alphaMix = 0;
                this.backgroundScoreAlphaSwitchCurrentFrames = 0;
                this.switch = false;
                this.currentBackground++;
                this.lastBlurScore = score;
            }
            else{
                this.alphaMix = this.backgroundScoreAlphaSwitchCurrentFrames / this.backgroundScoreAlphaSwitchFrames;
                this.backgroundScoreAlphaSwitchCurrentFrames++;
            }
        } 

        if(this.currentBackground == backgrounds.length - 1){
            this.alphaMix = 1;

            if(this.blur < 50){
                this.blur += interval * 6 / 1000;
            }

            if(score - this.blurScoreBreak > this.lastBlurScore){
                this.lastBlurScore = score;
                this.blurIndex = (this.blurIndex + 1) % this.blurColors.length;
                this.blurScoreBreak *= 1.15;
                this.currentTargetColor = this.blurColors[this.blurIndex];
            }

            this.currentBlurColor = this.currentBlurColor.lerpTo(this.currentTargetColor, 0.025);

            this.final = true;
            return;
        }
        
        if(score > this.backgroundScoreBreaks[this.currentBackground]){
            this.switch = true;
        }
    }

    draw(y){
        drawCanvas.globalAlpha = 1;
        drawCanvas.drawImage(backgrounds[this.currentBackground], 0, y, 512, 512)
        drawCanvas.drawImage(backgrounds[this.currentBackground], 0, y - 512, 512, 512)
        drawCanvas.globalAlpha = this.alphaMix;
        if(this.currentBackground < backgrounds.length - 1){
            drawCanvas.drawImage(backgrounds[this.currentBackground + 1], 0, y, 512, 512)
            drawCanvas.drawImage(backgrounds[this.currentBackground + 1], 0, y - 512, 512, 512)       
        }
        else {
            this.drawLine(106,0,12,512);
            this.drawLine(395,0,12,512);
            this.drawLine(183,0,6,512);
            this.drawLine(253,0,6,512);
            this.drawLine(323,0,6,512);
        }
        drawCanvas.globalAlpha = 1;     
    }

    drawLine(x,y,width,height){
        if(this.final){
            drawCanvas.shadowBlur = this.blur;
            drawCanvas.shadowColor = this.currentBlurColor.asColor();
        }
        drawCanvas.fillStyle = "white"
        drawCanvas.fillRect(x,y,width,height);
        drawCanvas.shadowBlur = 0;
    }
}

class GameState{
    constructor(velocity){
        this.y = 0;
        this.score = 0;
        this.highscore = 0;
        this.velocity = velocity;
        this.player = new Player(canvas.height - carLength - laneMargin, carWidth, carLength, 'blue', 1);
        this.obstacles = [
            new CarObstacle(0, carWidth, carLength, carImg),
            new CarObstacle(2, carWidth, carLength, obstacleCarImg)
        ];
        this.gameOver = true;
        this._t = 0;
        this._cheatDetected = false;
    }

    reset(velocity){
        this.score = 0;
        this._t = 0;
        this.velocity = velocity;
        this.player = new Player(canvas.height - carLength - laneMargin, carWidth, carLength, 'blue', 1);
        this.obstacles = [
            new CarObstacle(0, carWidth, carLength, carImg),
            new CarObstacle(2, carWidth, carLength, obstacleCarImg)
        ];
        this.gameOver = false;
        this._cheatDetected = false;
        backgroundC.reset();
        backgroundTrack.currentTime = 0;
        backgroundTrack.play();
    }

    update(){
        if(this.gameOver){
            return;
        }
        if(canvas.width > 512){
            canvas.width = 512;
        }

        if(canvas.height > 512){
            canvas.height = 512;
        }
        
        this.score += this.velocity * interval / 1000 * 3;
        this.velocity += velocityIncrease * interval / 1000;
        this.y += this.velocity;
        this.y %= 513;

        this.obstacles[0].update(this.velocity, this.obstacles[1]);
        this.obstacles[1].update(this.velocity, this.obstacles[0]);

        this.obstacles.forEach(element => {
            if(this.player.collider.collides(element.collider)){
                if(Math.floor(this.score / this.velocity / this._t) > 0){
                    this._cheatDetected = true;
                }
                if(this.highscore < this.score){
                    if(!this._cheatDetected){
                        this.highscore = this.score;
                    }
                }
                this.gameOver = true;
                backgroundTrack.pause();
            }
        });

        this._t += interval;
        this.player.update();
        backgroundC.update(this.score);
    }

    draw(){
        if(backgroundC.currentBackground < backgrounds.length - 2){
            drawCanvas.filter = `sepia(${1 - backgroundC.currentBackground / backgrounds.length})`
        }
        backgroundC.draw(this.y);
        drawCanvas.filter = "none"
        this.player.draw(); 
        this.obstacles.forEach(element => element.draw());
        if(!this.gameOver){
            this.drawBoard();
        }
        else{
            this.drawHighscores();
        }
    }

    drawHighscores(){
        drawCanvas.globalAlpha = 0.9;
        drawCanvas.fillStyle = 'white'
        drawCanvas.fillRect(0,0, 512, 512);
        drawCanvas.globalAlpha = 1;
        drawCanvas.textAlign = "center";
        drawCanvas.fillStyle = 'black'
        drawCanvas.font = "18px PressStart";
        var s = "start";
        if(this._cheatDetected){
            drawCanvas.fillText("CHEATER!", 256, 75);
        }
        else if(this.highscore > 0){
            drawCanvas.fillText("Highscore:" + this.highscore.toFixed(0), 256, 75);
        } 
        if(this.score > 0){
            drawCanvas.textAlign = "center";
            drawCanvas.fillStyle = 'black'
            drawCanvas.font = "20px PressStart";
            drawCanvas.fillText("Score:" + this.score.toFixed(0), 256, 110);
            drawCanvas.textAlign = "center";
            drawCanvas.fillStyle = 'black'
            drawCanvas.font = "32px PressStart";
            drawCanvas.fillText("Game Over!", 256, 266);
            if(this.player.botEnabled){
                drawCanvas.fillText("BOTTED!", 256, 320);
            }
            s = "restart"
        }
        drawCanvas.textAlign = "center";
        drawCanvas.fillStyle = 'black'
        drawCanvas.globalAlpha = 1;
        drawCanvas.font = "12px PressStart";
        drawCanvas.fillText("For Mobile press here to " + s, 256, 176);
        drawCanvas.fillText("Press SPACE to " + s, 256, 450);
        drawCanvas.fillText("Hit left arrow key to go left", 256, 470);
        drawCanvas.fillText("Hit right arrow key to go right", 256, 490);
    }

    drawBoard(){
        drawCanvas.globalAlpha = 0.7;
        drawCanvas.fillStyle = 'white'
        drawCanvas.fillRect(0,0, sides + 15, 65); //19
        drawCanvas.globalAlpha = 1;
        drawCanvas.fillStyle = 'black'
        drawCanvas.textAlign = "start";
        drawCanvas.font = "11px PressStart";
        drawCanvas.fillText("Score:" + this.score.toFixed(0), 8, 26);
        drawCanvas.fillText("km/h:" + (this.velocity * 5).toFixed(0), 8, 51);
    }
}

let fps = 60;

canvas.width = 512;
canvas.height = 512;
const carLerpAmn = 0.225;
const carLerpAmnFinish = 3;
const sides = 116;
const carLength = 80;
const laneWidth = 70;
const laneMargin = 13;
const carWidth = laneWidth - laneMargin * 2;
let interval = 1000 / fps;
const velocityStart = 3.5;
const velocityIncrease = 0.275;

const carImg = new Image();
carImg.src = "./assets/car.png";
const obstacleCarImg = new Image();
obstacleCarImg.src = "./assets/obstacleCar.png";

const backgrounds = [];
for(var i = 1; i < 7; i++){
    var background = new Image();
    background.src = "./assets/background"+i+".png";
    backgrounds.push(background)
}

const logo = new Image();
logo.src = "./assets/defaultLogo.png";

const backgroundTrack = new Audio("./assets/music.mp3");
backgroundTrack.volume = 0.1;

const backgroundC = new Background();

let _i = setInterval(game, interval);

const lanes = [
    new Lane(sides, sides + laneWidth),
    new Lane(sides + laneWidth, sides + laneWidth * 2),
    new Lane(sides + laneWidth * 2, sides + laneWidth * 3),
    new Lane(sides + laneWidth * 3, sides + laneWidth * 4)
]

const state = new GameState(velocityStart);

function game(){
    state.update();
    state.draw();
}

function keyDown(evt){
    switch(evt.keyCode) {
        case 37:
            state.player.move(-1);
            break;
        case 39:
            state.player.move(1);
            break;
        case 80:
            state.player.botEnabled = true;
            break;
        case 32:
            if(state.gameOver){
                state.reset(velocityStart);
            }
            break;
    }
}

function touchDown(evt){
    var touch = evt.targetTouches[0];
    var x = touch.clientX - touch.target.offsetLeft;
    var y = touch.clientY - touch.target.offsetTop;
    if(state.gameOver){
        if(y > (-230) && y < (-170)){
            state.reset(velocityStart);
        }
        return;
    }

    if(x < 0){
        state.player.move(-1);
    }
    else{
        state.player.move(1);
    }
}

window.addEventListener('keydown', keyDown)
canvas.addEventListener("touchstart", touchDown, false)
