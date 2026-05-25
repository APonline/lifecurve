const stanceWeights = {
    FL: {
        community: 1.5,
        individual: 0.5,
        risk: 0.8,
    },

    L: {
        community: 1.25,
        individual: 0.75,
        risk: 1,
    },

    C: {
        community: 1,
        individual: 1,
        risk: 1,
    },

    R: {
        community: 0.75,
        individual: 1.25,
        risk: 1.2,
    },

    FR: {
        community: 0.5,
        individual: 1.5,
        risk: 1.5,
    }
};

export function getAIVote(player, card) {
    const weights = stanceWeights[player.stance];

    const score =
        (card.individual * weights.individual)
        +
        (card.community * weights.community);

    if (score > 2)
        return "yes";

    if (score < -2)
        return "no";

    return "neutral";
}