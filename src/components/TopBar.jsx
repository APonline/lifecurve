import { useState } from "react";
import {
    Dice5,
    Landmark,
    RotateCcw,
    ScrollText,
    Users,
    Save,
    Menu as MenuIcon,
    BookOpen,
} from "lucide-react";
import { Badge, Button } from "./ui.jsx";

export default function TopBar({
    turn,
    maxTurns,
    winningTeam,
    taxPool,
    setModalView,
    resetToMenu,
    modalView,
    activeCard,
    revealedCard,
    resultCard,
    turnCountdown,
    viewMode,
    saveGame,
    publicCode,
    canRoll,
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-white/10 text-white hover:bg-white/10">
                        Turn {turn}/{maxTurns}
                    </Badge>

                    <Badge className="bg-white/10 text-white hover:bg-white/10">
                        Curve Turn {turn}
                    </Badge>

                    <Badge className={`${winningTeam.bg} text-white hover:${winningTeam.bg}`}>
                        Leading: {winningTeam.label}
                    </Badge>

                    <Badge className="bg-green-400 text-green-950 hover:bg-green-400">
                        Tax Pool: {taxPool}
                    </Badge>

                    <Badge className="bg-purple-400 text-purple-950 hover:bg-purple-400">
                        View: {viewMode}
                    </Badge>

                    {publicCode && (
                        <Badge className="bg-cyan-500 text-cyan-950 hover:bg-cyan-500">
                            Room: {publicCode}
                        </Badge>
                    )}
                </div>

                <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-2">
                    LifeCurve
                </h1>
            </div>

            <div className="relative flex gap-2 flex-wrap justify-start lg:justify-end">
                <Button
                    onClick={() => setModalView("turn")}
                    disabled={!canRoll || !!activeCard || !!revealedCard || !!resultCard}
                    variant="secondary"
                    className="rounded-2xl"
                >
                    <Dice5 className="mr-2 h-4 w-4" />
                    Turn {canRoll && modalView === "closed" && !activeCard && !revealedCard && !resultCard ? `(${turnCountdown})` : ""}
                </Button>

                {activeCard && (
                    <Button
                        onClick={() => setModalView("vote")}
                        variant="secondary"
                        className="rounded-2xl bg-yellow-100 text-yellow-950 hover:bg-yellow-100"
                    >
                        Active Card
                    </Button>
                )}

                {resultCard && (
                    <Button
                        onClick={() => setModalView("result")}
                        variant="secondary"
                        className="rounded-2xl bg-yellow-100 text-yellow-950 hover:bg-yellow-100"
                    >
                        Result
                    </Button>
                )}

                {revealedCard && (
                    <Button
                        onClick={() => setModalView("reveal")}
                        variant="secondary"
                        className="rounded-2xl bg-yellow-100 text-yellow-950 hover:bg-yellow-100"
                    >
                        Reveal
                    </Button>
                )}

                <Button
                    onClick={() => setMenuOpen((open) => !open)}
                    variant="secondary"
                    className="rounded-2xl"
                >
                    <MenuIcon className="mr-2 h-4 w-4" />
                    More
                </Button>

                {menuOpen && (
                    <div className="absolute right-0 top-14 z-50 w-56 rounded-3xl bg-white text-slate-950 border border-slate-200 shadow-2xl p-2 space-y-2">
                        <Button onClick={() => { setModalView("players"); setMenuOpen(false); }} variant="ghost" className="w-full justify-start rounded-2xl">
                            <Users className="mr-2 h-4 w-4" /> Players
                        </Button>

                        <Button onClick={() => { setModalView("events"); setMenuOpen(false); }} variant="ghost" className="w-full justify-start rounded-2xl">
                            <ScrollText className="mr-2 h-4 w-4" /> Events
                        </Button>

                        <Button onClick={() => { setModalView("cards"); setMenuOpen(false); }} variant="ghost" className="w-full justify-start rounded-2xl">
                            <Landmark className="mr-2 h-4 w-4" /> Cards
                        </Button>

                        <Button onClick={() => { setModalView("rules"); setMenuOpen(false); }} variant="ghost" className="w-full justify-start rounded-2xl">
                            <BookOpen className="mr-2 h-4 w-4" /> Rules
                        </Button>

                        <Button onClick={() => { saveGame(); setMenuOpen(false); }} variant="ghost" className="w-full justify-start rounded-2xl">
                            <Save className="mr-2 h-4 w-4" /> Save
                        </Button>

                        <Button onClick={resetToMenu} variant="ghost" className="w-full justify-start rounded-2xl text-red-700 hover:text-red-800">
                            <RotateCcw className="mr-2 h-4 w-4" /> Menu
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}