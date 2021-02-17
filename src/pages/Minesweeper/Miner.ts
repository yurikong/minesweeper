import Cell from './Cell';
import Sentence from './Sentence';
import Board from './Board';
import {containsCell, sleep} from './utils';


class Miner {
    private SPEED          : number = 100;
    private _board         : Board;
    private _grid          : number[][];
    private _sizeOfGrid    : number;
    private _mineCells     : Cell[];
    private _safeCells     : Cell[];
    private _knowledgeBase : Sentence[];
    private _newCells      : Cell[];
    // private _currentNumbersChecked      : Cell[];
    // private _currentMinesFound          : Cell[];
    private _lastCheck                  : Cell

    private _uiSetGrid                  : (data:any) => void;
    private _uiSetIsFailed              : (data:any) => void;
    private _uiSetFlags                 : (data:any) => void;
    private _uiSetSafes                 : (data:any) => void;
    private _uiSetKB                    : (data:any) => void;
    private _uiSetEnableAI              : (data:any) => void;
    private _uiSetHasWon                : (data:any) => void;
    private _uiSetIsStuck               : (data:any) => void;
    // private _userMove                   : boolean = false;
    private _aiOn                       : boolean = false;
    constructor(board: Board, {
        setGrid,
        setIsFailed,
        setFlags,
        setSafes,
        setEnableAI,
        setKB,
        setHasWon,
        setIsStuck
    }: any) {
        this._board            = board;
        this._grid             = board.playerGrid;
        this._sizeOfGrid       = board.sizeOfGrid;
        this._newCells         = []
        this._mineCells        = [];
        this._safeCells        = [];   // next moves
        this._knowledgeBase    = [];
        this._lastCheck        = {x:-1, y:-1};

        // UI Set
        this._uiSetGrid         = setGrid;
        this._uiSetIsFailed     = setIsFailed;
        this._uiSetFlags        = setFlags;
        this._uiSetSafes        = setSafes;
        this._uiSetKB           = setKB;
        this._uiSetEnableAI     = setEnableAI
        this._uiSetHasWon       = setHasWon;
        this._uiSetIsStuck      = setIsStuck;
    }

    get grid()                  : number[][]    { return this._grid; }
    get safeCells()             : Cell[]        { return this._safeCells; }

    public async run(guessMode: boolean = true) {
        this._aiOn = true;
        let gameFailed    = ()=>this._board.isFailed;
        let gameWon       = ()=>this._board.hasWon(this.mineCells);
        let stuck         = ()=>this._safeCells.length === 0 && !gameFailed() && !gameWon();

        while (!gameFailed() && !gameWon()){
            if(stuck()){
                if(!guessMode){break}
                let randomNullCell  = this._pickRandomNullCell()
                console.log("Guessing: ", randomNullCell)
                await this.checkNext(randomNullCell)
            } else 
                await this.checkNext()
        }
        this._aiOn = false;
        this._uiSetEnableAI(false)
        if(stuck()){
            console.log("Stuck")
            this._uiSetIsStuck(true)
        }
        if(gameFailed()){
            console.log("Failed @ ", this._lastCheck)
            this._uiSetIsFailed(true)
            this._uiSetGrid(this._board.gameOver)
            this._uiSetKB([])
        }
        if(gameWon()){
            console.log(stuck())
            console.log("Won")
            this._uiSetFlags(this._mineCells)
            this._uiSetHasWon(true);
        }
    }
    public reset() {
        this._grid             = this._board.playerGrid;
        this._sizeOfGrid       = this._board.sizeOfGrid;
        this._newCells         = []
        this._mineCells        = [];
        this._safeCells        = [];
        this._knowledgeBase    = [];
        console.log(this._grid);
    }

    public async checkNext(cell :Cell = this._safeCells.pop() as Cell) {
        this._lastCheck = cell;
        let newCells    = this._board.checkCell(cell)
        let isFailed    = this._board.isFailed
        await sleep(this.SPEED)
        if(isFailed)
            return true;
        this._newCells = newCells
        this._updateKnowledgeBase();
        await this._solve();
        
        return false;
    }
    
    private _pickRandomNullCell() {
        let availableCells :Cell[]      = [];
        for(let i = 0; i < this._sizeOfGrid; i++)
            for(let j = 0; j < this._sizeOfGrid; j++)
                if(this.grid[i][j] === null && !containsCell(this._mineCells, {x:i, y:j} as Cell))
                    availableCells.push({x:i, y:j} as Cell)


        let randomCell = availableCells[Math.floor(Math.random() * Math.floor(availableCells.length))]
        return randomCell;
    }
    
    private async _solve() {
        return new Promise(async (resolve)=>{
            // 1. break down from big to small (including special cases)
            // 2. mark safe and mine cells
            let kb = this._knowledgeBase;

            let rm: Sentence[] = []

            for await (const A of kb){
                for await (const B of kb){
                    if(B.in(rm) || A.in(rm))
                        continue;
                    if(B.equals(A))
                        continue;
                    if(B.isSubsetOf(A)) {
                        let C = A.minus(B);
                        if(C.value === 0)
                            await this._pushSafeCells(C.cells)
                        else
                            if(C.cells.length === C.value)
                                await this._pushMineCells(C.cells)
                            else
                                await this._pushSentence(C);
                        if(!A.in(rm))
                            rm.push(A)
                    }
                }
            }

            // CLEAN UP KB
            kb.forEach((sentence, i)=>{
                if(sentence.in(rm))
                    kb.splice(i,1)
            })
            resolve([])
        })
    }
    
    private async _pushSentence(inSentence: Sentence) {
        if(!inSentence.in(this._knowledgeBase)) { 
            this._knowledgeBase.push(inSentence)
            if(this._aiOn)
                this._uiSetKB(this._knowledgeBase)
        }
    }

    private async _pushMineCells(cells: Cell[]) {
        for(let cell of cells){
            if(!containsCell(this._mineCells, cell)){
                this._mineCells.push(cell)
                if(this._aiOn)
                    this._uiSetFlags((flags: any)=>[...flags, cell])
                await sleep(this.SPEED)
            }            
            await this._pushSentence(new Sentence([cell], 1))
        }
    }

    private async _pushSafeCells(cells: Cell[]) {
        for(let cell of cells) {
            if(!containsCell(this._safeCells, cell)){
                this._safeCells.push(cell)
                if(this._aiOn)
                    this._uiSetSafes((safes: any)=>[...safes, cell])
                await sleep(this.SPEED)
            }
            await this._pushSentence(new Sentence([cell], 0))
        }
    }
    
    public async userMove(cells: Cell[]){
        this._uiSetFlags(this._uiSetFlags)
        await this._updateKnowledgeBase(cells);
        await this._solve()
    }

    private async _updateKnowledgeBase(newCells: Cell[] = this._newCells) {
        for(let newCell of newCells) {
            let kb          = this._knowledgeBase;
            let grid        = this._grid;
            let {x, y}      = newCell;
            let value       = grid[x][y]

            // IF ITS NUMBER-CELLS, ADD MORE KB
            if(     grid[x][y] !== 0
                &&  grid[x][y] !== null
                &&  grid[x][y] !== -1){
                    let zeroNeighbors       = this._getZeroNeighbors(newCell)
                    if(zeroNeighbors.length === value)  // Special case
                        await this._pushMineCells(zeroNeighbors)
                    else 
                        this._pushSentence(new Sentence(zeroNeighbors, value))
            }

            // IF NEW-CELL IN KB, ADD CELL => TO ELIMINATE IT LATER
            for(let sentence of kb) {
                let sentenceCells = sentence.cells;
                if(containsCell(sentenceCells, newCell)) {
                    let newSentence        = new Sentence([newCell], 0)
                    this._pushSentence(newSentence)
                }
            }

            // IF NEW-CELL IN SAFE-CELLS REMOVE IT
            this._safeCells = this._safeCells.filter((safe)=>                   
                !(safe.x === newCell.x && safe.y === newCell.y)
            )
        } 
        this._newCells = []
    }
    

    private _getZeroNeighbors(cell: Cell): Cell[] {
        let neighbors: Cell[] = []
        let sizeOfGrid  = this._sizeOfGrid;
        let grid        = this.grid;
        for(let x = cell.x - 1; x < cell.x + 2; x++) {
            for(let y = cell.y - 1; y < cell.y + 2; y++)
                if(-1 < x && x < sizeOfGrid && -1 < y && y < sizeOfGrid && grid[x][y] === null)
                    neighbors.push({x, y} as Cell);
        }
        return neighbors;
    }


    public kbToString() {
        let str = '';
        for(let sentence of this._knowledgeBase) {
            str += sentence.toString() + "\n";
        }
        return str;
    }

    get mineCells(): Cell[] { return this._mineCells}
}

export default Miner;