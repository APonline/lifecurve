import { Dice5 } from 'lucide-react';
import { getStance } from '../logic/gameHelpers.js';

export default function PlayerBar({ players, currentPlayerIndex, turnCountdown, setSelectedPlayerId, setModalView, isHostView, canControlCurrentPlayer }) {

    if (isHostView) {
        return null;
    }
    return (
        <div className="fixed bottom-3 left-3 right-3 z-30">
            <div className="mx-auto max-w-[1200px] rounded-3xl bg-white/95 border border-white/40 shadow-2xl p-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                {players.map((player, index) => {
                    const stance = getStance(player.stanceIndex);
                    const isCurrentTurn = index === currentPlayerIndex;

                    return (
                        <div key={player.id} className="relative">
                            {isCurrentTurn && canControlCurrentPlayer && (
                                <button onClick={() => setModalView('turn')} className="absolute -top-12 left-1/2 -translate-x-1/2 h-10 w-16 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-xl border border-white/30 hover:scale-105 transition-transform" title="Roll dice">
                                    <Dice5 className="h-5 w-5" />
                                </button>
                            )}
                            <button onClick={() => { setSelectedPlayerId(player.id); setModalView('player'); }} className={`h-16 w-full rounded-2xl border-2 ${stance.border} ${stance.soft} text-slate-950 flex items-center gap-3 px-3 text-left hover:scale-[1.02] transition-transform ${isCurrentTurn ? 'ring-4 ring-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.6)]' : ''}`}>
                                <div className={`h-10 w-10 rounded-xl ${stance.bg} text-white flex items-center justify-center font-black`}>{player.id}</div>
                                <div className="min-w-0">
                                    <div className="font-black truncate">{player.name}</div>
                                    <div className={`text-xs font-bold ${stance.text}`}>{stance.label} · Sq {player.position + 1}</div>
                                    {isCurrentTurn && <div className="text-[10px] font-black text-yellow-700">TURN · auto popup in {turnCountdown}s</div>}
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
