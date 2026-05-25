import { AlertTriangle, CheckCircle2, DollarSign, Flag, HeartPulse, Landmark, Lightbulb, Sparkles, TrendingUp, Users } from 'lucide-react';

export const BOARD_SIZE = 28;
export const PASS_GO_TAX_PER_TEAM = 1;

export const GAME_LENGTHS = [
    { key: 'short', label: 'Short Game', turns: 50, description: 'Faster test run. Every turn moves the curve by 2 years.' },
    { key: 'long', label: 'Long Game', turns: 100, description: 'Full life simulation. Every turn moves the curve by 1 year.' },
];

export const STANCES = [
    { key: 'FL', label: 'Far Left', short: 'FL', bg: 'bg-red-800', text: 'text-red-800', border: 'border-red-500', soft: 'bg-red-50', stroke: '#991b1b', description: 'Strong communal ownership, redistribution, public systems, and equality.' },
    { key: 'L', label: 'Left', short: 'L', bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-300', soft: 'bg-red-50', stroke: '#ef4444', description: 'Community systems, equality, shared support, and public stability.' },
    { key: 'C', label: 'Center', short: 'C', bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-300', soft: 'bg-slate-50', stroke: '#64748b', description: 'Balances personal freedom with community responsibility and pragmatic tradeoffs.' },
    { key: 'R', label: 'Right', short: 'R', bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-300', soft: 'bg-blue-50', stroke: '#3b82f6', description: 'Individual liberty, markets, ownership, competition, and self-direction.' },
    { key: 'FR', label: 'Far Right', short: 'FR', bg: 'bg-blue-800', text: 'text-blue-800', border: 'border-blue-500', soft: 'bg-blue-50', stroke: '#1e40af', description: 'Private ownership, minimal state control, markets, and individual autonomy.' },
];

export const INITIAL_TEAM_SCORES = { FL: 0, L: 0, C: 0, R: 0, FR: 0 };

export const SPACE_TYPES = {
    Go: { icon: Flag, label: 'GO', color: 'bg-slate-900 text-white border-slate-700' },
    Policy: { icon: Landmark, label: 'Policy', color: 'bg-blue-100 text-blue-900 border-blue-300' },
    Economy: { icon: TrendingUp, label: 'Economy', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    Crisis: { icon: AlertTriangle, label: 'Crisis', color: 'bg-red-100 text-red-900 border-red-300' },
    Innovation: { icon: Lightbulb, label: 'Innovation', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
    Social: { icon: Users, label: 'Social', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    Life: { icon: HeartPulse, label: 'Life', color: 'bg-orange-100 text-orange-900 border-orange-300' },
    LifeCurve: { icon: Sparkles, label: 'Life Curve', color: 'bg-fuchsia-950 text-white border-fuchsia-700' },
    TaxBailout: { icon: DollarSign, label: 'Tax Bailout', color: 'bg-emerald-950 text-white border-emerald-700' },
    Quiz: { icon: CheckCircle2, label: 'Quiz Card', color: 'bg-indigo-950 text-white border-indigo-700' },
    Bailout: { icon: DollarSign, label: 'Bailout', color: 'bg-emerald-950 text-white border-emerald-700' },
    'Life Curve': { icon: Sparkles, label: 'Life Curve', color: 'bg-fuchsia-950 text-white border-fuchsia-700' },
};
