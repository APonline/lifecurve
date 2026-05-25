import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from './ui.jsx';
import { SPACE_TYPES } from '../data/constants.js';
import { getStance } from '../logic/gameHelpers.js';

export default function LandingRevealModal({ landingReveal }) {
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        setFlipped(false);
        const timer = setTimeout(() => setFlipped(true), 850);
        return () => clearTimeout(timer);
    }, [landingReveal?.id]);

    if (!landingReveal) return null;

    const config = SPACE_TYPES[landingReveal.space.type];
    const Icon = config.icon;
    const ownerStance = getStance(landingReveal.ownerStanceIndex);
    const isQuiz = landingReveal.space.type === 'Quiz';
    const revealTitle = isQuiz ? 'Mystery Concept' : landingReveal.card.title;
    const revealKicker = isQuiz ? 'Read the description. Judge the idea first.' : 'Card Reveal';

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-none">
            <motion.div initial={{ scale: 0.7, y: 80, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }} className="relative h-[500px] w-[340px]" style={{ perspective: 1200 }}>
                <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.7, ease: 'easeInOut' }} className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
                    <div className={`absolute inset-0 rounded-[2rem] border-4 shadow-2xl ${config.color} flex flex-col items-center justify-center text-center p-8`} style={{ backfaceVisibility: 'hidden' }}>
                        <Icon className="h-20 w-20 mb-6" />
                        <div className="text-sm font-black uppercase tracking-[0.25em] opacity-80">Landed On</div>
                        <div className="text-4xl font-black mt-2">{landingReveal.space.name}</div>
                        <div className="mt-6 rounded-2xl bg-white/20 px-4 py-2 text-sm font-bold">{landingReveal.ownerName} claims the card</div>
                    </div>

                    <div className="absolute inset-0 rounded-[2rem] bg-white text-slate-950 border-4 border-yellow-300 shadow-2xl p-5 flex flex-col justify-between overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <Badge>{landingReveal.card.category || landingReveal.space.type}</Badge>
                                <Badge className={`${ownerStance.bg} text-white hover:${ownerStance.bg}`}>{ownerStance.label}</Badge>
                            </div>
                            <div className="text-xs uppercase tracking-[0.2em] font-black text-slate-500">{revealKicker}</div>
                            <h3 className="text-3xl font-black leading-tight mt-2">{revealTitle}</h3>
                            <p className="text-slate-600 mt-3 text-sm leading-relaxed">{landingReveal.card.text}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3">
                                    <div className="text-xs text-blue-600 font-bold">Individual</div>
                                    <div className="text-2xl font-black text-blue-700">{landingReveal.card.individual > 0 ? '+' : ''}{landingReveal.card.individual}</div>
                                </div>
                                <div className="rounded-2xl bg-red-50 border border-red-100 p-3">
                                    <div className="text-xs text-red-600 font-bold">Community</div>
                                    <div className="text-2xl font-black text-red-700">{landingReveal.card.community > 0 ? '+' : ''}{landingReveal.card.community}</div>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-2 text-xs leading-relaxed"><strong>Tradeoff:</strong> {landingReveal.card.tradeoff || 'The table decides what this means.'}</div>
                            <div className="rounded-2xl bg-slate-100 border border-slate-200 p-2 text-xs leading-relaxed"><strong>Owner:</strong> {landingReveal.ownerName}. Preparing discussion...</div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
