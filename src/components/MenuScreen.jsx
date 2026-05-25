import {
    Play,
    Bot,
    UserPlus,
    Crown,
    Copy,
    Link2,
    User,
    Lock,
} from "lucide-react";
import { Badge, Button, Card, CardContent } from "./ui.jsx";
import StanceTrack from "./StanceTrack.jsx";
import { GAME_LENGTHS } from "../data/constants.js";
import { createPlayers, getStance } from "../logic/gameHelpers.js";

export default function MenuScreen({
    playerCount,
    players,
    gameLengthKey,
    setGameLengthKey,
    configurePlayers,
    updatePlayer,
    startGame,
    createHostLobby,
    publicCode,
    playMode,
    setPlayMode,
    dataMode,
    setDataMode,
    setPlayers,
    loadCode,
    setLoadCode,
    loadLobby,
    joinedPlayerId,
    claimPlayerSlot,
}) {
    const isJoinMode = playMode === "join";
    const isHostMode = playMode === "host";

    const setMode = (modeKey) => {
        setPlayMode(modeKey);
        setPlayers(createPlayers(playerCount, modeKey));
    };

    const joinLink = publicCode
        ? `${window.location.origin}?room=${publicCode}`
        : "";

    const copyRoomCode = () => {
        if (!publicCode) return;
        navigator.clipboard.writeText(publicCode);
        alert("Room code copied.");
    };

    const copyJoinLink = () => {
        if (!joinLink) return;
        navigator.clipboard.writeText(joinLink);
        alert("Join link copied.");
    };

    const canEditPlayer = (player) => {
        if (playMode === "join") {
            return joinedPlayerId === player.id;
        }

        return true;
    };

    const renderPlayerTypeControls = (player) => {

        const isHostPlayer =
            player.connectionType === "host";

        const isRemotePlayer =
            player.connectionType === "remote";

        const isAiPlayer =
            player.connectionType === "ai";

        const isOpenPlayer =
            player.connectionType === "open";

        const isJoinedPlayer =
            joinedPlayerId === player.id;

        const isClaimable =
            playMode === "join" &&
            !joinedPlayerId &&
            player.connectionType === "open";

        return (
            <div className="mt-4 flex flex-wrap gap-2 items-center">

                {/* HOST */}
                {isHostPlayer && (
                    <Badge className="bg-green-700 text-white hover:bg-green-700 rounded-xl px-3 py-1">
                        <Crown className="h-3 w-3 mr-1" />
                        Host
                    </Badge>
                )}

                {/* YOU */}
                {isJoinedPlayer && (
                    <Badge className="bg-green-700 text-white hover:bg-green-700 rounded-xl px-3 py-1">
                        <User className="h-3 w-3 mr-1" />
                        You
                    </Badge>
                )}

                {/* REMOTE CONNECTED PLAYER */}
                {isRemotePlayer && !isJoinedPlayer && (
                    <Badge className="bg-green-700 text-white hover:bg-green-700 rounded-xl px-3 py-1">
                        ● Player
                    </Badge>
                )}

                {/* AI */}
                {isAiPlayer && (
                    <Badge className="bg-purple-700 text-white hover:bg-purple-700 rounded-xl px-3 py-1">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Player
                    </Badge>
                )}

                {/* WAITING */}
                {isOpenPlayer && (
                    <Badge className="bg-slate-950 text-white hover:bg-slate-950 rounded-xl px-3 py-1">
                        Waiting for player
                    </Badge>
                )}

                {/* CLAIM SLOT */}
                {isClaimable && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => claimPlayerSlot(player.id)}
                        className="rounded-xl font-black"
                    >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Claim Slot
                    </Button>
                )}

                {/* HOST AI/OPEN TOGGLE */}
                {playMode === "host" &&
                    player.id !== 1 &&
                    !isRemotePlayer && (
                    <Button
                        type="button"
                        size="sm"
                        variant={isAiPlayer ? "default" : "outline"}
                        onClick={() => {

                            const nextIsAi =
                                player.connectionType !== "ai";

                            updatePlayer(player.id, {
                                connectionType: nextIsAi
                                    ? "ai"
                                    : "open",
                                isAI: nextIsAi,
                            });
                        }}
                        className="rounded-xl font-black"
                    >
                        {isAiPlayer ? (
                            <>
                                <Bot className="h-4 w-4 mr-1" />
                                AI Slot
                            </>
                        ) : (
                            <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Open Slot
                            </>
                        )}
                    </Button>
                )}

            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b,#020617_55%)] text-white p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-6">
                <Card className="bg-white text-slate-950 rounded-[2rem] shadow-2xl overflow-hidden">
                    <CardContent className="p-7 space-y-5">
                        <div>
                            <Badge className="mb-4 bg-slate-950 text-white hover:bg-slate-950 rounded-full px-4">
                                Refactored Prototype V1
                            </Badge>

                            <h1 className="text-5xl font-black tracking-tight">
                                LifeCurve
                            </h1>

                            <p className="mt-3 text-slate-600 text-lg leading-relaxed">
                                A faction-based society game where every card favours the political spectrum.
                            </p>
                        </div>

                        <section className="space-y-3">
                            <h2 className="text-xl font-black">Play Mode</h2>

                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { key: "local", label: "Local" },
                                    { key: "solo", label: "Solo vs AI" },
                                    { key: "host", label: "Host" },
                                    { key: "join", label: "Join" },
                                ].map((mode) => (
                                    <Button
                                        key={mode.key}
                                        onClick={() => setMode(mode.key)}
                                        variant={playMode === mode.key ? "default" : "outline"}
                                        className="rounded-2xl h-14 text-sm font-black"
                                    >
                                        {mode.label}
                                    </Button>
                                ))}
                            </div>
                        </section>

                        {isJoinMode ? (
                            <section className="rounded-3xl bg-slate-950 text-white p-5 space-y-4 border border-slate-800 shadow-xl">
                                <div>
                                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">
                                        Join Lobby
                                    </div>

                                    <p className="text-sm text-slate-300 mt-2">
                                        Enter the host code, join the lobby, then claim an open player slot.
                                    </p>
                                </div>

                                <input
                                    value={loadCode}
                                    onChange={(event) => setLoadCode(event.target.value.toUpperCase())}
                                    placeholder="Enter room code"
                                    className="w-full rounded-2xl border border-white/20 bg-white text-slate-950 px-4 py-4 font-black outline-none"
                                />

                                <Button
                                    onClick={() => loadLobby(loadCode)}
                                    disabled={!loadCode.trim()}
                                    variant="secondary"
                                    className="w-full rounded-2xl h-14 font-black"
                                >
                                    <UserPlus className="mr-2 h-5 w-5" />
                                    Join Lobby
                                </Button>

                                {publicCode && (
                                    <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                                        <div className="text-xs uppercase tracking-[0.15em] text-slate-400 font-black">
                                            Connected to
                                        </div>

                                        <div className="text-2xl font-black tracking-widest mt-1">
                                            {publicCode}
                                        </div>
                                    </div>
                                )}
                            </section>
                        ) : (
                            <>
                                <section className="space-y-3">
                                    <h2 className="text-xl font-black">Players</h2>

                                    <div className="grid grid-cols-4 gap-3">
                                        {[2, 3, 4, 5].map((count) => (
                                            <Button
                                                key={count}
                                                onClick={() => configurePlayers(count)}
                                                variant={playerCount === count ? "default" : "outline"}
                                                className="rounded-2xl h-14 text-lg font-black"
                                            >
                                                {count}
                                            </Button>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h2 className="text-xl font-black">Data Mode</h2>

                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: "fun", label: "Fun Mode" },
                                            { key: "serious", label: "Serious Mode" },
                                        ].map((mode) => (
                                            <Button
                                                key={mode.key}
                                                onClick={() => setDataMode(mode.key)}
                                                variant={dataMode === mode.key ? "default" : "outline"}
                                                className="rounded-2xl h-14 font-black"
                                            >
                                                {mode.label}
                                            </Button>
                                        ))}
                                    </div>
                                </section>

                                <section className="grid grid-cols-1 gap-3">
                                    {GAME_LENGTHS.map((length) => (
                                        <button
                                            key={length.key}
                                            onClick={() => setGameLengthKey(length.key)}
                                            className={`text-left rounded-2xl border p-4 transition-all ${
                                                gameLengthKey === length.key
                                                    ? "bg-slate-950 text-white border-slate-950 shadow-lg"
                                                    : "bg-white text-slate-950 border-slate-200 hover:border-slate-400"
                                            }`}
                                        >
                                            <div className="font-black">
                                                {length.label} · {length.turns} turns
                                            </div>

                                            <div className="text-sm opacity-75 mt-1">
                                                {length.description}
                                            </div>
                                        </button>
                                    ))}
                                </section>
                            </>
                        )}

                        {isHostMode && publicCode && (
                            <section className="rounded-3xl bg-slate-950 text-white p-5 space-y-3 border border-slate-800 shadow-xl">
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">
                                    Host Lobby Code
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-4xl font-black tracking-widest">
                                        {publicCode}
                                    </div>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={copyRoomCode}
                                        className="rounded-2xl shrink-0"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </Button>
                                </div>

                                <div className="rounded-2xl bg-white/10 border border-white/10 p-3 text-xs break-all text-slate-200">
                                    {joinLink}
                                </div>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={copyJoinLink}
                                    className="w-full rounded-2xl h-12 font-black"
                                >
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Copy Join Link
                                </Button>
                            </section>
                        )}

                        {!isJoinMode && (
                            isHostMode && !publicCode ? (
                                <Button
                                    onClick={createHostLobby}
                                    className="w-full rounded-2xl h-14 text-base font-black"
                                >
                                    <UserPlus className="mr-2 h-5 w-5" />
                                    Create Lobby
                                </Button>
                            ) : (
                                <Button
                                    onClick={startGame}
                                    className="w-full rounded-2xl h-14 text-base font-black"
                                >
                                    <Play className="mr-2 h-5 w-5" />
                                    {isHostMode ? "Start Hosted Game" : "New Game"}
                                </Button>
                            )
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/10 text-white rounded-[2rem] shadow-2xl">
                    <CardContent className="p-6 space-y-5">
                        <div>
                            <h2 className="text-3xl font-black">
                                {isJoinMode ? "Lobby Players" : "Set Player Stances"}
                            </h2>

                            <p className="text-slate-300 text-sm mt-1">
                                {isJoinMode
                                    ? "Claim an open slot. You can only edit your own player."
                                    : "Pick one of five snapping positions. Players start in the center by default."}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {players.map((player) => {
                                const stance = getStance(player.stanceIndex ?? 2);
                                const editable = canEditPlayer(player);

                                return (
                                    <div
                                        key={player.id}
                                        className={`rounded-[1.75rem] border-2 ${stance.border} ${stance.soft} text-slate-950 p-5 shadow-sm`}
                                    >
                                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-center">
                                            <div className="flex items-start gap-4 min-w-0">
                                                <div className={`h-12 w-12 rounded-2xl ${stance.bg} text-white flex items-center justify-center font-black text-lg shrink-0`}>
                                                    {player.id}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <input
                                                        value={player.name}
                                                        disabled={!editable}
                                                        onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
                                                        className={`bg-white border border-slate-200 rounded-xl px-4 py-2 font-black outline-none w-full max-w-[260px] ${
                                                            !editable ? "opacity-60 cursor-not-allowed" : ""
                                                        }`}
                                                    />

                                                    <div className={`text-sm font-black ${stance.text} mt-2 leading-snug max-w-[420px]`}>
                                                        {stance.label} · {stance.description}
                                                    </div>

                                                    {renderPlayerTypeControls(player)}
                                                </div>
                                            </div>

                                            <div className={`w-full ${!editable ? "opacity-50 pointer-events-none" : ""}`}>
                                                <StanceTrack
                                                    value={player.stanceIndex ?? 2}
                                                    onChange={(stanceIndex) => updatePlayer(player.id, { stanceIndex })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}