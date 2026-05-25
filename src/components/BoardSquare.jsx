import { motion } from 'framer-motion';
import { SPACE_TYPES } from '../data/constants.js';
import { getStance } from '../logic/gameHelpers.js';

export default function BoardSquare({ space, index, activePlayers, movingPlayerId, isActiveLandedSquare }) {
    const config = SPACE_TYPES[space.type];
    const Icon = config.icon;
    const isCorner = index === 0 || index === 7 || index === 14 || index === 21;

    const activeGlowByType = {
        Policy: "ring-blue-300 shadow-[0_0_30px_rgba(96,165,250,0.9)]",
        Economy: "ring-emerald-300 shadow-[0_0_30px_rgba(110,231,183,0.9)]",
        Crisis: "ring-red-300 shadow-[0_0_30px_rgba(252,165,165,0.9)]",
        Innovation: "ring-yellow-300 shadow-[0_0_30px_rgba(253,224,71,0.9)]",
        Social: "ring-purple-300 shadow-[0_0_30px_rgba(216,180,254,0.9)]",
        Life: "ring-orange-300 shadow-[0_0_30px_rgba(253,186,116,0.9)]",
        LifeCurve: "ring-fuchsia-400 shadow-[0_0_30px_rgba(217,70,239,0.9)]",
        TaxBailout: "ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.9)]",
        Quiz: "ring-indigo-400 shadow-[0_0_30px_rgba(129,140,248,0.9)]",
        Go: "ring-slate-400 shadow-[0_0_30px_rgba(148,163,184,0.9)]",
    };

    return (
        <div className={`relative min-h-[72px] rounded-xl border p-2 shadow-sm overflow-hidden ${config.color} ${isCorner ? 'ring-2 ring-slate-900/10' : ''} ${isActiveLandedSquare ? `animate-pulse ring-4 scale-[1.02] ${activeGlowByType[space.type] || "ring-yellow-300"}` : ""}`}>
            <div className="flex items-center justify-between gap-1">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-tight text-right leading-tight">{space.name}</span>
            </div>
            <div className="absolute bottom-1 left-1 right-1 flex gap-1 flex-wrap">
                {activePlayers.map((player) => {
                    const stance = getStance(player.stanceIndex);
                    return (
                        <motion.div key={player.id} layout transition={{ type: 'spring', stiffness: 420, damping: 28 }} className={`h-5 w-5 rounded-full ${stance.bg} text-white text-[10px] font-black flex items-center justify-center shadow ${movingPlayerId === player.id ? 'ring-4 ring-yellow-300 scale-125' : ''}`}>{player.id}</motion.div>
                    );
                })}
            </div>
        </div>
    );
}
