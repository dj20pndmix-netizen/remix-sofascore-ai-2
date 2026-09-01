/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-neutral-400 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-mono text-white">{value}</div>
    </div>
  );
}
