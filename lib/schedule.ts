// Local-first scheduling: tiny NL parser + slot proposals. No paid APIs.
export interface SlotProposal {
  startsAt: Date;
  endsAt: Date;
  label: string;
}

function atHour(base: Date, h: number): Date {
  const d = new Date(base);
  d.setHours(h, 0, 0, 0);
  return d;
}

// Parses "schedule X tomorrow", "... on friday", "... in 3 days", "... today".
// Returns { title, baseDate } — title is the text minus the date phrase.
export function parseScheduleRequest(raw: string): { title: string; baseDate: Date } {
  const input = raw.trim();
  const now = new Date();
  const lower = input.toLowerCase();
  let base = new Date(now);
  let title = input.replace(/^schedule\s+/i, "").trim();

  const dayIn = lower.match(/in (\d+) days?/);
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const wdMatch = weekdays.findIndex((d) => lower.includes(d));

  if (lower.includes("tomorrow")) {
    base.setDate(base.getDate() + 1);
    title = title.replace(/tomorrow/gi, "").trim();
  } else if (dayIn) {
    base.setDate(base.getDate() + parseInt(dayIn[1], 10));
    title = title.replace(dayIn[0], "").trim();
  } else if (wdMatch >= 0) {
    const delta = (wdMatch - base.getDay() + 7) % 7 || 7;
    base.setDate(base.getDate() + delta);
    title = title.replace(new RegExp(weekdays[wdMatch], "gi"), "").trim();
  } else if (lower.includes("today")) {
    title = title.replace(/today/gi, "").trim();
  }
  title = title.replace(/\s+on\s*$/i, "").replace(/\s{2,}/g, " ").trim() || "Untitled meeting";
  return { title, baseDate: base };
}

export function proposeSlots(baseDate: Date): SlotProposal[] {
  return [10, 14, 16].map((h) => {
    const startsAt = atHour(baseDate, h);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    return {
      startsAt,
      endsAt,
      label: `${startsAt.toLocaleDateString()} ${h}:00–${h + 1}:00`,
    };
  });
}
