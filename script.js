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

let screenHeight=0;
let screenWidth=0;
let squareDim = 0;
let holdWidth = 0;
let holdHeight = 0;
let nextWidth = 0;
let nextHeight = 0;
let screenX=0;
let screenY=0;
let holdX=0;
let holdY=0;
let nextX=0;
let nextY=0;

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
    [255,255,0],
    [0,255,0],
    [255,0,255],
    [255,0,0]
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
let next = [];
let holdBlock = -1;

let gameOver = false;
let canHold = true;

let downArrow = false;
let upArrow = false;
let rightArrow= false;
let leftArrow= false;
let cKey = false;
let rotate = false;
let oldRotate = false;
let newLeft = false;
let newRight = false;
let newDown=false;
let oldLeft = false;
let oldRight= false;
let oldDown= false;
let hold = false;
let oldHold = false;

function gameloop() {
    setDimensions();

    if (rotate){
        fallingBlock.rotateClockwise();
        rotate=false;
    }
    if (hold){
        if (canHold){
            if (holdBlock==-1) {
                holdBlock = fallingBlock.id;
                fallingBlock = new Block(getNext())
            } 
            else {
                let id = holdBlock;
                holdBlock = fallingBlock.id;
                fallingBlock = new Block(id);
            }
            canHold = false
        }
        hold=false;
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
    oldHold = cKey;

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
        case ('c'):
            if (!oldHold) hold=true;
            cKey=true;
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
        case ('c'):
            cKey=false;
            break;
    }
}

function setDimensions() {
    canvas.width=canvas.clientWidth*dpr;
    canvas.height=canvas.clientHeight*dpr;
    squareDim=Math.floor(Math.min((canvas.height-2*margin)/20, (canvas.width-4*margin)/20))
    screenHeight=20*squareDim;
    screenWidth=10*squareDim;
    holdWidth = 5 * squareDim;
    holdHeight = 3 * squareDim;
    nextWidth = holdWidth;
    nextHeight = 3 * holdHeight;
    screenX=canvas.width/2-5*squareDim;
    screenY=margin;
    holdX = screenX-margin-holdWidth;
    holdY=screenY;
    nextX = screenX+margin+screenWidth;
    nextY = screenY;
}

function drawFrame() {
    ctx.fillStyle='white';
    ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle='black';
    ctx.fillRect(holdX,holdY,holdWidth,holdHeight);
    ctx.fillRect(nextX,nextY,nextWidth,nextHeight);
    ctx.fillRect(screenX,screenY,screenWidth,screenHeight);
    for (let i=0;i<blocks.length;i++){
        blocks[i].drawBlock();
    }
    drawNextPanel()
    if (holdBlock != -1){
        drawBlockCentered(holdBlock, 1, holdX + holdWidth/2, holdY+holdHeight/2)
    }
    if (!gameOver) fallingBlock.drawBlock();
}

function drawNextPanel(){
    for (let i=0;i<next.length;i++){
        drawBlockCentered(next[i], 1, nextX + nextWidth/2, nextY+holdHeight*(i+0.5))
    }
}

function drawBlockCentered(id, rotation, x, y){
    let squares=structuredClone(blockLayouts[id]);
    let xDim=blockDims[id][0]
    let yDim = blockDims[id][1]
    for (i=0;i<rotation;i++){
        for (let i=0; i<squares.length; i++){
            let initx = squares[i][0];
            let inity = squares[i][1];
            squares[i][0]=xDim/2+(inity-yDim/2);
            squares[i][1]=yDim/2-(initx-xDim/2)-1;
        }
    }
    let highest=squares[0][1];
    let lowest=squares[0][1]
    let rightest=squares[0][0]
    let leftest=squares[0][0]
    for (let i=1; i<squares.length; i++){
        if (squares[i][0]>rightest) rightest=squares[i][0];
        if (squares[i][0]<leftest) leftest=squares[i][0];
        if (squares[i][1]>highest) highest=squares[i][1];
        if (squares[i][1]<lowest) lowest=squares[i][1];
    }
    let centerx=(leftest+rightest+1)/2;
    let centery=(highest+lowest+1)/2;
    console.log(lowest,highest,leftest,rightest,centerx,centery);
    for (let i=0; i<squares.length; i++){
        if (squares[i][1]>=0 && squares[i][1] < 20) drawSquare(blockColors[id], 1, x-centerx*squareDim, y-centery*squareDim, squares[i][0], squares[i][1]);
    }
}

function toOpacity(color,opacity){
    return 'rgba('+String(color[0])+','+String(color[1])+','+String(color[2])+','+String(opacity)+')';
}

function drawSquare(color,opacity,refx, refy, x,y){
    ctx.fillStyle=toOpacity(color,opacity);
    ctx.fillRect(Math.floor(refx+x*squareDim),Math.floor(refy+y*squareDim),squareDim,squareDim);
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

function getNext(){
    save = next[0];
    next[0]=next[1];
    next[1]=next[2];
    next[2]=Math.floor(Math.random()*7);
    return save;
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
            if (this.squares[i][1]>=0 && this.squares[i][1] < 20) drawSquare(this.color, this.opacity, screenX, screenY, this.squares[i][0], this.squares[i][1], 0, 0);
        }
    }

    placeBlock(){
        this.opacity=1;
        blocks.push(this);
        canHold = true;
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
        fallingBlock= new Block(getNext());
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

function startGame(){
    next=[]
    for (let i=0;i<3;i++){
        next.push(Math.floor(Math.random()*7))
    }
    fallingBlock= new Block(Math.floor(Math.random()*7));
    gameloop();
}

let fallingBlock= new Block(Math.floor(Math.random()*7));
startGame();