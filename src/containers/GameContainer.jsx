import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Dice5, Sparkles } from "lucide-react";
import { Badge, Button, Card, CardContent } from "../components/ui.jsx";
import MenuScreen from "../components/MenuScreen.jsx";
import TopBar from "../components/TopBar.jsx";
import GameBoard from "../components/GameBoard.jsx";
import PlayerBar from "../components/PlayerBar.jsx";
import { getAIVote } from "../logic/aiPlayers.js";
import LandingRevealModal from "../components/LandingRevealModal.jsx";
import GameModal from "../components/GameModal.jsx";
import {
    BOARD_SIZE,
    GAME_LENGTHS,
    INITIAL_TEAM_SCORES,
    PASS_GO_TAX_PER_TEAM,
    STANCES,
} from "../data/constants.js";
import { BOARD_SPACES } from "../data/boardSpaces.js";
import { CARD_DECK } from "../data/cards.js";
import { applyTeamImpact, getPolicyImpact } from "../logic/scoring.js";
import { getEventResponseOptions, getWinningResponse } from "../logic/voting.js";
import {
    createPlayers,
    getAgeForTurn,
    getStance,
    getStanceByKey,
    randomFrom,
} from "../logic/gameHelpers.js";
import {
    createGameApi,
    saveGameApi,
    loadGameApi,
} from "../services/gameService.js";
import {
    connectSocket,
    disconnectSocket,
    hostJoinRoom,
    sendGameState,
    joinSocketRoom,
    sendLobbyState,
    sendGameStart,
    listenForGameState,
    listenForGameStart,
} from "../services/socketService.js";

export default function GameContainer() {
    const [showLanding, setShowLanding] = useState(true);
    const [screen, setScreen] = useState("menu");
    const [playerCount, setPlayerCount] = useState(3);
    const [gameLengthKey, setGameLengthKey] = useState("short");
    const [players, setPlayers] = useState(createPlayers(3));
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [dice, setDice] = useState(null);
    const [turn, setTurn] = useState(0);
    const [teamScores, setTeamScores] = useState(INITIAL_TEAM_SCORES);
    const [taxPool, setTaxPool] = useState(0);
    const [points, setPoints] = useState([
        { turn: 0, age: 0, baseline: 0, ...INITIAL_TEAM_SCORES },
    ]);
    const [activeCard, setActiveCard] = useState(null);
    const [votes, setVotes] = useState({});
    const [revealedCard, setRevealedCard] = useState(null);
    const [passedCards, setPassedCards] = useState([]);
    const [turnLog, setTurnLog] = useState([]);
    const [gameOver, setGameOver] = useState(false);
    const [modalView, setModalView] = useState("closed");
    const [turnCountdown, setTurnCountdown] = useState(20);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [resultCard, setResultCard] = useState(null);
    const [movingPlayerId, setMovingPlayerId] = useState(null);
    const [landingReveal, setLandingReveal] = useState(null);

    const [gameId, setGameId] = useState(null);
    const [publicCode, setPublicCode] = useState(null);
    const [loadCode, setLoadCode] = useState("");
    const [joinedPlayerId, setJoinedPlayerId] = useState(null);

    const urlParams = new URLSearchParams(window.location.search);
    const viewMode = urlParams.get("view") || "local";
    const controlledPlayerId = Number(urlParams.get("player") || 1);

    const [playMode, setPlayMode] = useState("local");
    const [dataMode, setDataMode] = useState("fun");

    const selectedGameLength =
        GAME_LENGTHS.find((item) => item.key === gameLengthKey) ||
        GAME_LENGTHS[0];

    const maxTurns = selectedGameLength.turns;
    const currentAge = getAgeForTurn(turn, maxTurns);
    const currentPlayer = players[currentPlayerIndex] || players[0];
    const currentStance = currentPlayer
        ? getStance(currentPlayer.stanceIndex)
        : STANCES[2];

    const canResolveVote =
        activeCard &&
        Object.keys(votes).length === players.length;

    const winningTeam = STANCES.reduce(
        (best, stance) =>
            teamScores[stance.key] > teamScores[best.key]
                ? stance
                : best,
        STANCES[0]
    );

    const selectedPlayer = players.find(
        (player) => player.id === selectedPlayerId
    );

    const isLocalView = viewMode === "local";
    const isHostView = viewMode === "host";
    const canShowPrivateControls = !isHostView;
    const hostPlayerId = players.find((player) => player.connectionType === "host")?.id || 1;
    const votePlayerId = playMode === "join"
        ? joinedPlayerId
        : playMode === "host"
            ? hostPlayerId
            : null;
    const canControlCurrentPlayer =
        playMode === "join"
            ? currentPlayer?.id === joinedPlayerId
            : playMode === "host"
                ? currentPlayer?.connectionType === "host" || currentPlayer?.connectionType === "local"
                : isLocalView || currentPlayer?.id === controlledPlayerId;
    const canRoll = canShowPrivateControls && canControlCurrentPlayer;
    const shouldShowTurnModal = canRoll && modalView === "turn";

    useEffect(() => {
        connectSocket();

        return () => {
            disconnectSocket();
        };
    }, []);

    useEffect(() => {
        listenForGameState((gameState) => {
            const state = gameState?.state || gameState || {};
            const isActiveGame =
                state.status === "active" ||
                gameState?.status === "active";

            if (!isActiveGame) {
                if (playMode !== "host" && state.players) {
                    setPlayers(state.players);
                }

                return;
            }

            if (state.players) {
                setPlayers(state.players);
            }

            setPlayMode((existing) => {
                if (existing === "join") return "join";
                if (existing === "host") return "host";

                return state.playMode || gameState.play_mode || "host";
            });
            setDataMode(state.dataMode || gameState.data_mode || "fun");
            setPlayerCount(state.playerCount || state.players?.length || 3);
            setGameLengthKey(state.gameLengthKey || "short");
            setCurrentPlayerIndex(state.currentPlayerIndex || 0);
            setDice(state.dice || null);
            setTurn(state.turn || 0);
            setTeamScores(state.teamScores || INITIAL_TEAM_SCORES);
            setTaxPool(state.taxPool || 0);
            setPoints(
                state.points || [
                    { turn: 0, age: 0, baseline: 0, ...INITIAL_TEAM_SCORES },
                ]
            );
            setPassedCards(state.passedCards || []);
            setTurnLog(state.turnLog || []);
            setGameOver(state.gameOver || false);

            setActiveCard(state.activeCard || null);
            setVotes(state.votes || {});
            setRevealedCard(state.revealedCard || null);
            setResultCard(state.resultCard || null);
            setLandingReveal(state.landingReveal || null);
            setMovingPlayerId(state.movingPlayerId || null);
            setModalView(state.modalView || "closed");
            setTurnCountdown(state.turnCountdown || 20);

            setScreen("game");
        });
    }, []);

    useEffect(() => {
        listenForGameStart((gameState) => {
            const state = gameState?.state || gameState || {};

            if (state.players) {
                setPlayers(state.players);
            }

            setPlayMode((existing) => {
                if (existing === "join") return "join";
                if (existing === "host") return "host";

                return state.playMode || gameState.play_mode || "host";
            });
            setDataMode(state.dataMode || gameState.data_mode || "fun");
            setPlayerCount(state.playerCount || state.players?.length || 3);
            setGameLengthKey(state.gameLengthKey || "short");
            setCurrentPlayerIndex(state.currentPlayerIndex || 0);
            setDice(state.dice || null);
            setTurn(state.turn || 0);
            setTeamScores(state.teamScores || INITIAL_TEAM_SCORES);
            setTaxPool(state.taxPool || 0);
            setPoints(
                state.points || [
                    { turn: 0, age: 0, baseline: 0, ...INITIAL_TEAM_SCORES },
                ]
            );
            setPassedCards(state.passedCards || []);
            setTurnLog(state.turnLog || []);
            setGameOver(state.gameOver || false);

            setActiveCard(state.activeCard || null);
            setVotes(state.votes || {});
            setRevealedCard(state.revealedCard || null);
            setResultCard(state.resultCard || null);
            setLandingReveal(state.landingReveal || null);
            setMovingPlayerId(state.movingPlayerId || null);
            setModalView(state.modalView || "closed");
            setTurnCountdown(state.turnCountdown || 20);

            setScreen("game");
        });
    }, []);

    useEffect(() => {
        const roomCode = urlParams.get("room");

        if (!roomCode) return;
        if (publicCode) return;

        setPlayMode("join");
        setLoadCode(roomCode.toUpperCase());
        loadLobby(roomCode.toUpperCase());
    }, []);

    useEffect(() => {
        if (screen !== "menu") return;
        if (!publicCode) return;
        if (playMode !== "host") return;

        sendLobbyState({
            roomCode: publicCode,
            players,
        });
    }, [screen, publicCode, playMode, players]);

    // useEffect(() => {
    //     if (screen !== "game") return;
    //     if (!publicCode) return;
    //     if (playMode !== "host") return;

    //     const snapshot = buildGameSnapshot();

    //     sendGameState({
    //         roomCode: publicCode,
    //         gameState: snapshot,
    //     });

    //     const saveTimeout = setTimeout(() => {
    //         saveGame();
    //     }, 1500);

    //     return () => clearTimeout(saveTimeout);
    // }, [
    //     screen,
    //     publicCode,
    //     playMode,
    //     turn,
    //     currentPlayerIndex,
    // ]);

    // useEffect(() => {
    //     if (screen !== "game") return;
    //     if (!publicCode) return;
    //     if (playMode !== "host") return;

    //     const snapshot = buildGameSnapshot();

    //     sendGameState({
    //         roomCode: publicCode,
    //         gameState: snapshot,
    //     });

    //     const saveTimeout = setTimeout(() => {
    //         saveGame();
    //     }, 1200);

    //     return () => clearTimeout(saveTimeout);
    // }, [
    //     screen,
    //     publicCode,
    //     playMode,
    //     turn,
    //     currentPlayerIndex,
    //     activeCard,
    //     revealedCard,
    //     resultCard,
    //     passedCards,
    //     teamScores,
    //     taxPool,
    // ]);

    useEffect(() => {
        const saveBeforeClose = () => {
            saveGame();
        };

        window.addEventListener("beforeunload", saveBeforeClose);

        return () => {
            window.removeEventListener("beforeunload", saveBeforeClose);
        };
    }, [publicCode, turn, currentPlayerIndex]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLanding(false);
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (
            screen !== "game" ||
            gameOver ||
            !canRoll ||
            currentPlayer?.isAI ||
            activeCard ||
            revealedCard ||
            resultCard ||
            landingReveal ||
            modalView !== "closed"
        ) {
            return;
        }

        setTurnCountdown(20);

        const interval = setInterval(() => {
            setTurnCountdown((current) => {
                if (current <= 1) {
                    clearInterval(interval);
                    setModalView("turn");
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [
        screen,
        gameOver,
        activeCard,
        revealedCard,
        resultCard,
        landingReveal,
        modalView,
        currentPlayerIndex,
        currentPlayer?.isAI,
        canRoll,
    ]);

    useEffect(() => {
        if (playMode !== "host") return;
        if (!activeCard || !activeCard.ownerSuggestion) return;

        const aiPlayers = players.filter(
            (player) => player.isAI && votes[player.id] === undefined
        );

        if (!aiPlayers.length) return;

        aiPlayers.forEach((player, index) => {
            setTimeout(() => {
                const vote = getAIVote(
                    {
                        ...player,
                        stanceKey: getStance(player.stanceIndex).key,
                    },
                    activeCard
                );

                if (vote) {
                    castVote(player.id, vote);
                }
            }, 700 + index * 650);
        });
    }, [activeCard, activeCard?.ownerSuggestion, players, votes]);

    useEffect(() => {
        if (screen !== "game") return;
        if (gameOver) return;
        if (!currentPlayer?.isAI) return;

        if (
            activeCard ||
            revealedCard ||
            resultCard ||
            landingReveal ||
            movingPlayerId ||
            modalView !== "closed"
        ) {
            return;
        }

        const timer = setTimeout(() => {
            rollDice();
        }, 2200);

        return () => clearTimeout(timer);
    }, [
        screen,
        gameOver,
        currentPlayer,
        activeCard,
        revealedCard,
        resultCard,
        landingReveal,
        movingPlayerId,
        modalView,
    ]);

    useEffect(() => {
        if (playMode !== "host") return;
        if (!activeCard || activeCard.ownerSuggestion) return;

        const owner = players.find(
            (player) => player.id === activeCard.playerId
        );

        if (!owner?.isAI) return;

        const timer = setTimeout(() => {
            const vote = getAIVote(
                {
                    ...owner,
                    stanceKey: getStance(owner.stanceIndex).key,
                },
                activeCard
            );

            if (vote) {
                setOwnerSuggestion(vote);
            }
        }, 900);

        return () => clearTimeout(timer);
    }, [activeCard, activeCard?.ownerSuggestion, players]);

    useEffect(() => {
        if (playMode !== "host") return;
        if (modalView !== "result") return;
        if (!resultCard) return;

        const timer = setTimeout(() => {
            continueAfterResult();
        }, 6000);

        return () => clearTimeout(timer);
    }, [
        playMode,
        modalView,
        resultCard,
    ]);

    const chartData = useMemo(() => {
        const currentPoint = {
            turn,
            age: currentAge,
            baseline: currentAge,
            ...teamScores,
        };
        const withoutCurrent = points.filter((point) => point.turn !== turn);

        return [...withoutCurrent, currentPoint].sort(
            (a, b) => a.turn - b.turn
        );
    }, [points, turn, currentAge, teamScores]);

    const maxChartValue = useMemo(() => {
        const allValues = chartData.flatMap((point) =>
            STANCES.map((stance) => point[stance.key] || 0)
        );
        const highest = Math.max(100, ...allValues);
        const lowest = Math.min(0, ...allValues);

        return {
            top: Math.ceil((highest + 10) / 10) * 10,
            bottom: Math.floor((lowest - 10) / 10) * 10,
        };
    }, [chartData]);

    const boardRows = useMemo(
        () => ({
            top: BOARD_SPACES.slice(0, 8),
            right: BOARD_SPACES.slice(8, 14),
            bottom: BOARD_SPACES.slice(14, 22).reverse(),
            left: BOARD_SPACES.slice(22, 28).reverse(),
        }),
        []
    );

    const buildGameSnapshot = () => ({
        game_id: gameId,
        public_code: publicCode,
        play_mode: playMode,
        data_mode: dataMode,
        status: gameOver ? "complete" : "active",
        max_turns: maxTurns,
        players,
        state: {
            version: 1,
            status: "active",
            savedAt: new Date().toISOString(),
            publicCode,
            playMode,
            dataMode,
            playerCount,
            gameLengthKey,
            players,
            currentPlayerIndex,
            dice,
            turn,
            teamScores,
            taxPool,
            points,
            passedCards,
            turnLog,
            gameOver,
            activeCard,
            votes,
            revealedCard,
            resultCard,
            landingReveal,
            movingPlayerId,
            modalView,
            turnCountdown,
            selectedPlayerId,
        },
    });

    const syncGameState = (overrideState = {}) => {
        if (playMode !== "host") return;
        if (!publicCode) return;

        const baseSnapshot = buildGameSnapshot();

        const snapshot = {
            ...baseSnapshot,
            ...overrideState,
            state: {
                ...baseSnapshot.state,
                ...(overrideState.state || {}),
            },
        };

        sendGameState({
            roomCode: publicCode,
            gameState: snapshot,
        });
    };

    const broadcastGameState = (overrideState = {}) => {
        const roomCode = publicCode || loadCode;

        if (!roomCode) return;

        const baseSnapshot = buildGameSnapshot();

        sendGameState({
            roomCode,
            gameState: {
                ...baseSnapshot,
                ...overrideState,
                status: "active",
                state: {
                    ...baseSnapshot.state,
                    status: "active",
                    ...(overrideState.state || {}),
                },
            },
        });
    };

    const updatePlayer = (playerId, updates) => {
        setPlayers((existing) => {
            const nextPlayers = existing.map((player) =>
                player.id === playerId
                    ? { ...player, ...updates }
                    : player
            );

            if (publicCode && screen === "menu") {
                sendLobbyState({
                    roomCode: publicCode,
                    players: nextPlayers,
                });
            }

            return nextPlayers;
        });
    };

    const configurePlayers = (count) => {
        setPlayerCount(count);
        setPlayers(createPlayers(count, playMode));
    };

    const claimPlayerSlot = (playerId) => {
        const roomCode = publicCode || loadCode;

        if (!roomCode) {
            alert("Join a lobby first.");
            return;
        }

        const nextPlayers = players.map((player) => {
            if (player.id !== playerId) {
                return player;
            }

            return {
                ...player,
                connectionType: "remote",
                isAI: false,
                name: player.name || `Player ${playerId}`,
            };
        });

        const claimedPlayer = nextPlayers.find(
            (player) => player.id === playerId
        );

        setJoinedPlayerId(playerId);
        setPlayers(nextPlayers);

        joinSocketRoom({
            roomCode,
            player: {
                playerId,
                name: claimedPlayer?.name || `Player ${playerId}`,
            },
        });

        sendLobbyState({
            roomCode,
            players: nextPlayers,
        });
    };

    const loadLobby = async (code) => {
        const cleanCode = String(code || "").trim().toUpperCase();

        if (!cleanCode) {
            alert("Room code is required.");
            return;
        }

        const response = await loadGameApi(cleanCode);

        if (!response.success) {
            alert(response.error || "Unable to load lobby.");
            return;
        }

        const state = response.state || {};

        setGameId(response.game.id);
        setPublicCode(response.game.public_code);
        setLoadCode(response.game.public_code);

        setPlayMode("join");
        setDataMode(state.dataMode || response.game.data_mode || "fun");
        setPlayerCount(state.playerCount || 3);
        setGameLengthKey(state.gameLengthKey || "short");
        setPlayers(state.players || createPlayers(3, "join"));

        joinSocketRoom({
            roomCode: response.game.public_code,
            player: {
                playerId: null,
                name: "Lobby Viewer",
            },
        });

        setScreen("menu");
    };

    const loadGame = async (code) => {
        const response = await loadGameApi(code);

        if (!response.success) {
            alert(response.error || "Unable to load game.");
            return;
        }

        const state = response.state || {};

        setGameId(response.game.id);
        setPublicCode(response.game.public_code);
        setLoadCode(response.game.public_code);

        setPlayMode(state.playMode || response.game.play_mode || "local");
        setDataMode(state.dataMode || response.game.data_mode || "fun");
        setPlayerCount(state.playerCount || 3);
        setGameLengthKey(state.gameLengthKey || "short");
        setPlayers(state.players || createPlayers(3));
        setCurrentPlayerIndex(state.currentPlayerIndex || 0);
        setDice(state.dice || null);
        setTurn(state.turn || 0);
        setTeamScores(state.teamScores || INITIAL_TEAM_SCORES);
        setTaxPool(state.taxPool || 0);
        setPoints(
            state.points || [
                { turn: 0, age: 0, baseline: 0, ...INITIAL_TEAM_SCORES },
            ]
        );
        setPassedCards(state.passedCards || []);
        setTurnLog(state.turnLog || []);
        setGameOver(state.gameOver || false);

        setActiveCard(null);
        setVotes({});
        setRevealedCard(null);
        setResultCard(null);
        setLandingReveal(null);
        setMovingPlayerId(null);
        setModalView("closed");

        setScreen("game");
    };

    const saveGame = async () => {
        const snapshot = buildGameSnapshot();

        localStorage.setItem(
            "lifecurve_current_game",
            JSON.stringify(snapshot)
        );

        if (!publicCode) {
            return;
        }

        const result = await saveGameApi(snapshot);

        console.log("Saved:", result);
    };

    const createHostLobby = async () => {
        const response = await createGameApi({
            play_mode: "host",
            data_mode: dataMode,
            max_turns: maxTurns,
            players,
            state: {
                version: 1,
                status: "setup",
                playMode: "host",
                dataMode,
                playerCount,
                gameLengthKey,
                players,
            },
        });

        if (!response.success) {
            alert(response.error || "Unable to create host lobby.");
            return;
        }

        setGameId(response.game.id);
        setPublicCode(response.game.public_code);
        setLoadCode(response.game.public_code);

        hostJoinRoom({
            roomCode: response.game.public_code,
            gameState: {
                status: "setup",
                playMode: "host",
                dataMode,
                playerCount,
                gameLengthKey,
                players,
            },
        });
    };

    const startGame = async () => {
        let activeGameId = gameId;
        let activePublicCode = publicCode;

        if (!activePublicCode) {
            const response = await createGameApi({
                play_mode: playMode,
                data_mode: dataMode,
                max_turns: maxTurns,
            });

            if (!response.success) {
                alert(response.error || "Unable to create game.");
                return;
            }

            activeGameId = response.game.id;
            activePublicCode = response.game.public_code;

            setGameId(activeGameId);
            setPublicCode(activePublicCode);
            setLoadCode(activePublicCode);
        }

        const resetPlayers = players.map((player, index) => {
            const isHostMode = playMode === "host";
            const isSoloAi = playMode === "solo" && index !== 0;

            return {
                ...player,
                name: playMode === "solo" && index === 0 ? "You" : player.name,
                position: 0,
                votes: [],
                ownedCards: [],
                isAI: isHostMode ? player.connectionType === "ai" : isSoloAi,
                stanceKey: getStance(player.stanceIndex).key,
                connectionType: isHostMode
                    ? index === 0
                        ? "host"
                        : player.connectionType || "open"
                    : isSoloAi
                        ? "ai"
                        : player.connectionType || "local",
                remoteSocketId: player.remoteSocketId || null,
            };
        });

        const initialPoints = [
            { turn: 0, age: 0, baseline: 0, ...INITIAL_TEAM_SCORES },
        ];

        setScreen("game");
        setCurrentPlayerIndex(0);
        setDice(null);
        setTurn(0);
        setTeamScores(INITIAL_TEAM_SCORES);
        setTaxPool(0);
        setPoints(initialPoints);
        setActiveCard(null);
        setVotes({});
        setRevealedCard(null);
        setPassedCards([]);
        setTurnLog([]);
        setGameOver(false);
        setModalView("closed");
        setTurnCountdown(20);
        setSelectedPlayerId(null);
        setResultCard(null);
        setLandingReveal(null);
        setMovingPlayerId(null);
        setPlayers(resetPlayers);

        const startedSnapshot = {
            game_id: activeGameId,
            public_code: activePublicCode,
            play_mode: playMode,
            data_mode: dataMode,
            status: "active",
            max_turns: maxTurns,
            players: resetPlayers,
            state: {
                version: 1,
                status: "active",
                savedAt: new Date().toISOString(),
                publicCode: activePublicCode,
                playMode,
                dataMode,
                playerCount,
                gameLengthKey,
                players: resetPlayers,
                currentPlayerIndex: 0,
                dice: null,
                turn: 0,
                teamScores: INITIAL_TEAM_SCORES,
                taxPool: 0,
                points: initialPoints,
                passedCards: [],
                turnLog: [],
                gameOver: false,
            },
        };

        if (playMode === "host" && activePublicCode) {
            sendGameStart({
                roomCode: activePublicCode,
                gameState: startedSnapshot,
            });

            sendGameState({
                roomCode: activePublicCode,
                gameState: startedSnapshot,
            });
        }

        if (activePublicCode) {
            await saveGameApi(startedSnapshot);
        }
    };

    const finishTurn = (nextScores = teamScores, logEntry = null) => {
        const nextTurn = turn + 1;
        const nextAge = getAgeForTurn(nextTurn, maxTurns);
        const nextCurrentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const nextPoints = [
            ...points,
            {
                turn: nextTurn,
                age: nextAge,
                baseline: nextAge,
                ...nextScores,
            },
        ];
        const nextTurnLog = logEntry
            ? [logEntry, ...turnLog].slice(0, 14)
            : turnLog;
        const nextGameOver = nextTurn >= maxTurns;

        setPoints(nextPoints);
        setTurn(nextTurn);
        setCurrentPlayerIndex(nextCurrentPlayerIndex);
        setTurnLog(nextTurnLog);
        setGameOver(nextGameOver);
        setDice(null);

        return {
            turn: nextTurn,
            currentPlayerIndex: nextCurrentPlayerIndex,
            points: nextPoints,
            turnLog: nextTurnLog,
            gameOver: nextGameOver,
        };
    };

    const revealAndContinue = () => {
        if (!revealedCard) return;

        const turnState = finishTurn(revealedCard.nextScores, revealedCard.logEntry);

        setRevealedCard(null);
        setTurnCountdown(20);
        setModalView("closed");

        syncGameState({
            state: {
                ...turnState,
                teamScores: revealedCard.nextScores,
                revealedCard: null,
                resultCard: null,
                activeCard: null,
                votes: {},
                modalView: "closed",
                turnCountdown: 20,
                landingReveal: null,
                movingPlayerId: null,
            },
        });
    };

    const continueAfterResult = () => {
        if (!resultCard) return;

        const turnState = finishTurn(resultCard.nextScores, resultCard.logEntry);

        setResultCard(null);
        setTurnCountdown(20);
        setModalView("closed");

        syncGameState({
            state: {
                ...turnState,
                teamScores: resultCard.nextScores,
                resultCard: null,
                revealedCard: null,
                activeCard: null,
                votes: {},
                modalView: "closed",
                turnCountdown: 20,
                landingReveal: null,
                movingPlayerId: null,
            },
        });
    };

    const handleTaxBailout = (player, scoresAfterTax, poolValue) => {
        const stance = getStance(player.stanceIndex);
        const nextScores = {
            ...scoresAfterTax,
            [stance.key]: scoresAfterTax[stance.key] + poolValue,
        };

        setTeamScores(nextScores);
        setTaxPool(0);
        setModalView("reveal");
        setRevealedCard({
            title: "Tax Fed Bailout",
            category: "Bailout",
            text: `${player.name} landed on the bailout square. The stored tax pool goes to ${stance.label}.`,
            ownerName: player.name,
            impact: { [stance.key]: poolValue },
            nextScores,
            logEntry: {
                title: "Tax Fed Bailout",
                category: "Bailout",
                playerName: player.name,
                result: `${stance.label} +${poolValue}`,
                note: "Tax pool claimed by landing player's team.",
            },
        });
    };

    const rollDice = () => {
        if (
            gameOver ||
            activeCard ||
            revealedCard ||
            resultCard ||
            movingPlayerId ||
            !currentPlayer ||
            (!currentPlayer.isAI && !canRoll)
        ) {
            return;
        }

        const roll = Math.ceil(Math.random() * 6);
        const previousPosition = currentPlayer.position;
        const nextPosition = (previousPosition + roll) % BOARD_SIZE;
        const passedGo = previousPosition + roll >= BOARD_SIZE;

        setDice(roll);
        setModalView("closed");
        setMovingPlayerId(currentPlayer.id);

        let step = 0;

        const interval = setInterval(() => {
            step += 1;

            const stepPosition = (previousPosition + step) % BOARD_SIZE;

            setPlayers((existing) =>
                existing.map((player) =>
                    player.id === currentPlayer.id
                        ? { ...player, position: stepPosition }
                        : player
                )
            );

            if (step >= roll) {
                clearInterval(interval);

                const finalPlayers = players.map((player) =>
                    player.id === currentPlayer.id
                        ? { ...player, position: nextPosition }
                        : player
                );

                setPlayers(finalPlayers);

                broadcastGameState({
                    players: finalPlayers,
                    state: {
                        players: finalPlayers,
                        dice: roll,
                        movingPlayerId: null,
                    },
                });

                setTimeout(() => {
                    resolveLanding(nextPosition, passedGo, finalPlayers, roll);
                }, 450);
            }
        }, 260);
    };

    const resolveLanding = (
        nextPosition,
        passedGo,
        syncedPlayers = players,
        rollValue = dice
    ) => {
        const landedSpace = BOARD_SPACES[nextPosition];

        let scoresAfterTax = { ...teamScores };
        let nextTaxPool = taxPool;
        let taxNote = "";

        if (passedGo) {
            STANCES.forEach((stance) => {
                scoresAfterTax[stance.key] -= PASS_GO_TAX_PER_TEAM;
                nextTaxPool += PASS_GO_TAX_PER_TEAM;
            });

            taxNote = `Passed GO: every team paid ${PASS_GO_TAX_PER_TEAM} into the tax pool.`;
        }

        setTeamScores(scoresAfterTax);
        setTaxPool(nextTaxPool);
        setMovingPlayerId(null);

        if (landedSpace.type === "Go") {
            const turnState = finishTurn(scoresAfterTax, {
                title: "Landed on GO",
                category: "GO",
                playerName: currentPlayer.name,
                result: "Tax paid",
                note: taxNote || "No extra action.",
            });

            broadcastGameState({
                state: {
                    ...turnState,
                    players: syncedPlayers,
                    dice: rollValue,
                    teamScores: scoresAfterTax,
                    taxPool: nextTaxPool,
                    activeCard: null,
                    votes: {},
                    revealedCard: null,
                    resultCard: null,
                    landingReveal: null,
                    movingPlayerId: null,
                    modalView: "closed",
                    turnCountdown: 20,
                },
            });

            return;
        }

        if (landedSpace.type === "TaxBailout") {
            const nextLandingReveal = {
                id: `${Date.now()}-${currentPlayer.id}`,
                space: landedSpace,
                card: {
                    title: "Tax Fed Bailout",
                    text: `${currentPlayer.name} landed on the bailout square. The stored tax pool is about to be claimed.`,
                    individual: 0,
                    community: nextTaxPool,
                    category: "Bailout",
                },
                ownerName: currentPlayer.name,
                ownerStanceIndex: currentPlayer.stanceIndex,
            };

            setLandingReveal(nextLandingReveal);

            broadcastGameState({
                state: {
                    players: syncedPlayers,
                    dice: rollValue,
                    teamScores: scoresAfterTax,
                    taxPool: nextTaxPool,
                    activeCard: null,
                    votes: {},
                    revealedCard: null,
                    resultCard: null,
                    landingReveal: nextLandingReveal,
                    movingPlayerId: null,
                    modalView: "closed",
                },
            });

            setTimeout(() => {
                const stance = getStance(currentPlayer.stanceIndex);
                const nextScores = {
                    ...scoresAfterTax,
                    [stance.key]: scoresAfterTax[stance.key] + nextTaxPool,
                };
                const nextRevealedCard = {
                    title: "Tax Fed Bailout",
                    category: "Bailout",
                    text: `${currentPlayer.name} landed on the bailout square. The stored tax pool goes to ${stance.label}.`,
                    ownerName: currentPlayer.name,
                    impact: { [stance.key]: nextTaxPool },
                    nextScores,
                    logEntry: {
                        title: "Tax Fed Bailout",
                        category: "Bailout",
                        playerName: currentPlayer.name,
                        result: `${stance.label} +${nextTaxPool}`,
                        note: "Tax pool claimed by landing player's team.",
                    },
                };

                setLandingReveal(null);
                setTeamScores(nextScores);
                setTaxPool(0);
                setModalView("reveal");
                setRevealedCard(nextRevealedCard);

                broadcastGameState({
                    state: {
                        players: syncedPlayers,
                        dice: rollValue,
                        teamScores: nextScores,
                        taxPool: 0,
                        activeCard: null,
                        votes: {},
                        revealedCard: nextRevealedCard,
                        resultCard: null,
                        landingReveal: null,
                        movingPlayerId: null,
                        modalView: "reveal",
                    },
                });
            }, 4200);

            return;
        }

        const card = randomFrom(CARD_DECK[landedSpace.type]);
        const ownerStance = getStance(currentPlayer.stanceIndex);
        const playersWithOwnedCard = syncedPlayers.map((player) =>
            player.id === currentPlayer.id
                ? {
                      ...player,
                      ownedCards: [card.title, ...player.ownedCards].slice(0, 5),
                  }
                : player
        );

        const nextLandingReveal = {
            id: `${Date.now()}-${currentPlayer.id}-${card.title}`,
            space: landedSpace,
            card: { ...card, category: landedSpace.type },
            ownerName: currentPlayer.name,
            ownerStanceIndex: currentPlayer.stanceIndex,
        };

        setPlayers(playersWithOwnedCard);
        setLandingReveal(nextLandingReveal);

        broadcastGameState({
            state: {
                players: playersWithOwnedCard,
                dice: rollValue,
                teamScores: scoresAfterTax,
                taxPool: nextTaxPool,
                activeCard: null,
                votes: {},
                revealedCard: null,
                resultCard: null,
                landingReveal: nextLandingReveal,
                movingPlayerId: null,
                modalView: "closed",
            },
        });

        setTimeout(() => {
            setLandingReveal(null);

            if (landedSpace.type === "LifeCurve") {
                const impact = {
                    individual: card.individual,
                    community: card.community,
                };
                const nextScores = applyTeamImpact(
                    scoresAfterTax,
                    impact,
                    card.lean
                );
                const nextRevealedCard = {
                    title: card.title,
                    category: "LifeCurve",
                    text: card.text,
                    ownerName: currentPlayer.name,
                    ownerStance: ownerStance.label,
                    impact,
                    tradeoff: card.tradeoff,
                    nextScores,
                    logEntry: {
                        title: card.title,
                        category: "LifeCurve",
                        playerName: currentPlayer.name,
                        result: `Favours ${getStanceByKey(card.lean).label}`,
                        note: `${taxNote} ${card.tradeoff}`,
                    },
                };

                setTeamScores(nextScores);
                setModalView("reveal");
                setRevealedCard(nextRevealedCard);

                broadcastGameState({
                    state: {
                        players: playersWithOwnedCard,
                        dice: rollValue,
                        teamScores: nextScores,
                        taxPool: nextTaxPool,
                        activeCard: null,
                        votes: {},
                        revealedCard: nextRevealedCard,
                        resultCard: null,
                        landingReveal: null,
                        movingPlayerId: null,
                        modalView: "reveal",
                    },
                });

                return;
            }

            const isPolicyProposal = landedSpace.type === "Policy";
            const isQuizCard = landedSpace.type === "Quiz";

            const nextActiveCard = {
                ...card,
                category: landedSpace.type,
                spaceType: landedSpace.type,
                mode: isPolicyProposal
                    ? "policy"
                    : isQuizCard
                        ? "quiz"
                        : "event",
                responseOptions: isPolicyProposal || isQuizCard
                    ? null
                    : getEventResponseOptions(card),
                playerId: currentPlayer.id,
                playerName: currentPlayer.name,
                ownerSuggestion: null,
                ownerStance: ownerStance.label,
                ownerStanceKey: ownerStance.key,
                baseScores: scoresAfterTax,
                taxNote,
            };

            setModalView("vote");
            setActiveCard(nextActiveCard);
            setVotes({});

            broadcastGameState({
                state: {
                    players: playersWithOwnedCard,
                    dice: rollValue,
                    teamScores: scoresAfterTax,
                    taxPool: nextTaxPool,
                    activeCard: nextActiveCard,
                    votes: {},
                    revealedCard: null,
                    resultCard: null,
                    landingReveal: null,
                    movingPlayerId: null,
                    modalView: "vote",
                },
            });
        }, 4200);
    };

    const syncVoteState = (nextActiveCard, nextVotes) => {
        sendGameState({
            roomCode: publicCode || loadCode,
            gameState: {
                ...buildGameSnapshot(),
                status: "active",
                state: {
                    ...buildGameSnapshot().state,
                    status: "active",
                    activeCard: nextActiveCard,
                    votes: nextVotes,
                    revealedCard: null,
                    resultCard: null,
                    landingReveal: null,
                    movingPlayerId: null,
                    modalView: "vote",
                },
            },
        });
    };

    const maybeAutoResolveVote = (
        nextActiveCard,
        nextVotes
    ) => {
        const allVotesIn =
            Object.keys(nextVotes).length === players.length;

        if (!allVotesIn) return;
        if (playMode !== "host") return;

        setTimeout(() => {
            resolveVote(
                nextActiveCard,
                nextVotes
            );
        }, 500);
    };

    const castVote = (playerId, choice) => {
        if (!activeCard) return;

        const nextVotes = {
            ...votes,
            [playerId]: choice,
        };

        setVotes(nextVotes);
        syncVoteState(activeCard, nextVotes);
        maybeAutoResolveVote(activeCard, nextVotes);
    };

    const setOwnerSuggestion = (choice) => {
        if (!activeCard) return;

        const nextActiveCard = {
            ...activeCard,
            ownerSuggestion: choice,
        };

        const nextVotes = {
            ...votes,
            [activeCard.playerId]: choice,
        };

        setActiveCard(nextActiveCard);
        setVotes(nextVotes);

        syncVoteState(nextActiveCard, nextVotes);
        maybeAutoResolveVote(nextActiveCard, nextVotes);
    };

    useEffect(() => {
        if (playMode !== "host") return;
        if (!activeCard) return;
        if (modalView !== "vote") return;
        if (resultCard || revealedCard) return;
        if (Object.keys(votes).length !== players.length) return;

        const timer = setTimeout(() => {
            resolveVote(activeCard, votes);
        }, 600);

        return () => clearTimeout(timer);
    }, [
        playMode,
        activeCard,
        votes,
        players.length,
        modalView,
        resultCard,
        revealedCard,
    ]);

    const resolveVote = (
        cardToResolve = activeCard,
        votesToResolve = votes
    ) => {
        if (
            !cardToResolve ||
            Object.keys(votesToResolve).length !== players.length
        ) {
            return;
        }

        const voteList = players.map((player) => ({
            playerId: player.id,
            playerName: player.name,
            stance: getStance(player.stanceIndex).label,
            stanceKey: getStance(player.stanceIndex).key,
            choice: votesToResolve[player.id],
        }));

        if (cardToResolve.mode === "quiz") {
            resolveQuiz(voteList, cardToResolve, votesToResolve);
            return;
        }

        if (cardToResolve.mode === "event") {
            resolveEvent(voteList, cardToResolve, votesToResolve);
            return;
        }

        resolvePolicy(voteList, cardToResolve, votesToResolve);
    };

    const applyResolution = ({
        nextScores,
        passedRecord,
        resultCard: nextResultCard,
        sourceCard,
        sourceVotes,
    }) => {
        const nextPassedCards = [passedRecord, ...passedCards];
        const nextPlayers = players.map((player) => ({
            ...player,
            votes: [
                {
                    title: sourceCard.title,
                    choice: sourceVotes[player.id],
                    passed: passedRecord.passed,
                    age: currentAge,
                },
                ...player.votes,
            ].slice(0, 8),
        }));

        setTeamScores(nextScores);
        setPassedCards(nextPassedCards);
        setPlayers(nextPlayers);
        setModalView("result");
        setResultCard(nextResultCard);
        setActiveCard(null);
        setVotes({});

        syncGameState({
            state: {
                players: nextPlayers,
                teamScores: nextScores,
                passedCards: nextPassedCards,
                activeCard: null,
                votes: {},
                revealedCard: null,
                resultCard: nextResultCard,
                landingReveal: null,
                movingPlayerId: null,
                modalView: "result",
            },
        });
    };

    const resolveQuiz = (
        voteList,
        cardToResolve = activeCard,
        votesToResolve = votes
    ) => {
        const goodCount = voteList.filter(
            (vote) => vote.choice === "good"
        ).length;
        const neutralCount = voteList.filter(
            (vote) => vote.choice === "neutral"
        ).length;
        const badCount = voteList.filter(
            (vote) => vote.choice === "bad"
        ).length;

        const sortedQuiz = [
            { key: "Good", count: goodCount },
            { key: "Neutral", count: neutralCount },
            { key: "Bad", count: badCount },
        ].sort((a, b) => b.count - a.count);

        const tied = sortedQuiz[0].count === sortedQuiz[1].count;
        const winningLean = tied ? "C" : cardToResolve.lean;
        const voteStrength = tied ? 0.33 : sortedQuiz[0].count / players.length;
        const impact = tied
            ? {
                  individual: -1,
                  community: -1,
                  bonusDirection: "negative",
              }
            : {
                  individual: Math.round(
                      cardToResolve.individual * voteStrength
                  ),
                  community: Math.round(
                      cardToResolve.community * voteStrength
                  ),
              };

        const nextScores = applyTeamImpact(
            cardToResolve.baseScores,
            impact,
            winningLean
        );
        const resultText = tied
            ? "Quiz gridlock"
            : `${sortedQuiz[0].key} wins · reveals ${
                  getStanceByKey(winningLean).label
              } lean`;
        const note = `${
            cardToResolve.taxNote || ""
        } Good ${goodCount}, neutral ${neutralCount}, bad ${badCount}. The concept was ${cardToResolve.title}.`;

        applyResolution({
            nextScores,
            sourceCard: cardToResolve,
            sourceVotes: votesToResolve,
            passedRecord: {
                cardTitle: cardToResolve.title,
                category: cardToResolve.category,
                passed: !tied,
                age: currentAge,
                turn,
                votes: voteList,
                impact,
                winningLean,
            },
            resultCard: {
                title: cardToResolve.title,
                category: cardToResolve.category,
                text: cardToResolve.text,
                ownerName: cardToResolve.playerName,
                result: resultText,
                note,
                nextScores,
                logEntry: {
                    title: cardToResolve.title,
                    category: cardToResolve.category,
                    playerName: cardToResolve.playerName,
                    result: resultText,
                    note,
                },
            },
        });
    };

    const resolveEvent = (
        voteList,
        cardToResolve = activeCard,
        votesToResolve = votes
    ) => {
        const result = getWinningResponse(
            voteList,
            cardToResolve.responseOptions
        );

        let impact = {
            individual: cardToResolve.individual,
            community: cardToResolve.community,
        };
        let winningLean = cardToResolve.lean;
        let passed = true;
        let note = cardToResolve.taxNote || "";

        if (result.tied) {
            impact = {
                individual: cardToResolve.individual - 1,
                community: cardToResolve.community - 2,
                bonusDirection: "negative",
            };
            passed = false;
            note = `${note} Gridlock: no response wins. Base event damage applies with extra instability.`;
        } else {
            const strength = result.winningVotes / players.length;
            impact = {
                individual:
                    cardToResolve.individual +
                    Math.round(result.winningOption.individual * strength),
                community:
                    cardToResolve.community +
                    Math.round(result.winningOption.community * strength),
            };
            winningLean = result.winningOption.lean;
            note = `${note} Reality happened. Winning response: ${result.winningOption.key} — ${result.winningOption.title}. Strength ${result.winningVotes}/${players.length}.`;
        }

        const nextScores = applyTeamImpact(
            cardToResolve.baseScores,
            impact,
            winningLean
        );
        const resultText = passed
            ? `Favours ${getStanceByKey(winningLean).label}`
            : "Gridlock";

        applyResolution({
            nextScores,
            sourceCard: cardToResolve,
            sourceVotes: votesToResolve,
            passedRecord: {
                cardTitle: cardToResolve.title,
                category: cardToResolve.category,
                passed,
                age: currentAge,
                turn,
                votes: voteList,
                impact,
                winningLean,
            },
            resultCard: {
                title: cardToResolve.title,
                category: cardToResolve.category,
                text: cardToResolve.text,
                ownerName: cardToResolve.playerName,
                result: resultText,
                note,
                nextScores,
                logEntry: {
                    title: cardToResolve.title,
                    category: cardToResolve.category,
                    playerName: cardToResolve.playerName,
                    result: resultText,
                    note,
                },
            },
        });
    };

    const resolvePolicy = (
        voteList,
        cardToResolve = activeCard,
        votesToResolve = votes
    ) => {
        const policyResult = getPolicyImpact(cardToResolve, voteList);
        const winningLean = policyResult.passed ? cardToResolve.lean : null;
        const nextScores = applyTeamImpact(
            cardToResolve.baseScores,
            policyResult.impact,
            winningLean
        );

        const resultText = policyResult.passed
            ? `Passed · favours ${getStanceByKey(winningLean).label}`
            : policyResult.gridlock
                ? "Policy gridlock · no score change"
                : "Rejected · opposite effect applies";

        const note = `${
            cardToResolve.taxNote || ""
        } Support ${policyResult.supportCount}, oppose ${
            policyResult.opposeCount
        }, neutral ${
            policyResult.neutralCount
        }. Effect applied: Individual ${
            policyResult.impact.individual >= 0 ? "+" : ""
        }${policyResult.impact.individual}, Community ${
            policyResult.impact.community >= 0 ? "+" : ""
        }${policyResult.impact.community}. ${cardToResolve.tradeoff}`;

        applyResolution({
            nextScores,
            sourceCard: cardToResolve,
            sourceVotes: votesToResolve,
            passedRecord: {
                cardTitle: cardToResolve.title,
                category: cardToResolve.category,
                passed: policyResult.passed,
                age: currentAge,
                turn,
                votes: voteList,
                impact: policyResult.impact,
                winningLean,
            },
            resultCard: {
                title: cardToResolve.title,
                category: cardToResolve.category,
                text: cardToResolve.text,
                ownerName: cardToResolve.playerName,
                result: resultText,
                note,
                nextScores,
                logEntry: {
                    title: cardToResolve.title,
                    category: cardToResolve.category,
                    playerName: cardToResolve.playerName,
                    result: resultText,
                    note,
                },
            },
        });
    };

    const resetToMenu = () => {
        setScreen("menu");
    };

    return (
        <>
            {showLanding && (
                <div className="fixed inset-0 z-[9999] bg-slate-950 text-white flex items-center justify-center overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center px-6"
                    >
                        <motion.div
                            initial={{ rotate: -8, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="mx-auto mb-6 h-28 w-28 rounded-[2rem] bg-white text-slate-950 flex items-center justify-center shadow-2xl"
                        >
                            <Sparkles className="h-14 w-14" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, letterSpacing: "0.4em" }}
                            animate={{ opacity: 1, letterSpacing: "0.02em" }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="text-6xl md:text-8xl font-black"
                        >
                            LifeCurve
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.1, duration: 0.7 }}
                            className="mt-4 text-xl text-slate-300"
                        >
                            Debate the future. Draw the curve.
                        </motion.p>

                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.7 }}
                            onClick={() => setShowLanding(false)}
                            className="mt-10 rounded-2xl bg-white text-slate-950 px-8 py-4 font-black hover:scale-105 transition-transform"
                        >
                            Enter Game
                        </motion.button>
                    </motion.div>
                </div>
            )}

            {screen === "menu" ? (
                <MenuScreen
                    playerCount={playerCount}
                    players={players}
                    gameLengthKey={gameLengthKey}
                    setGameLengthKey={setGameLengthKey}
                    configurePlayers={configurePlayers}
                    updatePlayer={updatePlayer}
                    startGame={startGame}
                    createHostLobby={createHostLobby}
                    publicCode={publicCode}
                    playMode={playMode}
                    setPlayMode={setPlayMode}
                    dataMode={dataMode}
                    setDataMode={setDataMode}
                    setPlayers={setPlayers}
                    loadGame={loadGame}
                    loadLobby={loadLobby}
                    loadCode={loadCode}
                    setLoadCode={setLoadCode}
                    joinedPlayerId={joinedPlayerId}
                    claimPlayerSlot={claimPlayerSlot}
                />
            ) : (
                <div className="min-h-screen bg-slate-950 text-white p-3 md:p-5 pb-28">
                    <div className="mx-auto max-w-[1600px] space-y-4">
                        <TopBar
                            turn={turn}
                            maxTurns={maxTurns}
                            winningTeam={winningTeam}
                            taxPool={taxPool}
                            setModalView={setModalView}
                            resetToMenu={resetToMenu}
                            modalView={modalView}
                            activeCard={activeCard}
                            revealedCard={revealedCard}
                            resultCard={resultCard}
                            turnCountdown={turnCountdown}
                            viewMode={viewMode}
                            saveGame={saveGame}
                            publicCode={publicCode}
                            canRoll={canRoll}
                        />

                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                            <div className="xl:col-span-3">
                                <GameBoard
                                    boardRows={boardRows}
                                    players={players}
                                    movingPlayerId={movingPlayerId}
                                    chartData={chartData}
                                    maxTurns={maxTurns}
                                    maxChartValue={maxChartValue}
                                    teamScores={teamScores}
                                    winningTeam={winningTeam}
                                    taxPool={taxPool}
                                    currentPlayer={currentPlayer}
                                    activeCard={activeCard}
                                    revealedCard={revealedCard}
                                    resultCard={resultCard}
                                    currentStance={currentStance}
                                />
                            </div>

                            <div className="space-y-4">
                                {!isHostView && (
                                    <Card className={`${currentStance.soft} text-slate-950 rounded-3xl shadow-xl border-2 ${currentStance.border}`}>
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-xs uppercase tracking-wide text-slate-500">
                                                        Current Turn
                                                    </div>

                                                    <h2 className="text-2xl font-black">
                                                        {currentPlayer?.name}
                                                    </h2>

                                                    <Badge
                                                        className="text-white border-0 hover:opacity-90"
                                                        style={{
                                                            backgroundColor: currentStance.stroke,
                                                        }}
                                                    >
                                                        {currentStance?.label}
                                                    </Badge>
                                                </div>

                                                <motion.div
                                                    key={dice || "dice"}
                                                    initial={{
                                                        rotate: -18,
                                                        scale: 0.85,
                                                    }}
                                                    animate={{
                                                        rotate: 0,
                                                        scale: 1,
                                                    }}
                                                    className={`h-16 w-16 rounded-2xl ${currentStance.bg} text-white flex items-center justify-center text-3xl font-black shadow-xl`}
                                                >
                                                    {dice || <Dice5 />}
                                                </motion.div>
                                            </div>

                                            <Button
                                                onClick={rollDice}
                                                disabled={
                                                    !canControlCurrentPlayer ||
                                                    !canRoll ||
                                                    gameOver ||
                                                    !!activeCard ||
                                                    !!revealedCard ||
                                                    !!resultCard ||
                                                    !!movingPlayerId
                                                }
                                                className={`w-full rounded-2xl h-12 text-base ${currentStance.bg} text-white hover:opacity-90`}
                                            >
                                                <Dice5 className="mr-2 h-5 w-5" />
                                                {canControlCurrentPlayer ? "Roll" : `Waiting for ${currentPlayer?.name}`}
                                            </Button>

                                            <div className="text-xs text-slate-500">
                                                Passing GO makes every faction
                                                pay {PASS_GO_TAX_PER_TEAM} into
                                                the tax pool.
                                            </div>

                                            {gameOver && (
                                                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 text-sm font-bold">
                                                    Game complete. Winner:{" "}
                                                    {winningTeam.label}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                <Card className="bg-white/10 border-white/10 text-white rounded-3xl">
                                    <CardContent className="p-4">
                                        <h2 className="text-xl font-black mb-1">
                                            Resolved Card Stack
                                        </h2>

                                        <div className="space-y-2 max-h-72 overflow-auto pr-1">
                                            {passedCards.length === 0 && (
                                                <div className="text-sm text-slate-400">
                                                    No card has resolved yet.
                                                </div>
                                            )}

                                            {passedCards.map((card, index) => (
                                                <div
                                                    key={`${card.cardTitle}-${index}`}
                                                    className="rounded-2xl bg-black/30 border border-white/10 p-3"
                                                >
                                                    <div className="flex justify-between gap-2">
                                                        <strong>
                                                            {card.cardTitle}
                                                        </strong>

                                                        <Badge
                                                            className={
                                                                card.passed
                                                                    ? "bg-emerald-500 text-white hover:bg-emerald-500"
                                                                    : "bg-slate-500 text-white hover:bg-slate-500"
                                                            }
                                                        >
                                                            {card.passed
                                                                ? "RESOLVED"
                                                                : "GRIDLOCK"}
                                                        </Badge>
                                                    </div>

                                                    <div className="text-xs text-slate-400 mt-1">
                                                        Turn {card.turn} ·
                                                        Favours{" "}
                                                        {card.winningLean
                                                            ? getStanceByKey(
                                                                  card.winningLean
                                                              ).label
                                                            : "No faction"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <PlayerBar
                            players={players}
                            currentPlayerIndex={currentPlayerIndex}
                            turnCountdown={turnCountdown}
                            setSelectedPlayerId={setSelectedPlayerId}
                            setModalView={setModalView}
                            isHostView={isHostView}
                            canControlCurrentPlayer={canControlCurrentPlayer}
                        />

                        <LandingRevealModal landingReveal={landingReveal} />

                        <GameModal
                            modalView={shouldShowTurnModal ? "turn" : modalView === "turn" ? "closed" : modalView}
                            setModalView={setModalView}
                            players={players}
                            selectedPlayer={selectedPlayer}
                            setSelectedPlayerId={setSelectedPlayerId}
                            activeCard={activeCard}
                            revealedCard={revealedCard}
                            resultCard={resultCard}
                            currentPlayer={currentPlayer}
                            currentStance={currentStance}
                            dice={dice}
                            rollDice={rollDice}
                            gameOver={gameOver}
                            castVote={castVote}
                            setOwnerSuggestion={setOwnerSuggestion}
                            resolveVote={resolveVote}
                            canResolveVote={playMode === "host" && canResolveVote}
                            votes={votes}
                            revealAndContinue={revealAndContinue}
                            continueAfterResult={continueAfterResult}
                            turnLog={turnLog}
                            movingPlayerId={movingPlayerId}
                            viewMode={viewMode}
                            controlledPlayerId={controlledPlayerId}
                            votePlayerId={votePlayerId}
                            isHostView={isHostView}
                            canRoll={canRoll}
                        />
                    </div>
                </div>
            )}
        </>
    );
}