export function Button({ className = '', variant = 'default', size = 'default', disabled, ...props }) {
    const variants = {
        default: 'bg-slate-950 text-white hover:bg-slate-800',
        secondary: 'bg-slate-100 text-slate-950 hover:bg-slate-200',
        outline: 'border border-slate-300 bg-white text-slate-950 hover:bg-slate-100',
        ghost: 'bg-transparent text-inherit hover:bg-slate-100/60',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
    };
    const sizes = { default: 'px-4 py-2', sm: 'px-3 py-1.5 text-sm' };
    return <button disabled={disabled} className={`inline-flex items-center justify-center gap-2 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`} {...props} />;
}

export function Card({ className = '', ...props }) {
    return <div className={`border border-slate-200 bg-white ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }) {
    return <div className={className} {...props} />;
}

export function Badge({ className = '', variant = 'default', ...props }) {
    const cls = variant === 'outline' ? 'border border-slate-300 bg-white text-slate-950' : 'bg-slate-950 text-white';
    return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black ${cls} ${className}`} {...props} />;
}
