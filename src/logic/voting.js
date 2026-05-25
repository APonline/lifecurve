export function getEventResponseOptions(card) {
    const title = card.title.toLowerCase();
    const text = card.text.toLowerCase();

    // ==================== BASE RESPONSE OPTIONS ====================
    // These will be overridden by specific context triggers below

    let options = [
        { title: 'Strong Collective Action', individual: 1, community: 5, lean: 'L', description: 'Government-led, large-scale solution.' },
        { title: 'Individual Liberty Approach', individual: 4, community: -1, lean: 'R', description: 'Maximize personal freedom and responsibility.' },
        { title: 'Pragmatic Balance', individual: 2, community: 2, lean: 'C', description: 'Moderate approach with compromise.' },
        { title: 'Radical / Hardline', individual: 3, community: -4, lean: 'FR', description: 'Aggressive ideological response.' },
    ];

    // ==================== CONTEXT-SPECIFIC TRIGGERS ====================

    // === HOUSING / RENT / HOME RELATED ===
    if (title.includes('housing') || title.includes('rent') || title.includes('homeless') || title.includes('shelter')) {
        options = [
            { title: 'Mass Public Housing', individual: 0, community: 5, lean: 'FL', description: 'Build huge government housing projects.' },
            { title: 'Rent Control & Subsidies', individual: 2, community: 3, lean: 'L', description: 'Strong tenant protections and aid.' },
            { title: 'Housing Vouchers', individual: 3, community: 2, lean: 'C', description: 'Market-based aid to individuals.' },
            { title: 'Full Deregulation', individual: 5, community: -3, lean: 'FR', description: 'Remove all zoning and rent controls.' },
        ];
    }

    // === HEALTH / PANDEMIC / MEDICAL ===
    else if (title.includes('pandemic') || title.includes('virus') || title.includes('health') || 
             title.includes('medical') || title.includes('depression') || title.includes('injury')) {
        options = [
            { title: 'Full Lockdown & Mandates', individual: -2, community: 5, lean: 'L', description: 'Strict public health measures.' },
            { title: 'Personal Choice', individual: 4, community: -2, lean: 'R', description: 'No mandates, individual responsibility.' },
            { title: 'Targeted Protection', individual: 2, community: 3, lean: 'C', description: 'Protect vulnerable, keep society open.' },
            { title: 'Herd Immunity Strategy', individual: 3, community: -4, lean: 'FR', description: 'Let it spread naturally.' },
        ];
    }

    // === ABORTION / GENDER / FAMILY / MARRIAGE ===
    else if (title.includes('abortion') || title.includes('gender') || title.includes('trans') || 
             title.includes('marriage') || title.includes('family')) {
        options = [
            { title: 'Maximum Bodily Autonomy', individual: 4, community: -2, lean: 'FL', description: 'Full legal access, no restrictions.' },
            { title: 'Traditional Values', individual: 1, community: 2, lean: 'R', description: 'Protect traditional family structures.' },
            { title: 'Moderate Restrictions', individual: 1, community: 1, lean: 'C', description: 'Some limits with exceptions.' },
            { title: 'Hardline Ban / Mandate', individual: -4, community: -3, lean: 'FR', description: 'Extreme ideological position.' },
        ];
    }

    // === BORDER / IMMIGRATION ===
    else if (title.includes('border') || title.includes('immigration') || title.includes('migrant') || title.includes('deport')) {
        options = [
            { title: 'Open Borders', individual: 3, community: 2, lean: 'L', description: 'High immigration with support services.' },
            { title: 'Strict Enforcement', individual: 1, community: -2, lean: 'FR', description: 'Mass deportations and strong borders.' },
            { title: 'Merit-Based System', individual: 3, community: 1, lean: 'C', description: 'Controlled legal immigration only.' },
            { title: 'Extreme Border Control', individual: -4, community: -4, lean: 'FR', description: 'Very aggressive policy.' },
        ];
    }

    // === ECONOMY / TAX / WEALTH ===
    else if (title.includes('tax') || title.includes('wealth') || title.includes('economy') || 
             title.includes('recession') || title.includes('inflation') || title.includes('ubI')) {
        options = [
            { title: 'Heavy Redistribution', individual: -3, community: 5, lean: 'FL', description: 'Tax the rich heavily.' },
            { title: 'Tax Cuts & Deregulation', individual: 5, community: -2, lean: 'FR', description: 'Stimulate growth through markets.' },
            { title: 'Moderate Reform', individual: 2, community: 2, lean: 'C', description: 'Balanced budget approach.' },
            { title: 'Radical Overhaul', individual: -4, community: 3, lean: 'FL', description: 'Wealth caps or major nationalization.' },
        ];
    }

    // === CRISIS / WAR / DISASTER ===
    else if (title.includes('war') || title.includes('crisis') || title.includes('disaster') || 
             title.includes('attack') || title.includes('shortage')) {
        options = [
            { title: 'Strong Government Control', individual: -1, community: 5, lean: 'L', description: 'Centralized emergency powers.' },
            { title: 'Local & Individual Response', individual: 4, community: 1, lean: 'R', description: 'Decentralized action.' },
            { title: 'International Cooperation', individual: 1, community: 4, lean: 'C', description: 'Work with global partners.' },
            { title: 'Militarized Response', individual: 2, community: -4, lean: 'FR', description: 'Force and security first.' },
        ];
    }

    // === INNOVATION / TECH / AI ===
    else if (title.includes('ai') || title.includes('neural') || title.includes('gene') || 
             title.includes('clone') || title.includes('tech')) {
        options = [
            { title: 'Heavy Regulation', individual: -1, community: 4, lean: 'L', description: 'Strict government oversight.' },
            { title: 'Full Innovation Freedom', individual: 5, community: -2, lean: 'FR', description: 'Let markets and individuals experiment.' },
            { title: 'Ethical Framework', individual: 2, community: 3, lean: 'C', description: 'Balanced rules with progress.' },
            { title: 'Radical Acceleration', individual: 4, community: -4, lean: 'C', description: 'Push technology to the extreme.' },
        ];
    }

    // === EXTREME CARDS (Special Boost) ===
    if (card.lean === 'FL' || card.lean === 'FR' || Math.abs(card.individual || 0) >= 4 || Math.abs(card.community || 0) >= 4) {
        options[3] = {
            title: 'Extreme Solution',
            individual: Math.random() > 0.5 ? -5 : 5,
            community: Math.random() > 0.5 ? -5 : 4,
            lean: Math.random() > 0.5 ? 'FL' : 'FR',
            description: 'High-risk, high-reward ideological response.'
        };
    }

    // ==================== FINAL PROCESSING ====================
    
    // Shuffle the options
    options = options.sort(() => Math.random() - 0.5);

    // Re-assign keys A, B, C, D based on final shuffled order
    const keys = ['A', 'B', 'C', 'D'];
    options.forEach((option, index) => {
        option.key = keys[index];
    });

    return options;
}

export function getWinningResponse(voteList, options) {
    const counts = options.reduce((acc, option) => ({ ...acc, [option.key]: 0 }), {});
    voteList.forEach((vote) => {
        if (counts[vote.choice] !== undefined) counts[vote.choice] += 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [winningKey, winningVotes] = sorted[0];
    const tied = sorted.length > 1 && sorted[1][1] === winningVotes;

    return { tied, winningVotes, winningOption: options.find((option) => option.key === winningKey), counts };
}
