import { BadRequestException, Injectable } from '@nestjs/common';
import type { Trade, TradeDirection } from '../../trades/trade.entity';
import type { MapRowResult } from './types';

const DIRECTIONS: Record<string, TradeDirection> = {
  buy: 'BUY',
  long: 'BUY',
  sell: 'SELL',
  short: 'SELL',
};

const DECIMAL = /^-?\d+(\.\d+)?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// CSV header (your journal) → Trade field.
// required: true  → header must exist AND the value can't be empty.
// required: false → header may be missing; empty value becomes null.
// Mirrors the NOT NULL columns of the trades table.
const COLUMN_MAP = {
  'Trade #': { field: 'journalTradeId', required: true },
  Date: { field: 'tradedAt', required: true },
  Instrument: { field: 'instrument', required: true },
  Direction: { field: 'direction', required: true },
  'Risk (%)': { field: 'riskPct', required: true },
  RRR: { field: 'plannedRr', required: false },
  'Result in $': { field: 'resultUsd', required: true },
  Percentage: { field: 'resultPct', required: true },
  Description: { field: 'description', required: false },
  // 'Confluences' is not a trades column; it goes to the tags tables later.
} as const satisfies Record<string, { field: keyof Trade; required: boolean }>;

const REQUIRED_HEADERS = Object.entries(COLUMN_MAP)
  .filter(([, col]) => col.required)
  .map(([header]) => header);

@Injectable()
export class JournalCsvAdapter {
  // Used as csv-parse's `columns` option: called once with the first line,
  // the returned array becomes the keys of every row object.
  validateHeaders(headers: string[]): (string | undefined)[] {
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length) {
      throw new BadRequestException(
        `Missing required columns: ${missing.join(', ')}`,
      );
    }

    // undefined tells csv-parse to drop that column (e.g. Confluences, Column 1).
    return headers.map((h) => (h in COLUMN_MAP ? h : undefined));
  }

  // Never throws for bad data: returns { ok: false, reasons } with every
  // problem found, so the user can fix them all in one go.
  mapRow(row: Record<string, string | undefined>): MapRowResult {
    const reasons: string[] = [];
    // Optional headers may be absent entirely; treat that like an empty cell.
    const value = (header: keyof typeof COLUMN_MAP) => row[header] ?? '';

    for (const header of REQUIRED_HEADERS) {
      if (value(header as keyof typeof COLUMN_MAP) === '') {
        reasons.push(`${header} is required`);
      }
    }
    if (reasons.length) return { ok: false, reasons };

    const tradeId = value('Trade #');
    if (!/^\d+$/.test(tradeId)) reasons.push(`Trade # must be a whole number`);

    const date = value('Date');
    if (!ISO_DATE.test(date)) reasons.push(`Date must be YYYY-MM-DD`);

    const direction = DIRECTIONS[value('Direction').toLowerCase()];
    if (!direction) reasons.push(`Direction must be BUY/SELL (or LONG/SHORT)`);

    // numeric columns stay strings: exact decimals, no float rounding.
    const decimal = (header: keyof typeof COLUMN_MAP): string | null => {
      const v = value(header);
      if (v === '') return null;
      if (!DECIMAL.test(v)) reasons.push(`${header} must be a number`);
      return v;
    };
    const riskPct = decimal('Risk (%)');
    const plannedRr = decimal('RRR');
    const resultUsd = decimal('Result in $');
    const resultPct = decimal('Percentage');

    // realized_r = result_pct / risk_pct, so risk must be positive.
    if (riskPct && DECIMAL.test(riskPct) && Number(riskPct) <= 0) {
      reasons.push(`Risk (%) must be greater than 0`);
    }

    if (reasons.length) return { ok: false, reasons };

    const trade = {
      journalTradeId: Number(tradeId),
      // Journal has dates only; pin to UTC midnight so the server timezone can't shift it.
      tradedAt: new Date(`${date}T00:00:00Z`),
      instrument: value('Instrument').toUpperCase(),
      direction,
      // Required columns were checked above, so these are non-null here.
      riskPct: riskPct!,
      plannedRr,
      resultUsd: resultUsd!,
      resultPct: resultPct!,
      description: value('Description') || null,
    };
    return { ok: true, trade };
  }
}
