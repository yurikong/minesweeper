import React, { useState, useEffect } from 'react';
import Board from './Board.ts'
import '../../Minesweeper.scss'
import Miner from './Miner.ts';
import { Grid }          from '@material-ui/core';
import {containsCell}    from './utils.ts';
import AlertDialog from "./AlertDialog"

export default function MineSweeper() {
    const sizeOfBoard                   = 15;
    const numberOfMines                 = 30;

    const [isFailed,    setIsFailed]    = useState(false)
    const [hasWon,      setHasWon]      = useState(false)
    const [isStuck,     setIsStuck]     = useState(false)
    const [failedBomb,  setFailedBomb]  = useState(false)

    const [grid,        setGrid]        = useState(null)
    const [board,       setBoard]       = useState(null)
    const [miner,       setMiner]       = useState(null)
    const [flags,       setFlags]       = useState([])
    const [safes,       setSafes]       = useState([])
    const [kb,          setKB]          = useState([])
    const [enableAI,    setEnableAI]    = useState(false) 
    const [guessMode,   setGuessMode]   = useState(true) 
    // const [confirm,     setConfirm]     = useState(false)
    // const [confirmMessage, setConfirmMessage]   = useState("")
    // const [confirmAction, setConfirmAction]     = useState(null)
    const [confirm, setConfirm]         = useState({})


    useEffect(() => {
        // GAME CONTROLLER BOARD 
        let board   = new Board(sizeOfBoard, numberOfMines)
        setBoard(board)
        
        // PLAYER'S GRID 
        let grid    = board.playerGrid
        setGrid(grid)

        // AI 
        let miner   = new Miner(board, {
            setGrid,
            setIsFailed,
            setFlags,
            setSafes,
            setKB,
            setEnableAI,
            setHasWon,
            setIsStuck
        })

        setMiner(miner)
    }, []);

    useEffect(() => {
        if(isFailed){
            setConfirm({
                title: "Lost",
                state: true,
                message: "Failed. Want to try agian?",
                action: ()=>handleReset()
            })
        }
        if(hasWon){
            setConfirm({
                title: "Won",
                state: true,
                message: "Won. Want to try agian?",
                action: ()=>handleReset()
            })
        }
        
        if(isStuck){
            console.log("rererere")
            setConfirm({
                title: "Stuck",
                state: true,
                message: "AI Stuck. Want to switch to AI Guess mode",
                action: ()=>setGuessMode(true)
            })
        }

        setIsFailed(false)
        setHasWon(false)
        setIsStuck(false)
    },[isFailed, hasWon, isStuck])

    const handleCheck = ({x,y,value}) => {
        if(value === null && !enableAI){
            let cell = {x, y}
            if(containsCell(flags, cell)) return;

            // UPDATE GRID AFTER CELL-CHECKED
            let newCells    = board.checkCell(cell)
            // console.log(miner.grid);
            if (newCells.length === 0) {
                setIsFailed(true); 
                setGrid(board.gameOver)
                return;
            }
            miner.userMove(newCells)
            setGrid([...board.playerGrid])
            // UPDATE FLAGS IF FLAGS ARE AMONG NEW CELLS
            let updatedFlags = flags.filter(flag=>!containsCell(newCells,flag))
            setFlags(updatedFlags)
        } 
    }

    const handleFlag = ({x,y,value = null}) => {
        if(value === null && !enableAI){
            let cell = {x,y}
            // containsCell(flags, cell) ? 
            //     setFlags(flags.filter(flag=>!(flag.x === cell.x & flag.y === cell.y))) :    //  REMOVE FLAG IF ALREADY THERE
            //     setFlags([...flags, cell])                                                  //  ADD FLAG IF NOT THERE

            setFlags(flags => {
                return containsCell(flags, cell) ? 
                    flags.filter(flag=>!(flag.x === cell.x & flag.y === cell.y)) :    //  REMOVE FLAG IF ALREADY THERE
                    [...flags, cell]
            })
        }
    }

    const handleAIEnable = async () =>{
        if(!enableAI && !isFailed){
            setEnableAI(true)
            await miner.run(guessMode)
            console.log("done")
            setEnableAI(false)
        }
    }

    const handleReset = ()=>{
        if(!enableAI) {
            console.log("yy")
            board.reset()
            miner.reset()
            setGrid(board.playerGrid)
            setIsFailed(false)
            setHasWon(false)
            setIsStuck(false)
            setFlags([])
            setSafes([])
            setKB([])
        }
    }

    const UIGridStyle  = ({x,y,value})=>{
        let firstClass = (
            value === 0 ? "zero": (
                value  >  0 ? "number": (
                    value === null ? "null": (
                        value === -1 ? "bomb" : ""
        ))))
        let secondClass = value === null && containsCell(flags, {x, y}) ? "flag" : "";
        let thridClass  = value === null && containsCell(safes, {x, y}) ? "safe" : "";
        return `${firstClass} ${secondClass} ${thridClass}`.trim()
    }
    
    const handleGuessMode = ()=>{
        if(!enableAI){
            setGuessMode(!guessMode)
            console.log(`guessMode: ${guessMode}`)
        }
    }

    return (
        <div className="minesweeper">
            <button onClick={handleAIEnable}    >Solve it with AI: {enableAI ? "ON":"OFF"}</button>
            <button onClick={handleGuessMode}   >GuessMode: {guessMode ? "ON":"OFF"}</button>
            <button onClick={handleReset}       >Reset Game</button>
            {/* <button onClick={test}>test</button> */}
            <div style={{color:"white"}}>FLags: {numberOfMines - flags.length}</div>
            <Grid container>
                <Grid item xs>
                    <div className="minesweeper-board" onContextMenu={(e)=> e.preventDefault()}>
                        <table>
                            <tbody>
                                {grid && grid.map((row, x)=>
                                    <tr key={x}>
                                        {(row.map((value, y)=>
                                            <td key={y} 
                                                className       ={      UIGridStyle({x,y,value})}
                                                onContextMenu   ={ ()=> handleFlag({x,y,value})}
                                                onClick         ={ ()=> handleCheck({x,y,value})}
                                            >
                                                {value > 0 ? value : ""} 
                                            </td>
                                        ))}
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Grid>
                <Grid item xs>
                    <div className="minesweeper-kb">
                        {kb && kb.map((sentence, i)=><div key={i}>{sentence.toString()}</div>)}
                    </div>
                </Grid>
            </Grid>
            <AlertDialog confirm={confirm} setConfirm={setConfirm}/>
        </div>
    )
}