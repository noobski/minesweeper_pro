var arr = [];
var ID;

window.onload = start;

class Cell {
    constructor (i) {
        this.topX = i%(dimension) * scale;
        this.topY = Math.floor(i/dimension) * scale;
        this.isMine = false;
        this.isOpen = false;
        this.num = 0;
        this.isFlag = false;
        this.index = i;
        this.neighbors = [];
        this.recursionPass = false;
        this.isBlasted = false;
    }
    markFlag() {
        this.isFlag = true;
        minesLeft--;
    }
    removeFlag() {
        this.isFlag = false;
        minesLeft++;
    }
    draw () {
        var x = this.topX, y = this.topY;
        if (!this.isOpen) {
            // closed cell
            ctx.fillStyle = 'lightGrey';
            ctx.fillRect(x, y, scale, scale);
            // bezzel
            ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x+1, y+scale-2);
            ctx.lineTo(x+1, y+1); ctx.lineTo(x+scale-2,y+1);
            ctx.stroke();
            ctx.strokeStyle = 'darkGrey';
            ctx.beginPath(); ctx.moveTo(x+scale-2, y+1);
            ctx.lineTo(x+scale-2, y+scale-2); ctx.lineTo(x+1, y+scale-2);
            ctx.stroke();
            if (this.isFlag) {
                // closed cell has a flag on it
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x+scale/5, y+4*scale/5);
                ctx.lineTo(x+scale/5, y+scale/5); ctx.lineTo(x+3.5*scale/5, y+2*scale/5);
                ctx.lineTo(x+scale/5, y+3*scale/5); 
                ctx.fillStyle = 'red'; ctx.fill();
                ctx.stroke();
            }
            return;
        }
        // cell is open
        ctx.fillStyle = 'ghostwhite';
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'grey';
        ctx.fillRect(x, y, scale, scale);
        ctx.strokeRect(x, y, scale, scale);
        if (this.isMine) {
            // cell is open with a mine in it
            if (this.isBlasted) {
                // this cell caused the player to lose
                ctx.fillStyle = 'red';
                ctx.fillRect(x, y, scale, scale);
            }
            // draw the mine
            ctx.beginPath();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.arc(x+scale/2, y+scale/2, scale*1/3, 0, 2*Math.PI);
            ctx.stroke();
            ctx.fillStyle = 'red';
            ctx.fill();
            return;
        }
        // cell is open without a mine, write in it its number (unless its a zero - leave blank)
        if (this.num) {
            let fontSize = 20;
            ctx.font = '950 ' + fontSize + 'px arial';
            ctx.fillStyle = cellColors[this.num];
            ctx.fillText(this.num, this.topX+scale/2-fontSize/4, this.topY+scale/2+fontSize/4);    
        }
    }
}
function start() {
    stopTimer(); // make sure clock is not running
    dimension = 14; mines = 30; scale = 35; numCells = dimension*dimension;
    minesLeft = mines; time = 0; firstClick = true;
    arr = []; mode = 'mine'; 
    cellColors = ['DodgerBlue', 'forestgreen', 'red', 'darkblue', 'darkgoldenrod', 'darkorange'];

    canvas = document.getElementById('canvas');
    canvas.width = canvas.height = dimension * scale;
    ctx = canvas.getContext('2d');
    canvas.addEventListener('click', click);
    canvas.addEventListener('contextmenu', flagged);
    document.getElementById('mode').addEventListener('click', changeMode);
    createArray();
    drawBoard();
    bestScore = get_high_score("mineSweeper");
    bestScoreE = document.getElementById('best');
    bestScoreE.innerHTML = bestScore;
    document.body.style.backgroundColor = "black";
}
function changeMode() {
    if (mode == 'mine') {
        mode = 'flag';
        canvas.addEventListener('click', flagged);
        document.getElementById('mode').innerHTML = mode;
        return;
    } 
    mode = 'mine';
    canvas.addEventListener('click', click);
    document.getElementById('mode').innerHTML = mode;
}
function timer() {
    time++;
    timeE = document.getElementById('time').innerHTML = time;
}
function stopTimer() {
    if (ID) clearInterval(ID);
}
function findCellNeighbors() {
    for (let c of arr) {
        var ne = new Array; i = c.index;
        var nIndex = new Array;
        ix = i%dimension;
        iy = Math.floor(i/dimension);
        // handle x axis
        if (ix==0) {
            if (iy==0) {
                ne.push(arr[i+1], arr[i+1+dimension], arr[i+dimension]); 
            } else if (iy==(dimension-1)) {
                ne.push(arr[i-dimension], arr[i-dimension+1], arr[i+1]);
            } else {
                ne.push(arr[i-dimension], arr[i-dimension+1], arr[i+1], 
                    arr[i+1+dimension], arr[i+dimension]);
            }
            c.neighbors = ne;
            continue;
        }
        if (ix==(dimension-1)) {
            if (iy==0) {
                ne.push(arr[i-1], arr[i-1+dimension], arr[i+dimension]); 
            } else if (iy==(dimension-1)) {
                ne.push(arr[i-dimension], arr[i-dimension-1], arr[i-1]);
            } else {
                ne.push(arr[i-dimension], arr[i-dimension-1], arr[i-1], 
                    arr[i-1+dimension], arr[i+dimension]);
            }
            c.neighbors = ne;
            continue;
        }
        nIndex.push(i-1, i+1, i-dimension, i+dimension, i-dimension-1, 
            i-dimension+1, i+dimension-1, i+dimension+1);
        var nIndexFiltered = nIndex.filter(function(num) {return ((num>=0)&&(num<numCells));});
        for (let i of nIndexFiltered)
            c.neighbors.push(arr[i]);
    }
}
function openAll() {
    for (let c of arr)
        c.isOpen = true;
}
function createArray() {
    if (arr) delete arr;
    arr = new Array;
    var squares = dimension*dimension;
    var numMines = mines;
    // create all cells
    for (let i=0; i<squares; i++) 
        arr[i] = new Cell(i);
    // create all the mines
    while (numMines) {
        var cellNum = Math.floor(Math.random()*numCells);
        if (arr[cellNum].isMine == false) {
            arr[cellNum].isMine = true;
            arr[cellNum].num = -1;
            numMines--;
        }
    }
    findCellNeighbors(); // for each cell, add who its neighbors are
    updateNumbers(); // create the number for each cell

}
function updateNumbers() {
    var minesArr = arr.filter(function(c) {return c.isMine;});
    for (let c of minesArr) {
        let neighbors = c.neighbors;
        for (n of neighbors) {
            if(!n.isMine) 
                n.num++;
        }
    }
}
function drawBoard() {
    for (let i=0; i<arr.length; i++) 
        arr[i].draw();
    document.getElementById('mines').innerHTML = minesLeft;
    if (!minesLeft)
        gameWon();
}
function gameWon() {
    stopTimer();
    // check if some of the flags did not mark mines (if so, return to caller)
    var misMarkedMines = arr.filter(function(c) {return (c.isMine && !c.isFlag);});
    if (misMarkedMines.length) return;
    // check if this is best score
    if (time < bestScore) {
        // player made best time!
        var s = dimension*scale;
        bestScore = time;
        bestScoreE.innerHTML = "<font style = 'red'>" + time + "</font>";
        set_high_score('mineSweeper', bestScore);
    }
    drawSmiley();
    ctx.fillStyle = 'pink';
    ctx.fillRect(s/6, s/3, 4*s/6, s/3);
    text_on_canvas (ctx, 33, 'asap', 'red', "You got the best time!!!", s/2, s/2, 'center');
}
function drawSmiley() {
    ctx.beginPath();
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 9;
    var s = dimension*scale;
    ctx.arc(s/2, s/2, s/2.85, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s/5, s/3.5, s/10, 0, 2*Math.PI);
    ctx.arc(s/5*4, s/3.5, s/10, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 33;
    ctx.arc(s/2, s/2, 0.35*s, 0.1*Math.PI, 0.9*Math.PI);
    ctx.stroke();
    
}
function getCellClicked(e) {
    var x = e.offsetX, y = e.offsetY;
    var cellClicked = Math.floor(x/scale) + Math.floor(y/scale) * dimension;
    return arr[cellClicked];
}
function click(e) {
    var c = getCellClicked(e);
    // is this the first time a cell is clicked?
    if (firstClick) {
        firstClick = false;
        // ensure that first cell clicked is a zero (if not re-create board)
        while (c.num != 0) { 
            createArray(); 
            c = getCellClicked(e);
        }
        ID = setInterval(timer, 1000); // start timer
    }
    // is clicked cell a flag?
    if (c.isFlag) 
        c.removeFlag();
    c.isOpen = true;
    drawBoard();
    // is clicked cell a mine?
    if (c.isMine) {
        c.isBlasted = true;
        gameOver();
        return;
    }
    // is clicked cell a blank cell?
    if (!c.num) {
        openZeros(c);
        // clean recursion flag of all cells    
        for (c of arr)
            c.recursionPass = false;
        drawBoard();
    }
}
function flagged (e) {
    e.preventDefault();
    var c = getCellClicked(e);
    if (!c.isOpen) {
        if (c.isFlag)
            c.removeFlag();
        else c.markFlag();
    }
    if ((c.isOpen) & (c.num > 0)) {
            let nMines = 0;
            // count mines in its neighbors
            for (let n of c.neighbors) {
                if (n.isFlag)
                    nMines++;
            }
            // are all mines around this number marked?
            if (nMines == c.num) {
                // open up the surrounding cells
                for (let n of c.neighbors) {
                    if ((!n.isOpen) && (!n.isFlag)) {
                        // cell is closed and not a flag
                        n.isOpen = true; // open the cell
                        if (n.isMine) {
                            n.isBlasted = true;
                            gameOver();
                        }
                        if (!n.num) { // cell is a zero
                            openZeros(n);
                        }
                    }
                }
            }
        }
    drawBoard();
}
function gameOver() {
    stopTimer();
    openAll();
    drawBoard();
    // XXX
}
function openZeros(c) {
    c.isOpen = true;
    if (c.isFlag) 
        c.removeFlag();
    if (c.num) return;
    c.recursionPass = true;
    i = c.index;
    for (let nC of c.neighbors) {
        nCi = nC.index;
        if (nC.recursionPass) 
            continue;
        openZeros(nC);
    }
}
