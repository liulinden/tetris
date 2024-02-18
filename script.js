//TODO: add move down way of getting score, add restart button, fix game end so that when pieces r rlly high up the pieces auto generate to be higher

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
let sboardX=0;
let sboardY=0;
let sboardWidth=0;
let sboardHeight=0;

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

let blockFallInterval = 60;
let shiftInterval = 6;
let fastFallInterval = 3;

let transformTimer=1;
let fallTimer=1;

let blocks = [];
let next = [];
let holdBlock = -1;
let textEffects = [];

let score = 0;
let lines =0;
let level = 1;
let gameOver = false;
let canHold = true;

let downArrow = false;
let upArrow = false;
let rightArrow= false;
let leftArrow= false;
let cKey = false;
let spaceKey=false;
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
let oldDrop = false;
let drop = false;
let previousHard=false;
let combo=0;

function gameloop() {
    level=1+Math.floor(lines/10);
    blockFallInterval=Math.max(1,60-5*level);
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
    if (drop){
        fallingBlock.drop()
        drop=false;
        fallTimer=1;
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
    oldDrop=spaceKey;

    if (transformTimer % shiftInterval==0){
        shift=0;
        if (leftArrow) shift-=1;
        if (rightArrow) shift+=1;
        fallingBlock.shiftHor(shift);
    }
    if (downArrow && fallTimer % fastFallInterval==0){
        if (fallingBlock.fall()) {
            score+=1
            fallTimer=1;
        }
    }

    if (fallTimer % blockFallInterval==0) {
        if (!fallingBlock.fall()) fallingBlock.placeBlock();
    }

    if (fallingBlock.atBottom()) fallingBlock.opacity=0.75+(Math.cos(fallTimer/blockFallInterval*2*Math.PI))/4
    else fallingBlock.opacity=1;

    for (let i=textEffects.length-1; i>=0;i--){
        if ((textEffects[i].update())<=0){
            textEffects.splice(i,1)
        }
    }

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
        case (' '):
            if (!oldDrop) drop=true;
            space=true;
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
        case (' '):
            spaceKey=false;
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
    sboardHeight=9*squareDim;
    sboardWidth=holdWidth;
    sboardX=holdX;
    sboardY=screenY+screenHeight-sboardHeight;
}

function drawFrame() {
    ctx.fillStyle='white';
    ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle='rgb(50,50,50)';
    ctx.fillRect(holdX,holdY,holdWidth,holdHeight);
    ctx.fillRect(nextX,nextY,nextWidth,nextHeight);
    ctx.fillStyle='black';
    ctx.fillRect(sboardX,sboardY,sboardWidth,sboardHeight);
    ctx.fillRect(screenX,screenY,screenWidth,screenHeight);
    drawGrid();
    ctx.fillStyle='white';
    ctx.font=String(Math.round(sboardHeight/10))+'px Berlin Sans FB';
    ctx.textAlign = "center";
    ctx.fillText("Score", sboardX+sboardWidth/2,sboardY+1*sboardHeight/6);
    ctx.fillText(score, sboardX+sboardWidth/2,sboardY+1.8*sboardHeight/6);
    ctx.fillText("Level", sboardX+sboardWidth/2,sboardY+2.8*sboardHeight/6);
    ctx.fillText(level, sboardX+sboardWidth/2,sboardY+3.6*sboardHeight/6);
    ctx.fillText("Lines", sboardX+sboardWidth/2,sboardY+4.6*sboardHeight/6);
    ctx.fillText(lines, sboardX+sboardWidth/2,sboardY+5.4*sboardHeight/6);
    for (let i=0;i<blocks.length;i++){
        blocks[i].drawBlock();
    }
    if (!gameOver) fallingBlock.drawBlock();

    drawNextPanel()
    if (holdBlock != -1){
        drawBlockCentered(holdBlock, 1, holdX + holdWidth/2, holdY+holdHeight/2)
    }

    for (let i=0;i<textEffects.length; i++){
        textEffects[i].draw();
    }
}

function remove(list, element){
    let i=list.indexOf(element);
    if (i!=-1){
        list.splice(i, 1)
    }
}
function drawGrid(){
    ctx.strokeStyle ='rgb(50,50,50)';
    ctx.lineWidth = Math.round(squareDim/20)
    for (let i=0;i<5;i++){
        ctx.strokeRect(screenX+i*2*squareDim,screenY,squareDim,screenHeight)
    }
    for (let i=0;i<10;i++){
        ctx.strokeRect(screenX,screenY+i*2*squareDim,screenWidth,squareDim)
    }
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
    for (let i=0; i<squares.length; i++){
        if (squares[i][1]>=0 && squares[i][1] < 20) drawSquare(blockColors[id], 1, x-centerx*squareDim, y-centery*squareDim, squares[i][0], squares[i][1]);
    }
}

function toOpacity(color,opacity){
    return 'rgba('+String(color[0])+','+String(color[1])+','+String(color[2])+','+String(opacity)+')';
}

function changeColor(color,dr,dg,db){
    return [Math.min(255,Math.max(0,color[0]+dr)),Math.min(255,Math.max(0,color[1]+dg)),Math.min(255,Math.max(0,color[2]+db))]
}

function drawSquare(color,opacity,refx, refy, x,y){
    wdth=Math.round(squareDim/40)*2;
    ctx.fillStyle=toOpacity(color,opacity);
    //ctx.fillRect(Math.floor(refx+x*squareDim),Math.floor(refy+y*squareDim),squareDim,squareDim);
    ctx.fillRect(Math.floor(refx+x*squareDim+wdth),Math.floor(refy+y*squareDim+wdth),squareDim-2*wdth,squareDim-2*wdth)
    ctx.fillStyle=toOpacity(changeColor(color,100,100,100),opacity);
    ctx.fillRect(Math.floor(refx+x*squareDim+wdth),Math.floor(refy+y*squareDim+wdth),squareDim-2*wdth,(squareDim-2*wdth)/3)
    ctx.lineWidth=wdth
    ctx.strokeStyle=toOpacity(changeColor(color,100,100,100),1)
    ctx.strokeRect(Math.floor(refx+x*squareDim+wdth),Math.floor(refy+y*squareDim+wdth),squareDim-2*wdth,squareDim-2*wdth);
    ctx.strokeStyle=toOpacity(changeColor(color,-100,-100,-100),opacity)
    ctx.strokeRect(Math.floor(refx+x*squareDim+2*wdth),Math.floor(refy+y*squareDim+2*wdth),squareDim-4*wdth,squareDim-4*wdth);
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

function givePoints(rowsCleared){ // adds points and returns # of points added
    if (rowsCleared>=1){
        combo++;
        let newPoints=50*(combo-1);
        let maintxt="";
        switch (rowsCleared) {
            case 1:
                maintxt="SINGLE";
                newPoints+=100;
                break;
            case 2:
                maintxt="DOUBLE";
                newPoints+=300;
                break;
            case 3:
                maintxt="TRIPLE";
                newPoints+=500;
                break;
            case 4:
                maintxt="TETRIS";
                newPoints+=800;
                if (previousHard) newPoints*=1.5;
                previousHard=true;
                break;
        }
        newPoints*=level;
        score+=newPoints;
        if (combo>=2){
            textEffects.push(new TextEffect("COMBO " + String(combo-1),0.9*squareDim,screenX+screenWidth/2,screenY+3/4*screenHeight-squareDim,squareDim/6))
        }
        textEffects.push(new TextEffect(maintxt,0.9*squareDim,screenX+screenWidth/2,screenY+3/4*screenHeight,squareDim/6))
        textEffects.push(new TextEffect("+" + String(newPoints),squareDim*2/3,screenX+screenWidth/2,screenY+3/4*screenHeight+0.8*squareDim,squareDim/6))
        return newPoints;
    }
    combo=0
    previousHard=false;
    return 0;
}

function getNext(){
    save = next[0];
    next[0]=next[1];
    next[1]=next[2];
    next[2]=Math.floor(Math.random()*7);
    return save;
}

class TextEffect {
    constructor(txt,size,x,y,spd){
        this.text=txt;
        this.x=x;
        this.y=y;
        this.speed=spd;
        this.count=40;
        this.size=size
    }

    update(){
        this.y-=Math.round(this.speed);
        this.speed*=0.95;
        this.count-=1;
        return this.count;
    }

    draw(){
        ctx.fillStyle='white';
        ctx.font=String(Math.round(this.size))+'px Berlin Sans FB';
        ctx.textAlign = "center";
        ctx.fillText(this.text, this.x,this.y);
    }
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

    drop(){
        while (!this.isOverlapping()){
            this.y++;
            score+=2
            for (let i=0;i<this.squares.length;i++){
                this.squares[i][1]++;
            }
        }
        this.y--;
        score-=2;
        for (let i=0;i<this.squares.length;i++){
            this.squares[i][1]--;
        }
        this.placeBlock();
    }

    placeBlock(){ // returns the number of 
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

        let count=0;
        for (let i=r1;i<=r2;i++){
            if (isRowComplete(i)){
                lines++;
                count++;
                for (let k=blocks.length-1;k>=0;k--){
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
        givePoints(count);
        return count;
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
        for (let i=this.squares.length-1; i>=0; i--){
            if (this.squares[i][1]==row) this.squares.splice(i,1);
            else if (this.squares[i][1]<row) this.squares[i][1]++;
        }
        if (this.squares.length==0) {
            remove(blocks,this)
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