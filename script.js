const canvas = document.getElementById('cvs')

const dpr = Math.ceil(window.devicePixelRatio || 1);
canvas.width=canvas.clientWidth*dpr;
canvas.height=canvas.clientHeight*dpr;

const ctx= canvas.getContext('2d')

ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

document.addEventListener("keydown", keyDown)
document.addEventListener("keyup", keyUp)

const margin=40;

let screenHeight=20*Math.floor(Math.min(canvas.height-2*margin, (canvas.width-2*margin)*2)/20);
let screenWidth=screenHeight/2;
let squareDim = screenHeight/20;
let screenX=margin+canvas.width/2-5*squareDim;
let screenY=margin;

const blockLayouts = [
    [[2,0],[2,1],[2,2],[2,3]], //line
    [[1,0],[2,0],[1,1],[1,2]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,0],[1,0],[1,1],[0,1]], //square
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[2,0],[1,1],[2,1],[1,2]]
];
const blockColors = [
    [0,255,255],
    [0,0,255],
    [255,122,0],
    [255,255,0]
    [0,255,0],
    [255,0,255],
    [255,0,0],
    `rgb(0,255,255)`,
    `rgb(0,0,255)`,
    `rgb(255,122,0)`,
    `rgb(255,255,0)`,
    `rgb(0,255,0)`,
    `rgb(255,0,255)`,
    `rgb(255,0,0)`
];
const blockDims = [
    [4,4],
    [3,3],
    [3,3],
    [2,2],
    [3,3],
    [3,3],
    [3,3]
]

let blockFallInteval = 60;
let shiftInterval = 6;
let fastFallInterval = 4; // must be a factor of blockFallInterval

let transformTimer=1;
let fallTimer=1;

let blocks = [];

let gameOver = false;   
let downArrow = false;
let upArrow = false;
let rightArrow= false;
let leftArrow= false;
let rotate = false;
let oldRotate = false;
let newLeft = false;
let newRight = false;
let newDown=false;
let oldLeft = false;
let oldRight= false;
let oldDown= false

function gameloop() {
    canvas.width=canvas.clientWidth*dpr;
    canvas.height=canvas.clientHeight*dpr;
    screenHeight=20*Math.floor(Math.min(canvas.height-2*margin, (canvas.width-2*margin)*2)/20);
    screenWidth=screenHeight/2;
    squareDim = screenHeight/20;
    screenX=margin+canvas.width/2-5*squareDim;
    screenY=margin;

    if (rotate){
        fallingBlock.rotateClockwise();
        rotate=false;
    }
    if (newDown){
        newDown=false;
        fallTimer=0;
    }
    if (newLeft || newRight){
        newLeft=false;
        newRight=false;
        transformTimer=0;
    }

    oldLeft=leftArrow;
    oldRight=rightArrow;
    oldRotate = upArrow;
    oldDown = downArrow;

    if (transformTimer % shiftInterval==0){
        shift=0;
        if (leftArrow) shift-=1;
        if (rightArrow) shift+=1;
        fallingBlock.shiftHor(shift);
    }
    if (downArrow && fallTimer % fastFallInterval==0){
        if (fallingBlock.fall()) fallTimer=1;
    }
    if (fallTimer % blockFallInteval==0) {
        if (!fallingBlock.fall()) fallingBlock.placeBlock();
    }

    if (fallingBlock.atBottom()) fallingBlock.opacity=0.75+(Math.cos(fallTimer/blockFallInteval*2*Math.PI))/4

    drawFrame()
    fallTimer++;
    transformTimer++;
    if (!gameOver) requestAnimationFrame(gameloop); else console.log("gameover");
}

function keyDown(event){
    switch (event.key) {
        case ('ArrowDown'):
            if (!oldDown) newDown=true;
            downArrow=true;
            break;
        case ('ArrowLeft'):
            if (!oldLeft) newLeft=true;
            leftArrow=true;
            break;
        case ('ArrowRight'):
            if (!oldRight) newRight=true;
            rightArrow=true;
            break;
        case ('ArrowUp'):
            if (!oldRotate) rotate=true;
            upArrow=true;
            break;
    }
}

function keyUp(event){
    switch (event.key) {
        case ('ArrowDown'):
            downArrow=false;
            break;
        case ('ArrowLeft'):
            leftArrow=false;
            break;
        case ('ArrowRight'):
            rightArrow=false;
            break;
        case ('ArrowUp'):
            upArrow=false;
            break;
    }
}

function drawFrame() {
    ctx.fillStyle='black';
    ctx.fillRect(screenX,screenY,screenWidth,screenHeight);
    for (let i=0;i<blocks.length;i++){
        blocks[i].drawBlock();
    }
    if (!gameOver) fallingBlock.drawBlock();
}

function toOpacity(color,opacity){
    return 'rgba('+String(color[0])+','+String(color[1])+','+String(color[2])+','+String(opacity)+')';
}

function drawSquare(color,opacity,x,y){
    ctx.fillStyle=toOpacity(color,opacity);//toOpacity(color,opacity);
    ctx.fillRect(screenX+x*squareDim,screenY+y*squareDim,squareDim,squareDim);
}

function isRowComplete(row){
    for (let i=0;i<10;i++){
        exists=false;
        for (let j=0;j<blocks.length;j++){
            sqs=blocks[j].squares;
            for (let k=0;k<sqs.length;k++){
                if (sqs[k][0]==i && sqs[k][1]==row) {
                    exists=true;
                    break;
                }
            }
            if (exists) break;
        }
        if (!exists) return false;
    }
    return true;
}

class Block {
    
    constructor(i){
        this.id=i;
        this.xDim=blockDims[this.id][0];
        this.yDim=blockDims[this.id][1];
        this.y=0;
        this.x=5-Math.ceil(blockDims[this.id][0]/2);
        this.squares=structuredClone(blockLayouts[this.id]);
        this.color=blockColors[this.id];
        this.opacity=1;

        for (let i=0; i<this.squares.length; i++){
            this.squares[i][1]=this.y+blockLayouts[this.id][i][1];
            this.squares[i][0]=this.x+blockLayouts[this.id][i][0];
        }
    }

    drawBlock(){
        for (let i=0; i<this.squares.length; i++){
            if (this.squares[i][1]>=0 && this.squares[i][1] < 20) drawSquare(this.color, this.opacity, this.squares[i][0], this.squares[i][1]);
        }
    }

    placeBlock(){
        blocks.push(this)
        fallTimer=1;

        let r1=this.squares[0][1];
        let r2=this.squares[0][1];
        for (let i=1;i<this.squares.length;i++){
            if (this.squares[i][1]<r1) r1=this.squares[i][1];
            if (this.squares[i][1]>r2) r2=this.squares[i][1];
        }

        for (let i=r1;i<=r2;i++){
            if (isRowComplete(i)){
                for (let k=0;k<blocks.length;k++){
                    blocks[k].eliminateRow(i);
                }
            }
        }

        for (let i=0;i<this.squares.length;i++){
            if (this.squares[i][1]<=0) gameOver=true;
        }
        fallingBlock= new Block(Math.floor(Math.random()*7));
        if (fallingBlock.isOverlapping()){
            gameOver=true;
        }
    }

    atBottom(){
        this.y++;
        for (let i=0;i<this.squares.length;i++){
            this.squares[i][1]++;
        }
        if (this.isOverlapping()){
            this.y--;
            for (let i=0;i<this.squares.length;i++){
                this.squares[i][1]--;
            }
            return true;
        }
        this.y--;
        for (let i=0;i<this.squares.length;i++){
            this.squares[i][1]--;
        }
        return false;
    }

    isOverlapping(){
        for (let j=0; j<this.squares.length;j++){
            if (this.squares[j][1]>=20 || this.squares[j][0]<0 || this.squares[j][0]>=10) return true
        }
        for (let i=0; i<blocks.length; i++){
            for (let j=0; j<this.squares.length;j++){
                let sqx=this.squares[j][0];
                let sqy=this.squares[j][1];
                for (let k=0; k<blocks[i].squares.length;k++){
                    if (blocks[i].squares[k][0]==sqx && blocks[i].squares[k][1]==sqy) return true;
                }
            }
        }
        return false;
    }

    fall(){
        this.y++;
        for (let i=0;i<this.squares.length;i++){
            this.squares[i][1]++;
        }
        if (this.isOverlapping()){
            this.y--;
            for (let i=0;i<this.squares.length;i++){
                this.squares[i][1]--;
            }
            return false;
        }
        return true;
    }

    shiftHor(shift){
        this.x+=shift;
        for (let i=0;i<this.squares.length;i++){
            this.squares[i][0]+=shift;
        }
        if (this.isOverlapping()){
            this.x-=shift;
            for (let i=0;i<this.squares.length;i++){
                this.squares[i][0]-=shift;
            }
            return false;
        }
        return true;
    }

    shiftVert(shift){
        this.y+=shift;
        for (let i=0;i<this.squares.length;i++){
            this.squares[i][1]+=shift;
        }
        if (this.isOverlapping()){
            this.y-=shift;
            for (let i=0;i<this.squares.length;i++){
                this.squares[i][1]-=shift;
            }
            return false;
        }
        return true;
    }

    shiftRowDown(row){
        for (let i=0; i<this.squares.length; i++){
            if (this.squares[i][1]==row) this.squares[i][1]++;
        }
    }

    eliminateRow(row){
        for (let i=0; i<this.squares.length; i++){
            if (this.squares[i][1]==row) this.squares[i][1]=20; // temporary fix, does not actually remove square, only moves it away
            else if (this.squares[i][1]<row) this.squares[i][1]++;
        }
        if (this.squares.length==0) {
            // remove block (this) from blocks array
        }
    }

    rotateCounterclockwise(){
        for (let i=0; i<this.squares.length; i++){
            let initx = this.squares[i][0];
            let inity = this.squares[i][1];
            this.squares[i][0]=this.x+this.xDim/2+(inity-this.y-this.yDim/2);
            this.squares[i][1]=this.y+this.yDim/2-(initx-this.x-this.xDim/2)-1;
        }
        if (this.isOverlapping()){
            if (this.shiftHor(1)) return true;
            if (this.shiftHor(-1)) return true;
            if (this.shiftVert(-1)) return true;
            this.rotateClockwise();
            return false;
        }
        return true;
    }

    rotateClockwise(){
        for (let i=0; i<this.squares.length; i++){
            let initx = this.squares[i][0];
            let inity = this.squares[i][1];
            this.squares[i][0]=this.x+this.xDim/2-(inity-this.y-this.yDim/2)-1;
            this.squares[i][1]=this.y+this.yDim/2+(initx-this.x-this.xDim/2);
        }
        if (this.isOverlapping()){
            if (this.shiftHor(1)) return true;
            if (this.shiftHor(-1)) return true;
            if (this.shiftHor(2)) return true;
            if (this.shiftHor(-2)) return true;
            if (this.shiftVert(-1)) return true;
            this.rotateCounterclockwise();
        }
    }
}

let fallingBlock= new Block(Math.floor(Math.random()*7));
gameloop();