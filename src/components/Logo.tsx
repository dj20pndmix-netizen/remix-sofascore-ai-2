/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface LogoProps {
  showText?: boolean;
  className?: string;
  iconSize?: string;
}

export function Logo({ showText = false, className = '', iconSize = 'w-9 h-9' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex-shrink-0">
        <img
          src="/icon-192.png"
          alt="PredictPro AI App Icon"
          className={`${iconSize} rounded-xl shadow-lg border border-emerald-500/50 object-cover bg-neutral-900 ring-2 ring-emerald-500/20`}
          onError={(e) => {
            // Fallback to svg icon if png not loaded
            const target = e.target as HTMLImageElement;
            if (!target.src.endsWith('/icon.svg')) {
              target.src = '/icon.svg';
            }
          }}
        />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-neutral-950 flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full animate-ping" />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-white text-base tracking-tight">
              PREDICT<span className="text-emerald-400">PRO</span>
            </span>
            <span className="bg-emerald-500 text-neutral-950 px-1.5 py-0.2 rounded font-extrabold text-[10px] tracking-wide">
              AI
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-medium tracking-wide">
            Quantitative Match Analytics
          </span>
        </div>
      )}
    </div>
  );
}
