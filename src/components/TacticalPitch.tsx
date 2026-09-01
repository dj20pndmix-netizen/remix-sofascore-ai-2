/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TacticalPitch: Interactive 2D Visual Football Pitch
 * Renders verified Starting XI formations, player nodes, tactical shapes,
 * pressing intensity, and manager profiles.
 */

import React, { useState } from 'react';
import type { GroundedTeamLineup } from '../types';
import {
  Users,
  Shield,
  Zap,
  Sparkles,
  Info,
  Layers,
  Activity,
  Award
} from 'lucide-react';

interface TacticalPitchProps {
  homeTeam: string;
  awayTeam: string;
  homeLineup: GroundedTeamLineup;
  awayLineup: GroundedTeamLineup;
  homeLogo?: string;
  awayLogo?: string;
}

interface PlayerCoord {
  name: string;
  role: string;
  x: number; // percentage from left (0 - 100)
  y: number; // percentage from top (0 - 100)
  number: number;
}

/**
 * Maps player names and formation string to precise X/Y pitch coordinates
 */
function getFormationCoordinates(formation: string, startingXI: string[], isHome: boolean = true): PlayerCoord[] {
  const cleanXI = startingXI && startingXI.length >= 11
    ? startingXI
    : [
        'Goalkeeper (GK)',
        'Right Back (RB)',
        'Center Back 1 (CB)',
        'Center Back 2 (CB)',
        'Left Back (LB)',
        'Defensive Mid (DM)',
        'Central Mid 1 (CM)',
        'Central Mid 2 (CM)',
        'Right Winger (RW)',
        'Left Winger (LW)',
        'Center Forward (CF)'
      ];

  // Default coordinate presets based on popular formations
  const formLower = (formation || '4-3-3').trim();

  let coords: Array<{ x: number; y: number; defaultRole: string }> = [];

  if (formLower.includes('4-2-3-1')) {
    coords = [
      { x: 50, y: 88, defaultRole: 'GK' },
      { x: 15, y: 70, defaultRole: 'LB' },
      { x: 38, y: 73, defaultRole: 'CB' },
      { x: 62, y: 73, defaultRole: 'CB' },
      { x: 85, y: 70, defaultRole: 'RB' },
      { x: 35, y: 54, defaultRole: 'DM' },
      { x: 65, y: 54, defaultRole: 'DM' },
      { x: 18, y: 35, defaultRole: 'LM' },
      { x: 50, y: 33, defaultRole: 'AM' },
      { x: 82, y: 35, defaultRole: 'RM' },
      { x: 50, y: 15, defaultRole: 'ST' }
    ];
  } else if (formLower.includes('3-5-2') || formLower.includes('3-4-1-2')) {
    coords = [
      { x: 50, y: 88, defaultRole: 'GK' },
      { x: 26, y: 72, defaultRole: 'CB' },
      { x: 50, y: 74, defaultRole: 'CB' },
      { x: 74, y: 72, defaultRole: 'CB' },
      { x: 12, y: 48, defaultRole: 'LWB' },
      { x: 35, y: 52, defaultRole: 'CM' },
      { x: 50, y: 40, defaultRole: 'AM' },
      { x: 65, y: 52, defaultRole: 'CM' },
      { x: 88, y: 48, defaultRole: 'RWB' },
      { x: 36, y: 18, defaultRole: 'CF' },
      { x: 64, y: 18, defaultRole: 'CF' }
    ];
  } else if (formLower.includes('4-4-2')) {
    coords = [
      { x: 50, y: 88, defaultRole: 'GK' },
      { x: 15, y: 70, defaultRole: 'LB' },
      { x: 38, y: 73, defaultRole: 'CB' },
      { x: 62, y: 73, defaultRole: 'CB' },
      { x: 85, y: 70, defaultRole: 'RB' },
      { x: 15, y: 45, defaultRole: 'LM' },
      { x: 38, y: 48, defaultRole: 'CM' },
      { x: 62, y: 48, defaultRole: 'CM' },
      { x: 85, y: 45, defaultRole: 'RM' },
      { x: 36, y: 18, defaultRole: 'CF' },
      { x: 64, y: 18, defaultRole: 'CF' }
    ];
  } else if (formLower.includes('5-3-2') || formLower.includes('5-2-3')) {
    coords = [
      { x: 50, y: 88, defaultRole: 'GK' },
      { x: 12, y: 68, defaultRole: 'LWB' },
      { x: 30, y: 73, defaultRole: 'CB' },
      { x: 50, y: 75, defaultRole: 'CB' },
      { x: 70, y: 73, defaultRole: 'CB' },
      { x: 88, y: 68, defaultRole: 'RWB' },
      { x: 30, y: 48, defaultRole: 'CM' },
      { x: 50, y: 45, defaultRole: 'DM' },
      { x: 70, y: 48, defaultRole: 'CM' },
      { x: 36, y: 18, defaultRole: 'CF' },
      { x: 64, y: 18, defaultRole: 'CF' }
    ];
  } else {
    // Standard 4-3-3
    coords = [
      { x: 50, y: 88, defaultRole: 'GK' },
      { x: 15, y: 70, defaultRole: 'LB' },
      { x: 38, y: 73, defaultRole: 'CB' },
      { x: 62, y: 73, defaultRole: 'CB' },
      { x: 85, y: 70, defaultRole: 'RB' },
      { x: 50, y: 54, defaultRole: 'DM' },
      { x: 30, y: 42, defaultRole: 'CM' },
      { x: 70, y: 42, defaultRole: 'CM' },
      { x: 18, y: 22, defaultRole: 'LW' },
      { x: 82, y: 22, defaultRole: 'RW' },
      { x: 50, y: 15, defaultRole: 'CF' }
    ];
  }

  return cleanXI.slice(0, 11).map((playerStr, idx) => {
    const rawName = playerStr.replace(/\([^)]*\)/g, '').trim();
    const roleMatch = playerStr.match(/\(([^)]+)\)/);
    const role = roleMatch ? roleMatch[1] : coords[idx]?.defaultRole || `P${idx + 1}`;
    const coord = coords[idx] || { x: 50, y: 50 };

    return {
      name: rawName || `Player ${idx + 1}`,
      role,
      x: coord.x,
      y: coord.y,
      number: idx + 1
    };
  });
}

export function TacticalPitch({
  homeTeam,
  awayTeam,
  homeLineup,
  awayLineup,
  homeLogo,
  awayLogo
}: TacticalPitchProps) {
  const [selectedSide, setSelectedSide] = useState<'home' | 'away'>('home');
  const [hoveredPlayer, setHoveredPlayer] = useState<PlayerCoord | null>(null);

  const activeLineup = selectedSide === 'home' ? homeLineup : awayLineup;
  const activeTeamName = selectedSide === 'home' ? homeTeam : awayTeam;
  const activeLogo = selectedSide === 'home' ? homeLogo : awayLogo;
  const isHome = selectedSide === 'home';

  const playerCoords = getFormationCoordinates(
    activeLineup.formation || '4-3-3',
    activeLineup.startingXI || [],
    isHome
  );

  return (
    <div className="space-y-4">
      {/* Team Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-2.5 rounded-xl border border-white/10">
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5">
          <button
            onClick={() => setSelectedSide('home')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              selectedSide === 'home'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>{homeTeam}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30 font-mono">
              {homeLineup.formation || '4-3-3'}
            </span>
          </button>

          <button
            onClick={() => setSelectedSide('away')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              selectedSide === 'away'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>{awayTeam}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30 font-mono">
              {awayLineup.formation || '4-2-3-1'}
            </span>
          </button>
        </div>

        {/* Manager and Status Tag */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400">
            Manager: <strong className="text-white">{activeLineup.manager || 'Head Coach'}</strong>
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              activeLineup.isConfirmed
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}
          >
            {activeLineup.isConfirmed ? '✓ Confirmed XI' : 'Projected XI'}
          </span>
        </div>
      </div>

      {/* 2D Football Pitch Arena */}
      <div className="relative w-full max-w-2xl mx-auto aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-900 via-emerald-850 to-emerald-950 select-none">
        {/* Pitch Stripes Effect */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(0,0,0,0.3)_40px,rgba(0,0,0,0.3)_80px)]"></div>

        {/* Pitch Lines (SVG Overlay) */}
        <svg className="absolute inset-0 w-full h-full stroke-white/40 fill-none" strokeWidth="1.5">
          {/* Outer Boundary */}
          <rect x="5%" y="4%" width="90%" height="92%" rx="4" />

          {/* Halfway Line */}
          <line x1="5%" y1="50%" x2="95%" y2="50%" />

          {/* Center Circle & Spot */}
          <circle cx="50%" cy="50%" r="14%" />
          <circle cx="50%" cy="50%" r="2" fill="white" className="fill-white/60" />

          {/* Attacking Penalty Box (Top) */}
          <rect x="22%" y="4%" width="56%" height="18%" />
          <rect x="35%" y="4%" width="30%" height="7%" />
          <path d="M 40% 22% A 12% 12% 0 0 0 60% 22%" />

          {/* Defending Penalty Box (Bottom) */}
          <rect x="22%" y="78%" width="56%" height="18%" />
          <rect x="35%" y="89%" width="30%" height="7%" />
          <path d="M 40% 78% A 12% 12% 0 0 1 60% 78%" />

          {/* Goal Lines */}
          <line x1="42%" y1="2%" x2="58%" y2="2%" strokeWidth="3" />
          <line x1="42%" y1="98%" x2="58%" y2="98%" strokeWidth="3" />
        </svg>

        {/* Tactical Direction Watermark */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold text-white/25 tracking-widest pointer-events-none">
          ▲ Attacking Direction ▲
        </div>

        {/* Formation Label Watermark */}
        <div className="absolute bottom-2 right-4 text-[12px] font-mono font-bold text-white/30 pointer-events-none">
          {activeTeamName} • {activeLineup.formation || '4-3-3'}
        </div>

        {/* 11 Starting Players (Interactive Nodes) */}
        {playerCoords.map((player) => {
          const isSelected = hoveredPlayer?.number === player.number;
          return (
            <div
              key={`player-node-${player.number}`}
              style={{
                left: `${player.x}%`,
                top: `${player.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onMouseEnter={() => setHoveredPlayer(player)}
              onMouseLeave={() => setHoveredPlayer(null)}
              className="absolute group cursor-pointer z-10 flex flex-col items-center"
            >
              {/* Jersey Node */}
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition-transform duration-150 border-2 ${
                  isHome
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-white'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-700 text-white border-white'
                } ${isSelected ? 'scale-125 ring-4 ring-amber-400 ring-offset-1' : 'group-hover:scale-110'}`}
              >
                <span className="font-mono text-[11px] font-black">{player.number}</span>
              </div>

              {/* Player Name and Role Label */}
              <div className="mt-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur border border-white/20 text-center text-[10px] font-medium text-white max-w-[90px] sm:max-w-[110px] truncate shadow">
                <span className="text-amber-300 font-bold mr-1">{player.role}</span>
                <span className="truncate">{player.name.split(' ').pop() || player.name}</span>
              </div>

              {/* Hover Tooltip Card */}
              {isSelected && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-neutral-900/95 p-2.5 rounded-xl border border-white/20 shadow-2xl text-xs text-neutral-200 z-30 pointer-events-none animate-in fade-in zoom-in-95">
                  <div className="font-bold text-white text-xs border-b border-white/10 pb-1 flex items-center justify-between">
                    <span>{player.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                      #{player.number}
                    </span>
                  </div>
                  <div className="mt-1.5 space-y-1 text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Position:</span>
                      <strong className="text-white">{player.role}</strong>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Team:</span>
                      <span className="text-neutral-200">{activeTeamName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tactical Shape & Manager Philosophy Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Zap className="w-4 h-4" />
            <span>Tactical Shape &amp; Build-Up Profile</span>
          </div>
          <p className="text-neutral-300 leading-relaxed text-[11px]">
            {activeLineup.tacticalNotes ||
              `${activeTeamName} sets up in a structured ${activeLineup.formation || '4-3-3'} formation, focusing on disciplined positional spacing and progressive vertical build-up.`}
          </p>
        </div>

        <div className="bg-neutral-900/70 p-3.5 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <Award className="w-4 h-4" />
            <span>Manager &amp; Press Strategy</span>
          </div>
          <p className="text-neutral-300 leading-relaxed text-[11px]">
            Head Coach <strong className="text-white">{activeLineup.manager || 'Manager'}</strong> operates with emphasis on mid-block territorial control and counter-pressing triggers when possession transitions.
          </p>
        </div>
      </div>
    </div>
  );
}
