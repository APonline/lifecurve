export function applyTeamImpact(currentScores, impact, winningLean = 'C') {
    const next = { ...currentScores };
    const communityValue = impact.community || 0;
    const individualValue = impact.individual || 0;
    const totalValue = communityValue + individualValue;
    const winnerValue = Math.round((Math.abs(communityValue) + Math.abs(individualValue)) / 2) || 1;
    const balanceBonus = Math.max(0, 4 - Math.abs(communityValue - individualValue));

    next.FL += Math.round(communityValue * 0.9);
    next.L += Math.round(communityValue * 0.7);
    next.R += Math.round(individualValue * 0.7);
    next.FR += Math.round(individualValue * 0.9);

    if (winningLean === 'C') {
        next.C += Math.round(totalValue * 0.35 + balanceBonus * 0.75);
    } else {
        next.C += Math.round(totalValue * 0.15 + balanceBonus * 0.35);
    }

    if (winningLean && next[winningLean] !== undefined) {
        next[winningLean] += impact.bonusDirection === 'negative' ? -winnerValue : winnerValue;
    }

    return next;
}

export function getPolicyImpact(card, voteList) {
    const supportCount = voteList.filter((vote) => vote.choice === 'yes').length;
    const opposeCount = voteList.filter((vote) => vote.choice === 'no').length;
    const neutralCount = voteList.filter((vote) => vote.choice === 'neutral').length;
    const passed = supportCount > opposeCount;
    const rejected = opposeCount > supportCount;
    const gridlock = supportCount === opposeCount;

    let impact = { individual: 0, community: 0 };

    if (passed) {
        impact = { individual: card.individual, community: card.community };
    }

    if (rejected) {
        impact = {
            individual: card.individual * -1,
            community: card.community * -1,
            bonusDirection: 'negative',
        };
    }

    return { passed, rejected, gridlock, supportCount, opposeCount, neutralCount, impact };
}
