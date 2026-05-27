// ============================================================================
// NFCC Digital Twin - Compliance Matrix
// ============================================================================
// Displays ISO/IEC/NFPA standards compliance status with implementation details.
// Each standard links to the corresponding division dashboard.
// Requirements: 23.1, 23.2, 23.3, 23.4
// ============================================================================

import { useState } from 'react';
import { useNFCCStore } from '../../core/store/useNFCCStore';
import { ISO_STANDARDS } from '../../core/constants/iso-standards';
import { DIVISIONS } from '../../core/constants/divisions';
import type { ISOClause } from '../../core/constants/iso-standards';
import type { DivisionId } from '../../core/types';

/** Resolves a DivisionId to its display name. */
function getDivisionName(id: DivisionId): string {
  const division = DIVISIONS.find((d) => d.id === id);
  return division ? division.name : `Division ${id}`;
}

/** Tooltip component shown on hover over a clause row. */
function ClauseTooltip({ clause }: { clause: ISOClause }): React.JSX.Element {
  return (
    <div
      className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
                 w-72 p-3 rounded-md
                 bg-black/90 backdrop-blur-lg border border-cyan-500/50
                 shadow-[0_0_20px_rgba(0,255,255,0.15)]
                 pointer-events-none"
    >
      <p className="text-xs text-cyan-300 font-mono font-semibold mb-1">
        Feature Implementation
      </p>
      <p className="text-xs text-gray-300 leading-relaxed">
        {clause.featureDescription}
      </p>
      <p className="text-xs text-gray-500 mt-2 font-mono">
        Implemented by:{' '}
        {clause.implementedBy.map((id) => getDivisionName(id)).join(', ')}
      </p>
      {/* Tooltip arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                      border-l-[6px] border-l-transparent
                      border-r-[6px] border-r-transparent
                      border-t-[6px] border-t-cyan-500/50" />
    </div>
  );
}

/** Single clause row within a standard section. */
function ClauseRow({
  clause,
  onNavigate,
}: {
  clause: ISOClause;
  onNavigate: (divisionId: DivisionId) => void;
}): React.JSX.Element {
  const [showTooltip, setShowTooltip] = useState(false);

  const primaryDivision = clause.implementedBy[0];

  return (
    <tr
      className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors duration-200 cursor-pointer"
      onClick={() => {
        if (primaryDivision !== undefined) {
          onNavigate(primaryDivision);
        }
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <td className="py-2 px-3 text-xs text-gray-400 font-mono">
        {clause.clauseId}
      </td>
      <td className="py-2 px-3 text-xs text-gray-300">
        {clause.title}
      </td>
      <td className="py-2 px-3 text-xs text-gray-500 hidden lg:table-cell">
        {clause.description}
      </td>
      <td className="py-2 px-3 text-center relative">
        {clause.implemented ? (
          <span className="text-green-400 text-sm font-bold" aria-label="Implemented">
            ✓
          </span>
        ) : (
          <span className="text-yellow-500 text-xs font-mono animate-pulse" aria-label="Pending">
            ◌
          </span>
        )}
        {showTooltip && <ClauseTooltip clause={clause} />}
      </td>
      <td className="py-2 px-3 text-xs text-cyan-400 font-mono hidden md:table-cell">
        {clause.implementedBy.map((id) => getDivisionName(id)).join(', ')}
      </td>
    </tr>
  );
}

/** Main Compliance Matrix component. */
export function ComplianceMatrix(): React.JSX.Element {
  const setActiveDivision = useNFCCStore((state) => state.setActiveDivision);

  const handleNavigateToDivision = (divisionId: DivisionId): void => {
    setActiveDivision(divisionId);
  };

  const totalClauses = ISO_STANDARDS.reduce(
    (sum, std) => sum + std.clauses.length,
    0
  );
  const implementedClauses = ISO_STANDARDS.reduce(
    (sum, std) => sum + std.clauses.filter((c) => c.implemented).length,
    0
  );

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-cyan-400 text-glow-cyan font-mono uppercase tracking-wider">
          Compliance Matrix
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono">
            {implementedClauses}/{totalClauses} CLAUSES COMPLIANT
          </span>
          <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden border border-cyan-500/20">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-green-400 rounded-full transition-all duration-700"
              style={{ width: `${(implementedClauses / totalClauses) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Standards Cards */}
      {ISO_STANDARDS.map((standard) => (
        <div
          key={standard.id}
          className="bg-black/50 backdrop-blur-md border border-cyan-500/30 rounded-lg
                     shadow-[0_0_15px_rgba(0,255,255,0.05)] overflow-hidden"
        >
          {/* Standard Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-mono font-bold text-sm">
                {standard.name}
              </span>
              <span className="text-xs text-gray-500">
                {standard.description}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-400 font-mono">
                {standard.clauses.filter((c) => c.implemented).length}/{standard.clauses.length}
              </span>
            </div>
          </div>

          {/* Clauses Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/15">
                  <th className="py-2 px-3 text-left text-xs text-gray-500 font-mono font-normal uppercase">
                    Clause
                  </th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500 font-mono font-normal uppercase">
                    Title
                  </th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500 font-mono font-normal uppercase hidden lg:table-cell">
                    Description
                  </th>
                  <th className="py-2 px-3 text-center text-xs text-gray-500 font-mono font-normal uppercase">
                    Status
                  </th>
                  <th className="py-2 px-3 text-left text-xs text-gray-500 font-mono font-normal uppercase hidden md:table-cell">
                    Division
                  </th>
                </tr>
              </thead>
              <tbody>
                {standard.clauses.map((clause) => (
                  <ClauseRow
                    key={clause.clauseId}
                    clause={clause}
                    onNavigate={handleNavigateToDivision}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-6 px-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-sm font-bold">✓</span>
          <span className="text-xs text-gray-500 font-mono">Implemented</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 text-xs font-mono">◌</span>
          <span className="text-xs text-gray-500 font-mono">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">Click row → Navigate to Division</span>
        </div>
      </div>
    </div>
  );
}

export default ComplianceMatrix;

