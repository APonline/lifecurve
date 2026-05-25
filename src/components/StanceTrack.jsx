import { STANCES } from '../data/constants.js';

export default function StanceTrack({ value, onChange }) {
    return (
        <div className="space-y-2">
            <div className="relative px-2">
                <div className="absolute left-4 right-4 top-3 h-1 rounded-full bg-slate-300" />
                <div className="relative flex justify-between">
                    {STANCES.map((stance, index) => (
                        <button key={stance.key} type="button" onClick={() => onChange(index)} className={`h-7 w-7 rounded-full border-4 transition-all ${value === index ? `${stance.bg} border-slate-950 scale-110` : 'bg-white border-slate-300'}`} title={stance.label} />
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-5 gap-1 text-[10px] font-black text-center leading-tight">
                {STANCES.map((stance, index) => (
                    <button key={stance.key} type="button" onClick={() => onChange(index)} className={value === index ? stance.text : 'text-slate-400'}>{stance.label}</button>
                ))}
            </div>
            <input type="range" min="0" max="4" step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-slate-950" />
        </div>
    );
}
