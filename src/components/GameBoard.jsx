import { Card, CardContent } from './ui.jsx';
import BoardSquare from './BoardSquare.jsx';
import FactionChart from './FactionChart.jsx';

export default function GameBoard({
    boardRows,
    players,
    movingPlayerId,
    chartData,
    maxTurns,
    maxChartValue,
    teamScores,
    winningTeam,
    taxPool,
    currentPlayer,
    activeCard,
    revealedCard,
    resultCard,
    currentStance
}) {
    const activeLandedPosition =
        currentPlayer && (activeCard || revealedCard || resultCard)
            ? currentPlayer.position
            : null;

    const renderSquare = (space) => (
        <BoardSquare
            key={space.id}
            space={space}
            index={space.id}
            movingPlayerId={movingPlayerId}
            activePlayers={players.filter((player) => player.position === space.id)}
            isActiveLandedSquare={activeLandedPosition === space.id}
        />
    );

    return (
        <Card className={`${currentStance.soft} text-slate-950 rounded-3xl shadow-xl border-2 ${currentStance.border}`}>
            <CardContent className="p-3 md:p-4">
                <div className="grid grid-cols-8 gap-2 mb-2">{boardRows.top.map(renderSquare)}</div>
                <div className="grid grid-cols-8 gap-2">
                    <div className="col-span-1 grid grid-rows-6 gap-2">{boardRows.left.map(renderSquare)}</div>
                    <FactionChart chartData={chartData} maxTurns={maxTurns} maxChartValue={maxChartValue} teamScores={teamScores} winningTeam={winningTeam} taxPool={taxPool} />
                    <div className="col-span-1 grid grid-rows-6 gap-2">{boardRows.right.map(renderSquare)}</div>
                </div>
                <div className="grid grid-cols-8 gap-2 mt-2">{boardRows.bottom.map(renderSquare)}</div>
            </CardContent>
        </Card>
    );
}