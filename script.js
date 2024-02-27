//TODO: add better left/right key with initial delay

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
let shakeY=0;
let shakeTimer=-1;
let shakeStrength=5;

const blockLayouts = [
    [[0,1],[1,1],[2,1],[3,1]], //line
    [[0,0],[0,1],[1,1],[2,1]], //flipped L
    [[0,1],[1,1],[2,1],[2,0]], //L
    [[0,0],[1,0],[1,1],[0,1]], //square
    [[1,0],[2,0],[0,1],[1,1]], //S
    [[1,0],[0,1],[1,1],[2,1]], //T
    [[0,0],[1,0],[1,1],[2,1]] //flipped S
];
const blockColors = [
    [30,220,220],
    [30,30,220],
    [220,110,30],
    [220,220,30],
    [30,220,30],
    [220,30,220],
    [220,30,30]
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

let blockBag = [0,1,2,3,4,5,6]
let blocks = [];
let next = [];
let holdBlock = -1;
let textEffects = [];

let fallingBlock;
let score = 0;
let lines =0;
let level = 1;
let gameOver = false;
let canHold = true;
let lockDelayTimer = 0;
let lockResetCounter = 0;
const lockDelayTime = 30; // half a second
const lockResetCap = 15;
let disappearingTimer = 0;

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
    if (level<12) blockFallInterval=65-level*5;
    else if (level==12) blockFallInterval= 7;
    else if (level<15) blockFallInterval=6;
    else if (level<17) blockFallInterval=5;
    else if (level<20) blockFallInterval=4;
    else if (level<24) blockFallInterval=3;
    else if (level<29) blockFallInterval=2;
    else blockFallInterval=1;
    shakeStuff();
    setDimensions();

    if (disappearingTimer>0){
        disappearingTimer--;
    } else {

        let moved=false;

        if (rotate){
            if (fallingBlock.rotateClockwise()) moved=true;
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
                lockDelayTimer=0;
                lockResetCounter=0;
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
            if (shift!=0 && fallingBlock.shiftHor(shift)) moved=true;
        }
        if (downArrow && fallTimer % fastFallInterval==0){
            if (fallingBlock.fall()) {
                score+=1
                fallTimer=1;
                moved=true;
            }
        }

        if (fallTimer % blockFallInterval==0) {
            fallingBlock.fall()
        }
        if (fallingBlock.atBottom()) {
            if (moved && lockResetCounter<lockResetCap){
                lockDelayTimer=0;
                lockResetCounter++;
            }
            fallingBlock.opacity=0.75+(Math.cos(fallTimer/6))/4
            lockDelayTimer++;
            if (lockDelayTimer>lockDelayTime){
                fallingBlock.placeBlock();
                lockDelayTimer=0;
                lockResetCounter=0;
            }
        }
        else {
            fallingBlock.opacity=1;
            if (lockResetCounter<lockResetCap) lockDelayTimer=0;
        }
        fallTimer++;
        transformTimer++;
    }

    for (let i=textEffects.length-1; i>=0;i--){
        if ((textEffects[i].update())<=0){
            textEffects.splice(i,1)
        }
    }

    drawFrame()
    if (!gameOver) requestAnimationFrame(gameloop); 
    else {
        textEffects.push(new TextEffect("GAME OVER",squareDim*1.5,screenX+screenWidth/2,screenY+screenHeight*0.95,squareDim*0.67))
        textEffects.push(new TextEffect("space to play again",squareDim*0.8,screenX+screenWidth/2,screenY+screenHeight,squareDim*0.67))
        requestAnimationFrame(gameOverScreen)
    }
}

function gameOverScreen(){
    for (let i=textEffects.length-1; i>=0;i--){
        textEffects[i].update();
    }
    shakeStuff()
    setDimensions()
    drawFrame()
    if (gameOver) requestAnimationFrame(gameOverScreen);
}

function keyDown(event){
    if (gameOver) {
        if (event.key==" ")
        {
            resetGame();
            startGame();
        }
    }
    else{
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
                spaceKey=true;
                break;
        }
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

function resetGame() {
    blockFallInterval = 60;
    shiftInterval = 6;
    fastFallInterval = 2;

    transformTimer=1;
    fallTimer=1;

    blockBag=[0,1,2,3,4,5,6];
    blocks = [];
    next = [];
    holdBlock = -1;
    textEffects = [];

    score = 0;
    lines =0;
    level = 1;
    gameOver = false;
    canHold = true;
    lockDelayTimer = 0;
    lockResetCounter = 0;
    disappearingTimer = 0;
}

function setDimensions() {
    canvas.width=canvas.clientWidth*dpr;
    canvas.height=canvas.clientHeight*dpr;
    squareDim=Math.floor(Math.min((canvas.height-2*margin)/20, (canvas.width-4*margin)/22))
    screenHeight=20*squareDim;
    screenWidth=10*squareDim;
    holdWidth = 6 * squareDim;
    holdHeight = 5 * squareDim;
    nextWidth = holdWidth;
    nextHeight = 11 * squareDim;
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
    screenY+=shakeY;
}

function drawFrame() {
    ctx.fillStyle='black';
    ctx.fillRect(0,0,canvas.width,canvas.height)
    
    ctx.strokeStyle='white';
    ctx.fillStyle='rgb(50,50,50)';
    ctx.lineWidth=squareDim/6;
    ctx.strokeRect(holdX,holdY,holdWidth,holdHeight);
    ctx.strokeRect(nextX,nextY,nextWidth,nextHeight);
    ctx.strokeRect(sboardX,sboardY,sboardWidth,sboardHeight);
    ctx.strokeRect(screenX,screenY,screenWidth,screenHeight);
    ctx.fillRect(holdX,holdY,holdWidth,holdHeight);
    ctx.fillRect(nextX,nextY,nextWidth,nextHeight);
    ctx.fillRect(sboardX,sboardY,sboardWidth,sboardHeight);
    ctx.fillStyle='black'
    ctx.fillRect(screenX,screenY,screenWidth,screenHeight);
    ctx.fillRect(holdX+holdWidth/12,holdY+1.1*holdHeight*3/10, sboardWidth*5/6,squareDim*3)
    ctx.fillRect(nextX+holdWidth/12,nextY+1.1*nextHeight*3/22, nextWidth*5/6,squareDim*9)
    ctx.fillRect(sboardX+sboardWidth/12,sboardY+1.2*sboardHeight/6,sboardWidth*5/6,squareDim*1.2)
    ctx.fillRect(sboardX+sboardWidth/12,sboardY+3*sboardHeight/6,sboardWidth*5/6,squareDim*1.2)
    ctx.fillRect(sboardX+sboardWidth/12,sboardY+4.8*sboardHeight/6,sboardWidth*5/6,squareDim*1.2)
    drawGrid();
    ctx.fillStyle='white';
    ctx.font=String(Math.round(sboardHeight/10))+'px Berlin Sans FB';
    ctx.textAlign = "center";
    ctx.fillText("HOLD", holdX+holdWidth/2,holdY+0.81*holdHeight*3/10);
    ctx.fillText("NEXT", nextX+nextWidth/2,nextY+0.81*nextHeight*3/22);
    ctx.fillText("SCORE", sboardX+sboardWidth/2,sboardY+0.95*sboardHeight/6);
    ctx.fillText(score, sboardX+sboardWidth/2,sboardY+1.75*sboardHeight/6);
    ctx.fillText("LEVEL", sboardX+sboardWidth/2,sboardY+2.75*sboardHeight/6);
    ctx.fillText(level, sboardX+sboardWidth/2,sboardY+3.55*sboardHeight/6);
    ctx.fillText("LINES", sboardX+sboardWidth/2,sboardY+4.55*sboardHeight/6);
    ctx.fillText(lines, sboardX+sboardWidth/2,sboardY+5.35*sboardHeight/6);

    for (let i=0;i<blocks.length;i++){
        blocks[i].drawBlock();
    }
    if (disappearingTimer==0) fallingBlock.drawBlock();

    for (let i=0;i<next.length;i++){
        drawBlockCentered(next[i], 0, nextX + nextWidth/2, nextY+1.1*holdHeight*3/10+squareDim*3*(i+0.5))
    }

    if (holdBlock != -1){
        drawBlockCentered(holdBlock, 0, holdX + holdWidth/2, holdY+1.1*holdHeight*3/10+1.5*squareDim)
    }

    for (let i=0;i<textEffects.length; i++){
        textEffects[i].draw();
    }
}

function shakeStuff(){
    if (shakeTimer<0){
        shakeY=0;
    } else{
        shakeTimer++;
        if (shakeTimer==1){
            if ((shakeY)<0) shakeY=0;
            shakeY+=shakeStrength;
        }
        else if (shakeTimer<5){
            shakeY+=shakeStrength;
        } else if (shakeTimer<10){
            shakeY-=shakeStrength;
        } else if (shakeTimer<14){
            shakeY+=shakeStrength;
        } else if (shakeY>0){
            shakeY-=shakeStrength;
            shakeStrength+=0.2
            if (shakeY<=0){
                shakeY=0;
                shakeTimer=-1;
            }
        } else {
            shakeY=0;
            shakeTimer=-1;
        }
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
        ctx.strokeRect(screenX+i*screenWidth/5,screenY,squareDim,screenHeight)
    }
    for (let i=0;i<10;i++){
        ctx.strokeRect(screenX,screenY+i*screenHeight/10,screenWidth,squareDim)
    }
    ctx.strokeRect(screenX,screenY,screenWidth,screenHeight)
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
    ctx.fillStyle=toOpacity(changeColor(color,50,50,50),opacity);
    ctx.fillRect(Math.floor(refx+x*squareDim+wdth),Math.floor(refy+y*squareDim+wdth),squareDim-2*wdth,(squareDim-2*wdth)/3)
    ctx.lineWidth=wdth
    ctx.strokeStyle=toOpacity(changeColor(color,50,50,50),1)
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
        let backToBack = false;
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
                if (previousHard) {
                    newPoints*=1.5;
                    backToBack=true;
                }
                previousHard=true;
                break;
        }
        newPoints*=level;
        score+=newPoints;

        if (backToBack){
            textEffects.push(new TextEffect("BACK-TO-BACK",0.9*squareDim,screenX+screenWidth/2,screenY+3/4*screenHeight-2*squareDim,squareDim/6))
        }

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
    next[2]=getFromBag();
    return save;
}

function getFromBag(){
    chosen =Math.floor(blockBag.length * Math.random());
    out= blockBag[chosen];
    blockBag.splice(chosen,1);
    if (blockBag.length==0) blockBag=[0,1,2,3,4,5,6];
    return out;
}

class TextEffect {
    constructor(txt,size,x,y,spd){
        this.text=txt;
        this.x=x;
        this.y=y;
        this.speed=spd;
        this.count=60;
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
        this.squareOffsets=[0,0,0,0];
        this.disappearing=[false,false,false,false]
        this.placed=false;
        this.color=blockColors[this.id];
        this.opacity=1;
        this.trailLength=0;
        this.ghost=false;

        for (let i=0; i<this.squares.length; i++){
            this.squares[i][1]=this.y+blockLayouts[this.id][i][1];
            this.squares[i][0]=this.x+blockLayouts[this.id][i][0];
        }
        //move up as much as possible
        if (this.isOverlapping()){
            this.y-=1;
        }
        for (let i=0; i<this.squares.length; i++){
            this.squares[i][1]=this.y+blockLayouts[this.id][i][1];
            this.squares[i][0]=this.x+blockLayouts[this.id][i][0];
        }
    }

    drawBlock(){
        if (this.trailLength>0){
            this.trailLength=Math.floor(this.trailLength*0.7);
            let startxs=[];
            let startys=[]
            for (let i=0; i<this.squares.length; i++){
                let index=startxs.indexOf(this.squares[i][0])
                if (index!=-1){
                    if (this.squares[i][1] < startys[index]) startys[index]=this.squares[i][1];
                } else {
                    startxs.push(this.squares[i][0])
                    startys.push(this.squares[i][1])
                }
            }
            ctx.fillStyle=toOpacity(this.color,0.2)
            for (let i=0;i<startxs.length;i++){
                ctx.fillRect(screenX+startxs[i]*squareDim,screenY+squareDim*(startys[i]-this.trailLength),squareDim,this.trailLength*squareDim);
            }
        }
        for (let i=this.squares.length-1; i>=0; i--){
            if (this.squares[i][1]>=0 && this.squares[i][1] + this.squareOffsets[i]/squareDim < 20) drawSquare(this.color, this.opacity, screenX, screenY+this.squareOffsets[i], this.squares[i][0], this.squares[i][1], 0, 0);
            if (disappearingTimer==0 && this.squareOffsets[i]<0){
                this.squareOffsets[i]+=squareDim/2;
                if (this.squareOffsets[i]>0) this.squareOffsets[i]=0;
            }
            if (this.disappearing[i] && (9-(disappearingTimer/2)==this.squares[i][0])){
                this.squares.splice(i,1);
                this.squareOffsets.splice(i,1);
                this.disappearing.splice(i,1);
            }
        }
    }

    drop(){
        let d=0
        while (!this.isOverlapping()){
            this.trailLength++;
            this.y++;
            score+=2;
            d++;
            for (let i=0;i<this.squares.length;i++){
                this.squares[i][1]++;
            }
        }
        disappearingTimer=5;
        this.y--;
        d--;
        this.trailLength--;
        score-=2;
        for (let i=0;i<this.squares.length;i++){
            this.squares[i][1]--;
        }
        this.placeBlock();
        shakeTimer=0;
        shakeStrength=Math.max(3,d);
    }

    placeBlock(){ // returns the number of lines removed
        this.opacity=1;
        this.placed=true;
        blocks.push(this);
        canHold = true;
        lockDelayTimer=0;
        lockResetCounter=0;
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
            if (this.squares[i][1]<0) gameOver=true;
        }
        fallingBlock= new Block(getNext());
        if (fallingBlock.isOverlapping()){
            gameOver=true;
        }
        if (count>=1){
            disappearingTimer=20;
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
            if (this.squares[i][1]==row){
                this.disappearing[i]=true;
                //this.squares.splice(i,1);
                //this.squareOffsets.splice(i,1)
            }
            else if (this.squares[i][1]<row) {
                this.squares[i][1]++;
                this.squareOffsets[i]-=squareDim;
            }
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
            return false;
        }
        return true;
    }
}

function startGame(){
    next=[]
    for (let i=0;i<3;i++){
        next.push(getFromBag())
    }
    fallingBlock= new Block(getNext());
    gameloop();
}

startGame();