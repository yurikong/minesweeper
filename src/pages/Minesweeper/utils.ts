import Cell from "./Cell";

function containsCell (cells: Cell[], {x, y}: Cell){
    for(let cell of cells)
        if(cell.x === x && cell.y === y)
            return true;
    return false;
}
function  sleep(ms: number){ 
    return new Promise(resolve => setTimeout(resolve, ms))
}

function getRandomCell(sizeOfGrid: number): Cell {
    return {
        x: Math.floor(Math.random() * Math.floor(sizeOfGrid)),
        y: Math.floor(Math.random() * Math.floor(sizeOfGrid))
    } as Cell;
}

export {
    containsCell,
    sleep,
    getRandomCell
}