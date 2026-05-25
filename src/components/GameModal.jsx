import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Dice5, X, CheckCircle2, XCircle } from 'lucide-react';
import { Badge, Button } from './ui.jsx';
import { CARD_DECK } from '../data/cards.js';
import { SPACE_TYPES } from '../data/constants.js';
import { getStance } from '../logic/gameHelpers.js';

function ModalHeader({ modalView, setModalView, selectedPlayer, activeCard, revealedCard, resultCard }) {
    if (modalView === 'vote' && activeCard) {
        return (
            <div className={`sticky top-0 z-10 rounded-t-3xl p-6 border-b ${SPACE_TYPES[activeCard.category]?.color || 'bg-slate-900 text-white border-slate-700'}`}>
                <button onClick={() => setModalView('closed')} className="absolute top-5 right-5 rounded-full p-2 hover:bg-white/20 transition-colors">
                    <X className="h-5 w-5" />
                </button>
                <div className="text-xs uppercase tracking-[0.2em] font-black opacity-80">
                    {activeCard.mode === 'quiz' ? 'Quiz Card' : activeCard.mode === 'event' ? 'Reality Event' : 'Policy Proposal'}
                </div>
                <div className="text-lg font-black mt-1 opacity-90">
                    {activeCard.category}
                </div>
                <div className="text-4xl font-black mt-3 leading-tight">
                    {activeCard.mode === 'quiz' ? 'Mystery Concept' : activeCard.title}
                </div>
            </div>
        );
    }

    if (modalView === 'result' && resultCard) {
        return (
            <div className={`sticky top-0 z-10 rounded-t-3xl p-6 border-b ${SPACE_TYPES[resultCard.category]?.color || 'bg-slate-900 text-white border-slate-700'}`}>
                <div className="text-xs uppercase tracking-[0.2em] font-black opacity-80">
                    {resultCard.category === 'Quiz' ? 'Quiz Reveal' : resultCard.category}
                </div>
                <div className="text-4xl font-black mt-3 leading-tight">
                    {resultCard.title}
                </div>
            </div>
        );
    }

    if (modalView === 'reveal' && revealedCard) {
        return (
            <div className={`sticky top-0 z-10 rounded-t-3xl p-6 border-b ${SPACE_TYPES[revealedCard.category]?.color || 'bg-slate-900 text-white border-slate-700'}`}>
                <button onClick={() => setModalView('closed')} className="absolute top-5 right-5 rounded-full p-2 hover:bg-white/20 transition-colors">
                    <X className="h-5 w-5" />
                </button>
                <div className="text-xs uppercase tracking-[0.2em] font-black opacity-80">
                    {revealedCard.category}
                </div>
                <div className="text-4xl font-black mt-3 leading-tight">
                    {revealedCard.title}
                </div>
            </div>
        );
    }

    return (
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 p-4 flex items-center justify-between gap-3 z-10">
            <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">LifeCurve</div>
                <h2 className="text-2xl font-black">
                    {modalView === 'turn' && 'Next Turn'}
                    {modalView === 'players' && 'All Players'}
                    {modalView === 'events' && 'Events Log'}
                    {modalView === 'cards' && 'Card Legend'}
                    {modalView === 'rules' && 'Rules'}
                    {modalView === 'player' && selectedPlayer?.name}
                </h2>
            </div>
            <Button variant="ghost" onClick={() => setModalView('closed')} className="rounded-2xl">
                <X className="h-5 w-5" />
            </Button>
        </div>
    );
}

function getVoteLabel(activeCard, value) {
    if (!value) return 'No vote submitted';

    if (activeCard?.mode === 'event') {
        return activeCard.responseOptions?.find((option) => option.key === value)?.title || value;
    }

    if (activeCard?.mode === 'quiz') {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    if (value === 'yes') return 'Support';
    if (value === 'no') return 'Oppose';
    if (value === 'neutral') return 'Neutral';

    return value;
}

export default function GameModal(props) {
    const {
        modalView,
        setModalView,
        players,
        selectedPlayer,
        setSelectedPlayerId,
        activeCard,
        revealedCard,
        resultCard,
        currentPlayer,
        currentStance,
        dice,
        rollDice,
        gameOver,
        castVote,
        setOwnerSuggestion,
        votes,
        revealAndContinue,
        turnLog,
        movingPlayerId,
        viewMode,
        votePlayerId,
        controlledPlayerId,
        isHostView,
        canRoll,
    } = props;

    const [draftVote, setDraftVote] = useState(null);
    const [resultCountdown, setResultCountdown] = useState(6);

    const activeVotePlayerId = votePlayerId || (viewMode === 'local' ? null : controlledPlayerId);
    const votePlayer = players.find((player) => player.id === activeVotePlayerId);
    const activeSubmittedVote = activeVotePlayerId ? votes[activeVotePlayerId] : null;
    const canUseControllerVote = !!activeCard && !!activeVotePlayerId && !isHostView;
    const isOwnerController = activeCard?.playerId === activeVotePlayerId;
    const canChooseVote = canUseControllerVote && (isOwnerController || !!activeCard?.ownerSuggestion);
    const canSubmitDraftVote = canChooseVote && !!draftVote && draftVote !== activeSubmittedVote;

    useEffect(() => {
        if (!activeCard || !activeVotePlayerId) {
            setDraftVote(null);
            return;
        }

        setDraftVote(votes[activeVotePlayerId] || null);
    }, [activeCard?.title, activeCard?.playerId, activeVotePlayerId]);

    useEffect(() => {
        if (modalView !== 'result' || !resultCard) return;

        setResultCountdown(6);

        const interval = setInterval(() => {
            setResultCountdown((current) => Math.max(0, current - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [modalView, resultCard?.title]);

    const submitVote = () => {
        if (!activeCard || !activeVotePlayerId || !draftVote) return;

        if (isOwnerController) {
            setOwnerSuggestion(draftVote);
            return;
        }

        castVote(activeVotePlayerId, draftVote);
    };

    const renderVoteButtons = (player) => {
        const isThisController = activeVotePlayerId === player.id;
        const isOwner = player.id === activeCard.playerId;
        const disabled = !isThisController || !canChooseVote;
        const selectedValue = isThisController ? draftVote : votes[player.id];
        const onPick = (choice) => {
            if (!isThisController || disabled) return;
            setDraftVote(choice);
        };

        if (activeCard.mode === 'event') {
            return (
                <div className="grid grid-cols-4 gap-1">
                    {activeCard.responseOptions.map((option) => (
                        <Button
                            key={option.key}
                            size="sm"
                            disabled={disabled}
                            variant={selectedValue === option.key ? 'default' : 'outline'}
                            onClick={() => onPick(option.key)}
                            className="rounded-xl px-2"
                        >
                            {option.key}
                        </Button>
                    ))}
                </div>
            );
        }

        if (activeCard.mode === 'quiz') {
            return (
                <div className="flex gap-1">
                    <Button size="sm" disabled={disabled} variant={selectedValue === 'good' ? 'default' : 'outline'} onClick={() => onPick('good')} className="rounded-xl px-2">Good</Button>
                    <Button size="sm" disabled={disabled} variant={selectedValue === 'neutral' ? 'default' : 'outline'} onClick={() => onPick('neutral')} className={`rounded-xl px-2 ${selectedValue === 'neutral' ? 'bg-slate-500 text-white hover:bg-slate-600' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>Neutral</Button>
                    <Button size="sm" disabled={disabled} variant={selectedValue === 'bad' ? 'destructive' : 'outline'} onClick={() => onPick('bad')} className="rounded-xl px-2">Bad</Button>
                </div>
            );
        }

        return (
            <div className="flex gap-1">
                <Button size="sm" disabled={disabled} variant={selectedValue === 'yes' ? 'default' : 'outline'} onClick={() => onPick('yes')} className="rounded-xl"><CheckCircle2 className="h-4 w-4" /></Button>
                <Button size="sm" disabled={disabled} variant={selectedValue === 'neutral' ? 'default' : 'outline'} onClick={() => onPick('neutral')} className={`rounded-xl px-3 ${selectedValue === 'neutral' ? 'bg-slate-500 text-white hover:bg-slate-600' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>—</Button>
                <Button size="sm" disabled={disabled} variant={selectedValue === 'no' ? 'destructive' : 'outline'} onClick={() => onPick('no')} className="rounded-xl"><XCircle className="h-4 w-4" /></Button>
            </div>
        );
    };

    if (!modalView || modalView === 'closed') return null;

    return (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-4xl max-h-[88vh] overflow-auto rounded-3xl bg-white text-slate-950 shadow-2xl border border-white/50">
                <ModalHeader modalView={modalView} setModalView={setModalView} selectedPlayer={selectedPlayer} activeCard={activeCard} revealedCard={revealedCard} resultCard={resultCard} />

                <motion.div className="p-5 space-y-4" key={`${modalView}-${activeCard?.title || revealedCard?.title || resultCard?.title || 'modal'}`} initial={{ rotateY: modalView === 'vote' || modalView === 'reveal' ? 90 : 0, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }} style={{ transformStyle: 'preserve-3d' }}>
                    {modalView === 'turn' && (
                        <div className="text-center space-y-5">
                            <div>
                                <div className="text-sm text-slate-500 uppercase tracking-wide">Current Turn</div>
                                <h3 className="text-4xl font-black">{currentPlayer?.name}</h3>
                                <Badge
                                    className="text-white border-0 hover:opacity-90"
                                    style={{
                                        backgroundColor: currentStance.stroke,
                                    }}
                                >
                                    {currentStance?.label}
                                </Badge>
                            </div>
                            <motion.div key={dice || 'dice-modal'} initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} className={`mx-auto h-28 w-28 rounded-3xl ${currentStance.bg} text-white flex items-center justify-center text-5xl font-black shadow-xl`}>
                                {dice || <Dice5 className="h-14 w-14" />}
                            </motion.div>
                            <Button onClick={rollDice} disabled={!canRoll || gameOver || !!activeCard || !!revealedCard || !!resultCard || !!movingPlayerId} className={`rounded-2xl h-14 px-10 text-lg ${currentStance.bg} text-white hover:opacity-90`}>
                                <Dice5 className="mr-2 h-5 w-5" /> Roll Dice
                            </Button>
                        </div>
                    )}

                    {modalView === 'players' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {players.map((player) => {
                                const stance = getStance(player.stanceIndex);

                                return (
                                    <button key={player.id} onClick={() => { setSelectedPlayerId(player.id); setModalView('player'); }} className={`rounded-3xl border-2 ${stance.border} ${stance.soft} p-4 text-left hover:scale-[1.01] transition-transform`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`h-12 w-12 rounded-2xl ${stance.bg} text-white flex items-center justify-center font-black`}>{player.id}</div>
                                            <div>
                                                <div className="text-xl font-black">{player.name}</div>
                                                <div className={`text-sm font-bold ${stance.text}`}>{stance.label} · Square {player.position + 1}</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm text-slate-600">Owned cards: {player.ownedCards.length} · Votes: {player.votes.length}</div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {modalView === 'player' && selectedPlayer && (() => {
                        const stance = getStance(selectedPlayer.stanceIndex);

                        return (
                            <div className={`rounded-3xl border-2 ${stance.border} ${stance.soft} p-5`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`h-16 w-16 rounded-2xl ${stance.bg} text-white flex items-center justify-center font-black text-2xl`}>{selectedPlayer.id}</div>
                                    <div>
                                        <div className="text-3xl font-black">{selectedPlayer.name}</div>
                                        <div className={`font-bold ${stance.text}`}>{stance.label} · Square {selectedPlayer.position + 1}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-black mb-2">Owned Cards</h4>
                                        <div className="space-y-2">{selectedPlayer.ownedCards.length === 0 ? <div className="text-sm text-slate-500">No owned cards yet.</div> : selectedPlayer.ownedCards.map((card, i) => <div key={i} className="rounded-xl bg-white/80 p-3 font-bold text-sm">{card}</div>)}</div>
                                    </div>
                                    <div>
                                        <h4 className="font-black mb-2">Vote History</h4>
                                        <div className="space-y-2">{selectedPlayer.votes.length === 0 ? <div className="text-sm text-slate-500">No votes yet.</div> : selectedPlayer.votes.map((vote, i) => <div key={i} className="rounded-xl bg-white/80 p-3 text-sm flex justify-between gap-2"><span className="font-bold">{vote.title}</span><span>{String(vote.choice).toUpperCase()}</span></div>)}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {modalView === 'cards' && (
                        <div className="space-y-3">
                            <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 text-sm text-slate-600">Browse the current square/card types.</div>
                            {Object.entries(CARD_DECK).map(([deckName, cards]) => {
                                const config = SPACE_TYPES[deckName] || SPACE_TYPES.Policy;
                                const Icon = config.icon;

                                return (
                                    <details key={deckName} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                                        <summary className={`cursor-pointer p-4 font-black flex items-center gap-2 ${config.color}`}><Icon className="h-4 w-4" /> {config.label || deckName} · {cards.length} cards</summary>
                                        <div className="p-3 space-y-2">
                                            {cards.map((card, index) => (
                                                <details key={`${deckName}-${card.title}-${index}`} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                                    <summary className="cursor-pointer font-bold">{card.title}</summary>
                                                    <p className="text-sm text-slate-600 mt-2">{card.text}</p>
                                                    <div className="text-xs text-slate-500 mt-2">Individual {card.individual >= 0 ? '+' : ''}{card.individual} · Community {card.community >= 0 ? '+' : ''}{card.community}</div>
                                                </details>
                                            ))}
                                        </div>
                                    </details>
                                );
                            })}
                        </div>
                    )}

                    {modalView === 'events' && (
                        <div className="space-y-2">
                            {turnLog.length === 0 && <div className="text-slate-500">No events yet.</div>}
                            {turnLog.map((entry, index) => (
                                <div key={`${entry.title}-${index}`} className="rounded-2xl bg-slate-100 border border-slate-200 p-4">
                                    <div className="flex justify-between gap-2"><strong>{entry.title}</strong><span className="font-black text-yellow-700">{entry.result}</span></div>
                                    <div className="text-xs text-slate-500 mt-1">{entry.playerName} · {entry.category}</div>
                                    {entry.note && <div className="text-sm text-slate-600 mt-2">{entry.note}</div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {modalView === 'reveal' && revealedCard && (
                        <div className="space-y-4">
                            <div className="rounded-2xl bg-white border border-slate-200 p-4 text-slate-700 text-lg leading-relaxed">{revealedCard.text}</div>
                            <div className="rounded-2xl bg-slate-100 p-4"><strong>Owner:</strong> {revealedCard.ownerName}{revealedCard.ownerStance ? ` · ${revealedCard.ownerStance}` : ''}</div>
                            <div className="rounded-2xl bg-fuchsia-50 border border-fuchsia-200 p-4"><strong>Unexpected result:</strong> {revealedCard.tradeoff || revealedCard.logEntry.note}</div>
                            <Button onClick={revealAndContinue} className="w-full rounded-2xl h-12">Continue</Button>
                        </div>
                    )}

                    {modalView === 'result' && resultCard && (
                        <div className="space-y-4">
                            <div className="rounded-2xl bg-white border border-slate-200 p-4 text-slate-700 text-lg leading-relaxed">{resultCard.text}</div>
                            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4"><strong>Result:</strong> {resultCard.result}</div>
                            <div className="rounded-2xl bg-slate-100 p-4 text-sm">{resultCard.note}</div>
                            <div className="w-full rounded-2xl h-12 bg-slate-950 text-white flex items-center justify-center font-black">
                                Next turn in {resultCountdown}s
                            </div>
                        </div>
                    )}

                    {modalView === 'vote' && activeCard && (
                        <div className="space-y-4">
                            <div className="rounded-2xl bg-white border border-slate-200 p-4 text-slate-700 text-lg leading-relaxed">{activeCard.text}</div>
                            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4"><Crown className="inline h-4 w-4 mr-1" /><strong>Owner:</strong> {activeCard.playerName} · {activeCard.ownerStance}. Owner submits first.</div>

                            {activeCard.mode === 'event' && (
                                <div className="grid grid-cols-1 gap-2">
                                    {activeCard.responseOptions.map((option) => (
                                        <button key={option.key} disabled={!canChooseVote} onClick={() => setDraftVote(option.key)} className={`rounded-2xl border bg-white p-4 text-left transition-all ${draftVote === option.key ? 'border-yellow-400 ring-2 ring-yellow-200 bg-yellow-50' : activeCard.ownerSuggestion === option.key ? 'border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50' : 'border-slate-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black">{option.key}</div>
                                                <div className="flex-1">
                                                    <div className="font-black text-lg">{option.title}</div>
                                                    <div className="text-sm text-slate-500 mt-1">{option.description}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeCard.mode === 'policy' && <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-700"><strong>Tradeoff:</strong> {activeCard.tradeoff}</div>}
                            {activeCard.mode === 'quiz' && <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-3 text-sm text-indigo-950"><strong>Quiz:</strong> Vote whether this description sounds Good, Neutral, or Bad. The real leaning is revealed after voting.</div>}

                            <div className="space-y-2">
                                <div className="text-sm font-black">Everyone votes {activeCard.ownerSuggestion ? '' : '— waiting for owner to submit first'}</div>
                                {players.map((player) => {
                                    const stance = getStance(player.stanceIndex);
                                    const isOwner = player.id === activeCard.playerId;
                                    const isThisController = activeVotePlayerId === player.id;
                                    const hasVote = votes[player.id] !== undefined;

                                    return (
                                        <div key={player.id} className={`flex items-center justify-between gap-2 rounded-2xl border p-2 ${isOwner ? 'border-yellow-300 bg-yellow-50' : isThisController ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-8 w-8 rounded-xl ${stance.bg} text-white flex items-center justify-center text-xs font-black`}>{player.id}</div>
                                                <div>
                                                    <div className="text-sm font-black">{player.name} {isOwner && <span className="text-yellow-700">OWNER</span>} {isThisController && <span className="text-blue-700">YOU</span>}</div>
                                                    <div className="text-xs text-slate-500">{stance.label} · {hasVote ? `Submitted: ${getVoteLabel(activeCard, votes[player.id])}` : 'Waiting'}</div>
                                                </div>
                                            </div>
                                            {viewMode === 'local' && !votePlayerId ? renderVoteButtons(player) : isThisController ? renderVoteButtons(player) : <Badge className={hasVote ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}>{hasVote ? 'Submitted' : 'Waiting'}</Badge>}
                                        </div>
                                    );
                                })}
                            </div>

                            {viewMode === 'local' && !votePlayerId ? (
                                <div className="w-full rounded-2xl h-12 bg-slate-100 text-slate-500 flex items-center justify-center font-black">
                                    Local mode: select votes directly above
                                </div>
                            ) : (
                                <Button onClick={submitVote} disabled={!canSubmitDraftVote} className="w-full rounded-2xl h-12">
                                    {activeSubmittedVote ? 'Update My Vote' : 'Submit Vote'}
                                </Button>
                            )}
                        </div>
                    )}

                    {modalView === 'rules' && (
                        <div className="space-y-4">
                            <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4">
                                <h3 className="text-xl font-black mb-2">Objective</h3>
                                <p className="text-sm text-slate-600">LifeCurve is a society simulation game. Each faction tries to create the strongest quality-of-life curve over the game timeline.</p>
                            </div>
                            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4">
                                <h3 className="text-xl font-black mb-2">Voting</h3>
                                <p className="text-sm text-yellow-950">The owner submits first. Once every player has submitted, the host resolves automatically and the result auto-closes after six seconds.</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}
