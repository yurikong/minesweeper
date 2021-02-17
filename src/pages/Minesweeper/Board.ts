import Cell from './Cell'
import {containsCell, getRandomCell} from './utils';


class Board {
    private _sizeOfGrid        : number;
    private _numberOfMines     : number;
    private _grid              : number[][];
    private _playerGrid        : any[][];
    private _mines             : Cell[];
    private _isFailed          : Boolean;
    // private _isFirstMove       : Boolean;

    constructor(gridSize:number = 10, minesNumber:number = 10) {
        this._sizeOfGrid           = gridSize;
        this._numberOfMines        = minesNumber;   
        this._grid                 = [];
        this._playerGrid          = [];
        this._mines                = [];
        this._isFailed             = false;
        // this._isFirstMove          = false;
        this._init();
    }


    private _init() {
        this._initBoard();
        this._initPlayerBoard();
        this._initMines();
        this._initNumbers();
        // this._initTestMines()
    }

    public reset(){
        this._init()
        this._isFailed = false;
    }

    private _initTestMines(){
        for(let i = 0; i < this.grid.length; i++){
            for(let j = 0; j < this.grid.length; j++){
                if(this._grid[i][j] === -1){
                    this._mines.push({x:i, y:j} as Cell)
                }
            }
        }
    }
    
    private _initBoard() {
        // INIT BOARD WITH ZEROES
        this._grid = this._getEmptyGrid();

        // this._grid = [
        //     [1, -1, 1, 1, 2, 2, 2, -1, 1, 0, 0, 0, 0, 0, 0],
        //     [1, 2, 2, 2, -1, -1, 2, 1, 1, 0, 0, 0, 0, 0, 0],
        //     [0, 2, -1, 3, 3, 3, 3, 2, 2, 1, 0, 0, 0, 0, 0],
        //     [0, 3, -1, 3, 1, -1, 2, -1, -1, 2, 1, 1, 1, 1, 0],
        //     [0, 2, -1, 3, 2, 1, 2, 2, 3, -1, 1, 1, -1, 2, 1],
        //     [0, 1, 3, -1, 2, 0, 0, 0, 1, 1, 1, 1, 2, -1, 1],
        //     [1, 1, 2, -1, 2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        //     [-1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
        //     [1, 1, 0, 0, 0, 0, 0, 0, 1, -1, 1, 0, 0, 0, 0],
        //     [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 1, 1, 0],
        //     [1, 1, 0, 0, 0, 0, 1, 1, 1, 1, -1, 3, -1, 1, 0],
        //     [-1, 1, 0, 0, 1, 1, 2, -1, 1, 1, 3, -1, 3, 1, 0],
        //     [1, 1, 0, 1, 3, -1, 3, 1, 1, 1, 4, -1, 3, 0, 0],
        //     [0, 0, 0, 1, -1, -1, 2, 1, 1, 2, -1, -1, 2, 1, 1],
        //     [0, 0, 0, 1, 2, 2, 1, 1, -1, 2, 2, 2, 1, 1, -1],
        // ]
    }

    private _initPlayerBoard() {
        this._playerGrid = this._getEmptyGrid(null);
    }

    private _initMines() {
        // (1) ADD UNIQUE CELL CORDINATES TO _bombs
        // (2) ADD MARK BOMB CORDINTE IN _grid
        this._mines = []
        let currentNumberOfMines = 0;
        while(currentNumberOfMines < this._numberOfMines) {
            let randomCell = getRandomCell(this._sizeOfGrid);
            if( containsCell(this._mines, randomCell) )
                continue;
            this._mines.push(randomCell)                   // (1)
            this._grid[randomCell.x][randomCell.y] = -1;  // (2)
            currentNumberOfMines++;
        }
    }

    private _initNumbers() {
        for(let cell of this._mines) {
            let neighbors = this._getNeighborCells(cell);
            for(let {x, y} of neighbors)
                if(this._grid[x][y] !== -1)
                    this._grid[x][y]++;
        }
    }

    private _getNeighborCells(cell: Cell) {
        let neighbors: Cell[] = []
        for(let x = cell.x - 1; x < cell.x + 2; x++)
            for(let y = cell.y - 1; y < cell.y + 2; y++) {
                if(x === cell.x && y === cell.y)
                    continue;
                if(-1 < x && x < this._sizeOfGrid && -1 < y && y < this._sizeOfGrid)
                    neighbors.push({x, y} as Cell);
            }
        return neighbors;
    }
    
    private _getEmptyGrid(value: any = 0) {
        let board: any[][] = [];
        for(let i = 0; i < this._sizeOfGrid; i++) {
            board[i] = [];
            for(let j = 0; j < this._sizeOfGrid; j++)
                board[i][j] = value;
        }
        return board;
    }
    
    private _spreadCells(origin: Cell) {
        let checked     : Cell[] = [];
        let notChecked  : Cell[] = [origin]; // queue to be checked
        while(notChecked.length > 0) {
            let popCell = notChecked[0];
            notChecked.splice(0, 1);
            this._markCell(popCell);
            if(!containsCell(checked, popCell))
                checked.push(popCell);
            let zeroNeighbors = this._getNeighborCells(popCell).filter(({x,y}) => this._grid[x][y] === 0);
            for(let zeroNeighbor of zeroNeighbors)
                if(!containsCell(checked, zeroNeighbor) && !containsCell(notChecked, zeroNeighbor))
                    notChecked.push(zeroNeighbor);
        }
        let newCells:Cell[]  = [...checked];
        for(let zeroCell of checked) {
            let numberNeighbors = this._getNeighborCells(zeroCell).filter(({x,y}) => this._grid[x][y] !== 0);
            for(let numberNeighbor of numberNeighbors){
                this._markCell(numberNeighbor);
                if(!containsCell(newCells, numberNeighbor)){
                    newCells.push(numberNeighbor)
                }
            }
        }
        return newCells
    }
        
    private _markCell({x, y}: Cell) {
        this._playerGrid[x][y] = this._grid[x][y];
        return [{x,y} as Cell]
    }


    public checkCell(checkedCell: Cell): Cell[] {
        if(this._isFailed) return [];
        // console.log(this._mines, checkedCell)
        if(containsCell(this._mines, checkedCell)) {
            this._isFailed = true;
            return [];
        }
        let value = this._grid[checkedCell.x][checkedCell.y];
        return value === 0 ? this._spreadCells(checkedCell) : this._markCell(checkedCell);
    }
    
    public hasWon(flags: Cell[]) : Boolean{
        // CHECK MINES LENGTH
        if(flags.length !== this.numberOfMines)
            return false

        // CHECK GRID
        for(let i = 0; i < this.grid.length; i++)
            for(let j = 0; j < this.grid.length; j++)
                if(this.playerGrid[i][j] === null && !containsCell(flags, {x:i, y:j} as Cell))
                    return false

        // CHECK EACH MINE
        let temp = this._mines;
        for(let {x, y} of flags)
            temp = temp.filter((cell) => !(cell.x === x && cell.y === y))

        return (temp.length === 0)
    }

    get grid()          : number[][]    { return this._grid }
    get isFailed()      : Boolean       { return this._isFailed }
    get gameOver()      : number[][]    { return this._isFailed ? this._grid : [] }
    get sizeOfGrid()    : number        { return this._sizeOfGrid; }
    get numberOfMines() : number        { return this._numberOfMines; }
    get playerGrid()    : number[][]    { return this._playerGrid; }
    get zeroCell()      : Cell          { 
        for(let x=0;x<this._sizeOfGrid;x++)
            for(let y=0;y<this._sizeOfGrid;y++)
                if(this._grid[x][y] === 0)
                    return {x, y} as Cell
        return {x:0,y:0} as Cell;
    }
}


export default Board;