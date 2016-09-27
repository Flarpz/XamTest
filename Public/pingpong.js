function startGame() {
    myGameArea.start();
    PlayerOneRed = new component(30, 130, "red", 20, 200);
    PlayerTwoBlue = new component(30, 130, "blue", 940, 200);
    TheBall = new component(20,20, 'black', 480, 230);
    TheBall.speedX = 2;
    console.log()
    //TheBall.riktning = [0,1,0,0]; // vänster, höger, upp, ner
    Top = new component(1000, 5, "black", 0, 0);
    Bottom = new component(1000, 5, "black", 0, 495);
    GameSpeed = 1;
    var increaseGameSpeed = setInterval(myTimer, 10000);
}

function myTimer(){

    //TheBall.speedX = TheBall.speedX + 2;
    console.log("timer " + GameSpeed);
}

var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.pressedKeys = [];
        this.canvas.width = 1000;
        this.canvas.height = 500    ;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(updateGameArea, 10);
        window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = false;
        })
    },

    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function component(width, height, color, x, y) {
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;
    this.update = function(){
        ctx = myGameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY;
    }
}

function ballMotion(){
    TheBall.speedX = 0;
    if(TheBall.riktning[1] == 1){
        TheBall.speedX = 3;
    }
    if(TheBall.riktning[0] == 1){
        TheBall.speedX = -3;
    }
}

function collisionTest(rect1,  rect2){
    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y){
        if(TheBall.riktning[1] == 1){
            TheBall.riktning[1] = 0;
            TheBall.riktning[0] = 1;
        }
        else{
            console.log('collision');
            TheBall.riktning[0] = 0;
            TheBall.riktning[1] = 1;
        }
    }
}

function collisonTest2(rect1, rect2) {
    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y) {
        return true;
    }
}

function reverseDirectionX(rect){
    if(rect.speedX > 0 ){
        rect.speedX = rect.speedX * -1;
        console.log(rect.speedX);
    }
    else{
        rect.speedX = rect.speedX * -1;
    }
}

function reverseAngel(rect){
    if(rect.speedY > 0){
        rect.speedY = rect.speedY *-1;
    }
    else{
        rect.speedY = rect.speedY *-1;
    }
}

function newDirection(rect1, rect2){  // rect2 ball
    if(collisonTest2(rect1, rect2)){
        var mid = rect2.y + rect2.height/2;
        console.log("collison detected");
        var interval = rect1.height/5;
        if(mid < (rect1.y + interval) && mid > rect1.y){  //rect2.x
            console.log("col i 8")
            reverseDirectionX(rect2);
            rect2.speedY = -2;
        }
        if(mid > (rect1.y +interval)  && mid < (rect1.y + interval*2)){
            console.log("col i 9")
            reverseDirectionX(rect2);
            rect2.speedY = -1;
        }
        if(mid > (rect1.y + interval*2) && mid < (rect1.y + interval*3)){
            console.log("col i 10")
            reverseDirectionX(rect2);
            rect2.speedY = 0;
        }
        if(mid > (rect1.y + interval*3) && mid < (rect1.y + interval*4)){
            console.log("col i 11")
            reverseDirectionX(rect2);
            rect2.speedY = 1;
        }
        if(mid > (rect1.y + interval*4) && mid < (rect1.y +interval*5)){
            console.log("col i 12")
            reverseDirectionX(rect2);
            rect2.speedY = 2;
        }
    }
}


function updateGameArea() {
    myGameArea.clear();
    PlayerOneRed.speedX = 0;
    PlayerOneRed.speedY = 0;
    PlayerTwoBlue.speedY = 0;
    PlayerTwoBlue.speedX = 0;
    if (myGameArea.keys && myGameArea.keys[38]) {PlayerTwoBlue.speedY = -3; }
    if (myGameArea.keys && myGameArea.keys[40]) {PlayerTwoBlue.speedY = 3; }
    if (myGameArea.keys && myGameArea.keys[87]) {PlayerOneRed.speedY = -3; }
    if (myGameArea.keys && myGameArea.keys[83]) {PlayerOneRed.speedY = 3; }

    //collisionTest(TheBall, PlayerOneRed);
    //collisionTest(TheBall, PlayerTwoBlue);
    //ballMotion();

    newDirection(PlayerOneRed, TheBall);
    newDirection(PlayerTwoBlue, TheBall);
    if(collisonTest2(Top, TheBall)){
        console.log("krock med top")
        reverseAngel(TheBall);
    }
    if(collisonTest2(Bottom, TheBall)){
        console.log("krock med bottom")
        reverseAngel(TheBall);
    }
    if((PlayerOneRed.y + PlayerOneRed.speedY) > 0 && (PlayerOneRed.y + PlayerOneRed.speedY) < 500-130 ){
        PlayerOneRed.newPos();
    }
    if((PlayerTwoBlue.y + PlayerTwoBlue.speedY) > 0 && (PlayerTwoBlue.y + PlayerTwoBlue.speedY) < 500-130 ){
        PlayerTwoBlue.newPos();
    }

    if(TheBall.x < 0 || TheBall.x > 1000){
        TheBall.x = 500;
        TheBall.speedX = 2;
        GameSpeed = 1;
    }

    TheBall.newPos();
    PlayerOneRed.update();
    PlayerTwoBlue.update();
    TheBall.update();
    Top.update();
    Bottom.update();
}