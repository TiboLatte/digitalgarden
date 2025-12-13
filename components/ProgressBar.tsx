'use client';

interface ProgressBarProps {
    value: number;
    max: number;
    onChange: (value: number) => void;
}

export function ProgressBar({ value, max, onChange }: ProgressBarProps) {
    const percent = max > 0 ? (value / max) * 100 : 0;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newPercent = (clickX / rect.width) * 100;
        const newValue = Math.round((newPercent / 100) * max);
        onChange(Math.min(Math.max(0, newValue), max));
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between text-xs font-medium text-text-muted">
                <span>Page {value} of {max}</span>
                <span>{Math.round(percent)}%</span>
            </div>

            {/* Custom Progress Bar with Visual Fill */}
            <div
                className="relative w-full h-3 bg-card-border rounded-full cursor-pointer group"
                onClick={handleClick}
            >
                {/* Filled portion (accent colored) */}
                <div
                    className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all duration-200"
                    style={{ width: `${percent}%` }}
                />

                {/* Slider handle */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-card border-2 border-accent rounded-full shadow-md group-hover:scale-110 transition-transform cursor-grab"
                    style={{ left: `calc(${percent}% - 10px)` }}
                />
            </div>

            {/* Hidden range input for accessibility */}
            <input
                type="range"
                min="0"
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="sr-only"
                aria-label="Reading progress"
            />
        </div>
    );
}
