import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { STANCES } from '../data/constants.js';
import { teamScoreTotal } from '../logic/gameHelpers.js';

export default function FactionChart({ chartData, maxTurns, maxChartValue, teamScores, winningTeam, taxPool }) {
    return (
        <div className="col-span-6 min-h-[540px] rounded-3xl border-4 border-slate-900 bg-slate-50 p-4 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <div>
                    <h2 className="text-2xl font-black">Faction Graph</h2>
                    <p className="text-sm text-slate-500">Each card favours one of five factions. X-axis is turn count. The owner suggests first, then everyone votes.</p>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center">
                    {STANCES.map((stance) => <div key={stance.key} className={`${stance.soft} rounded-xl p-2 border ${stance.border}`}><div className={`text-xs ${stance.text}`}>{stance.short}</div><div className={`font-black ${stance.text}`}>{teamScores[stance.key]}</div></div>)}
                </div>
            </div>

            <div className="flex-1 min-h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="turn" domain={[0, maxTurns]} type="number" ticks={[0, Math.round(maxTurns * 0.25), Math.round(maxTurns * 0.5), Math.round(maxTurns * 0.75), maxTurns]} />
                        <YAxis domain={[maxChartValue.bottom, maxChartValue.top]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="baseline" name="Baseline" stroke="#111827" strokeDasharray="6 6" strokeWidth={2} dot={false} />
                        {STANCES.map((stance) => <Line key={stance.key} type="monotone" dataKey={stance.key} name={stance.label} stroke={stance.stroke} strokeWidth={3} dot={{ r: 3 }} />)}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                <div className="rounded-2xl bg-slate-900 text-white p-3 flex justify-between"><span>Combined faction total</span><strong>{teamScoreTotal(teamScores)}</strong></div>
                <div className="rounded-2xl bg-yellow-100 text-yellow-950 p-3 flex justify-between"><span>Leader</span><strong>{winningTeam.label}</strong></div>
                <div className="rounded-2xl bg-green-50 text-green-950 p-3 flex justify-between"><span>Tax Pool</span><strong>{taxPool}</strong></div>
            </div>
        </div>
    );
}
