/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';

export function Badge({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 py-1 text-xs font-medium text-white bg-white/10 rounded-md">
      {children}
    </div>
  );
}
