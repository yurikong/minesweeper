import Cell from './Cell';

class Sentence {
    private __cells: Cell[];
    private __value: number;

    constructor(cells: Cell[] = [], value: number = 0) {
        this.__cells = cells;
        this.__value = value;
    }

    public isSubsetOf(inSentence: Sentence): Boolean {
        // console.log(this.cells, " subset of ? ", inSentence.cells)
        for(let {x, y} of this.__cells) {
            if(!inSentence.cells.some(cell => x === cell.x && y === cell.y))
                return false
        }
        return this.__cells.length <= inSentence.cells.length;
    }

    public minus(inSentence: Sentence): Sentence {
        // A - B
        let result = new Sentence(this.__cells, this.__value); // result = A
        for(let {x, y} of inSentence.cells) { // loop B
            // console.log("minus...ing", result.cells, result.value)
            result.__cells = result.__cells.filter((cell) => cell.x !== x || cell.y !== y); // A cells
        }
        result.__value -= inSentence.value
        return result;
    }

    public in(kb: Sentence[]): Boolean {
        let knowledgeBase = kb.filter(sentence => sentence.value === this.__value)
        for(let sentence of knowledgeBase)
            if(this.equals(sentence)){
                return true;
            }
        return false;
    }

    public equals(inSentence: Sentence): Boolean {
        if(this.__value !== inSentence.value || this.__cells.length !== inSentence.cells.length)
            return false
        // [{1, 2}, {2, 4}, {2, 3}]   in
        // [{2, 3}, {3, 4}, {1, 2}]   this
        let temp = this.__cells
        for(let {x, y} of inSentence.cells)
            temp = temp.filter((cell) => !(cell.x === x && cell.y === y))
        return temp.length === 0
    }

    public add(cell: Cell): void {
        this.__cells.push(cell);
        this.__value++;
    }

    public toString(): string {
        let str = ""
        for(let {x, y} of this.__cells)
            str += `(${x}, ${y}), `
        str+=this.__value
        return str
    }

    get cells(): Cell[] { return this.__cells; }
    get value(): number { return this.__value; }
}

export default Sentence;