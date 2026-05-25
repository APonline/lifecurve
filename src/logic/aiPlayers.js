const STANCE_WEIGHTS = {
    FL: { community: 1.25, individual: -0.25, left: 1.2, right: -0.7 },
    L: { community: 1.0, individual: 0.1, left: 0.9, right: -0.35 },
    C: { community: 0.65, individual: 0.65, left: 0.15, right: 0.15 },
    R: { community: 0.1, individual: 1.0, left: -0.35, right: 0.9 },
    FR: { community: -0.25, individual: 1.25, left: -0.7, right: 1.2 },
};

const LEAN_SCORE = {
    FL: { FL: 2, L: 1, C: 0, R: -1, FR: -2 },
    L: { FL: 1, L: 2, C: 0.5, R: -1, FR: -1.5 },
    C: { FL: 0, L: 0.5, C: 2, R: 0.5, FR: 0 },
    R: { FL: -1.5, L: -1, C: 0.5, R: 2, FR: 1 },
    FR: { FL: -2, L: -1, C: 0, R: 1, FR: 2 },
};

function randomJitter(amount = 0.8) {
    return (Math.random() * amount * 2) - amount;
}

function scoreCardForPlayer(player, card) {
    const stanceKey = player.stanceKey || player.stance || "C";
    const weights = STANCE_WEIGHTS[stanceKey] || STANCE_WEIGHTS.C;

    const leanScore = LEAN_SCORE[stanceKey]?.[card.lean] || 0;

    return (
        (card.community || 0) * weights.community +
        (card.individual || 0) * weights.individual +
        leanScore +
        randomJitter(player.aiRandomness ?? 0.75)
    );
}

export function getAIPolicyVote(player, card) {
    const score = scoreCardForPlayer(player, card);

    if (score >= 1.25) return "yes";
    if (score <= -1.25) return "no";

    return "neutral";
}

export function getAIEventVote(player, activeCard) {
    const options = activeCard.responseOptions || [];

    if (!options.length) return "neutral";

    const ranked = options
        .map((option) => ({
            option,
            score: scoreCardForPlayer(player, option),
        }))
        .sort((a, b) => b.score - a.score);

    return ranked[0].option.key;
}

export function getAIQuizVote(player, card) {
    const score = scoreCardForPlayer(player, card);

    if (score >= 1) return "good";
    if (score <= -1) return "bad";

    return "neutral";
}

export function getAIVote(player, activeCard) {
    if (!player?.isAI || !activeCard) return null;

    if (activeCard.mode === "policy") {
        return getAIPolicyVote(player, activeCard);
    }

    if (activeCard.mode === "event") {
        return getAIEventVote(player, activeCard);
    }

    if (activeCard.mode === "quiz") {
        return getAIQuizVote(player, activeCard);
    }

    return "neutral";
}