'use client'

import React, { useState, useEffect } from 'react';
// import useLocalStorage from '../hooks/useLocalStorage';
import SudokuGrid from '../SudokuGrid';
import { Grid, EMPTY_PUZZLE } from '../../../components/puzzles';
import { Button } from '@/components/ui/button';
import { solvers, countSolutions } from '@/components/algorithms';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, RefreshCw } from "lucide-react"

export default function App() {
    const [grid, setGrid] = useState<Grid>(EMPTY_PUZZLE);
    const [invalidCells, setInvalidCells] = useState<{[key: string]: boolean}>({});
    const [solvingMethod, setSolvingMethod] = useState(solvers[0].name);
    const [possibleSolutions, setPossibleSolutions] = useState<number | null>(null);
    const [customPuzzles, setCustomPuzzles] = useState<Grid[]>([]);
    const [solverResult, setSolverResult] = useState<string | null>(null);
    const [selectedPuzzleIndex, setSelectedPuzzleIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSolutions, setIsCheckingSolutions] = useState(false);

    // Load custom puzzles from localStorage on client side
    useEffect(() => {
        const storedPuzzles = JSON.parse(localStorage.getItem("customPuzzles") || "[]");
        setCustomPuzzles(storedPuzzles);
    }, []);

    const handleInputChange = (row: number, col: number, value: string) => {
        if (!/^[1-9]?$/.test(value)) return;  // Ensure value is a number between 1-9 or empty
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(r => r.slice());
            newGrid[row][col] = value;
            return newGrid;
        });
    }

    useEffect(() => {
        const validateGrid = () => {
            const newInvalidCells: {[key: string]: boolean} = {};
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (grid[i][j] !== '' && grid[i][j] !== '0') {
                        // Check row
                        for (let k = 0; k < 9; k++) {
                            if (k !== j && grid[i][k] === grid[i][j]) {
                                newInvalidCells[`${i}-${j}`] = true;
                                newInvalidCells[`${i}-${k}`] = true;
                            }
                        }
                        // Check column
                        for (let k = 0; k < 9; k++) {
                            if (k !== i && grid[k][j] === grid[i][j]) {
                                newInvalidCells[`${i}-${j}`] = true;
                                newInvalidCells[`${k}-${j}`] = true;
                            }
                        }
                        // Check 3x3 box
                        const boxRow = Math.floor(i / 3) * 3;
                        const boxCol = Math.floor(j / 3) * 3;
                        for (let r = boxRow; r < boxRow + 3; r++) {
                            for (let c = boxCol; c < boxCol + 3; c++) {
                                if ((r !== i || c !== j) && grid[r][c] === grid[i][j]) {
                                    newInvalidCells[`${i}-${j}`] = true;
                                    newInvalidCells[`${r}-${c}`] = true;
                                }
                            }
                        }
                    }
                }
            }
            setInvalidCells(newInvalidCells);
        }

        validateGrid();
    }, [grid]);

    const isGridSolved = (grid: Grid) => {
        return grid.every(row => row.every(cell => cell !== ''));
    }

    const testSolver = async () => {
        setIsLoading(true);
        const solver = solvers.find(s => s.name === solvingMethod);
        if (solver) {
            try {
                const solutionGenerator = solver.solve([...grid]);
                let finalGrid = [...grid];
                for await (const partialGrid of solutionGenerator) {
                    finalGrid = partialGrid;
                    setGrid(partialGrid);
                }
                if (isGridSolved(finalGrid)) {
                    setSolverResult("Puzzle is solvable!");
                } else {
                    setSolverResult("Solver did not complete the puzzle.");
                }
            } catch (error) {
                setSolverResult("An error occurred while solving the puzzle.");
            }
        }
        setIsLoading(false);
    }

    const checkPossibleSolutions = async () => {
        setIsCheckingSolutions(true);
        setIsLoading(true);
        const filledCells = grid.flat().filter(cell => cell !== '').length;
        if (filledCells < 10) {
            setSolverResult("You need to fill in at least 10 digits to test.");
            setIsLoading(false);
            setIsCheckingSolutions(false);
            return;
        }

        if (filledCells < 17) {
            setSolverResult("You need to fill in at least 17 digits to yield a unique solution.");
            setIsLoading(false);
            setIsCheckingSolutions(false);
            return;
        }

        try {
            setPossibleSolutions(null); // Reset the count before starting
            setSolverResult(null); // Clear any previous results
            const solutionsCount = await countSolutions([...grid]);
            if (solutionsCount < 100) {
                setPossibleSolutions(solutionsCount);
            } else {
                setSolverResult("This puzzle has more than 100 possible solutions.");
            }
        } catch (error) {
            setPossibleSolutions(null);
            setSolverResult("An error occurred while counting solutions.");
        }
        setIsLoading(false);
        setIsCheckingSolutions(false);
    }

    const savePuzzle = (publish: boolean) => {
        if (publish) {
            // Implement logic to publish to internet database
            alert("Publishing to internet database is not implemented yet.");
        } else {
            const newPuzzles = [...customPuzzles, grid];
            setCustomPuzzles(newPuzzles);
            localStorage.setItem("customPuzzles", JSON.stringify(newPuzzles));
            alert("Puzzle saved locally!");
        }
    }

    const loadPuzzle = (index: number) => {
        setGrid(customPuzzles[index]);
        setSelectedPuzzleIndex(index);
    }

    const resetGrid = () => {
        setGrid(EMPTY_PUZZLE);
        setInvalidCells({});
        setSolverResult(null);
        setPossibleSolutions(null);
    };

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold text-center">🆕 Create New Sudoku Puzzle</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="md:row-span-2">
                    <CardHeader>
                        <CardTitle>Puzzle Grid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SudokuGrid
                            grid={grid}
                            highlight={{ type: 'cell', index: -1 }}
                            filledCount={grid.flat().filter(cell => cell !== '').length}
                            error={null}
                            cellColors={invalidCells}
                            currentCheck={null}
                            handleInputChange={handleInputChange}
                            editable={true}
                            onInputChange={handleInputChange}
                        />
                        <div className="mt-4 flex justify-end">
                            <Button onClick={resetGrid} variant="outline">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reset Grid
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Puzzle Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="test" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="test">Test Solver</TabsTrigger>
                                <TabsTrigger value="solutions">Check Solutions</TabsTrigger>
                            </TabsList>
                            <TabsContent value="test" className="space-y-4">
                                <RadioGroup defaultValue={solvers[0].name} onValueChange={(value) => setSolvingMethod(value)}>
                                    <div className="flex flex-wrap gap-4">
                                        {solvers.map((solver, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <RadioGroupItem value={solver.name} id={solver.name} />
                                                <Label htmlFor={solver.name}>{solver.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                                <Button onClick={testSolver} disabled={isLoading} className="w-full">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Test Solver
                                </Button>
                            </TabsContent>
                            <TabsContent value="solutions" className="space-y-4">
                                <Button 
                                    onClick={checkPossibleSolutions} 
                                    disabled={isLoading || isCheckingSolutions} 
                                    className="w-full"
                                >
                                    {isCheckingSolutions ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Checking Solutions...
                                        </>
                                    ) : (
                                        'Check Possible Solutions'
                                    )}
                                </Button>
                            </TabsContent>
                        </Tabs>
                        {solverResult && (
                            <Alert variant={solverResult.includes("error") ? "destructive" : "default"} className="mt-4">
                                <AlertTitle>Solver Result</AlertTitle>
                                <AlertDescription>{solverResult}</AlertDescription>
                            </Alert>
                        )}
                        {possibleSolutions !== null && (
                            <Alert className="mt-4">
                                <AlertTitle>Solution Count</AlertTitle>
                                <AlertDescription>
                                    This puzzle has {possibleSolutions} possible solution(s).
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Save and Load Puzzles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex space-x-2">
                            <Button onClick={() => savePuzzle(false)} className="flex-1">Save Locally</Button>
                            <Button onClick={() => savePuzzle(true)} variant="outline" className="flex-1">Publish</Button>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loadPuzzle">Load Saved Puzzle</Label>
                            <Select
                                value={selectedPuzzleIndex !== null ? selectedPuzzleIndex.toString() : ""}
                                onValueChange={(value) => loadPuzzle(Number(value))}
                            >
                                <SelectTrigger id="loadPuzzle">
                                    <SelectValue placeholder="Select a saved puzzle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customPuzzles.map((puzzle, index) => (
                                        <SelectItem key={index} value={index.toString()}>
                                            Puzzle {index + 1}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
