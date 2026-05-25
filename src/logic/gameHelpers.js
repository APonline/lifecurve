import { STANCES } from "../data/constants.js";

export function randomFrom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

export function getStance(stanceIndex = 2) {
    return STANCES[Math.max(0, Math.min(STANCES.length - 1, stanceIndex))];
}

export function getStanceByKey(key) {
    return STANCES.find((stance) => stance.key === key) || STANCES[2];
}

export function createPlayers(count, playMode = "local") {
    return Array.from({ length: count }, (_, index) => {
        const isHostMode = playMode === "host";
        const isSoloAi = playMode === "solo" && index !== 0;

        return {
            id: index + 1,
            name: playMode === "solo" && index === 0 ? "You" : `Player ${index + 1}`,
            stanceIndex: 2,
            position: 0,
            votes: [],
            ownedCards: [],
            isAI: isSoloAi,
            aiRandomness: 0.75,
            connectionType: isHostMode
                ? index === 0
                    ? "host"
                    : "open"
                : isSoloAi
                    ? "ai"
                    : "local",
            remoteSocketId: null,
        };
    });
}

export function getAgeForTurn(turn, maxTurns) {
    return Math.min(100, Math.round((turn / maxTurns) * 100));
}

export function teamScoreTotal(scores) {
    return STANCES.reduce((total, stance) => total + scores[stance.key], 0);
}