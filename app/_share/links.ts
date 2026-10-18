// Share URLs and captions. Plain module (no "use client"): server pages build paths with these.

export const linkedIn = (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

/** Every outward link carries the sharer's handle, so sign-ups through it count as invites. */
export const withRef = (path: string, handle: string | null | undefined) =>
  handle ? `${path}${path.includes("?") ? "&" : "?"}ref=${encodeURIComponent(handle)}` : path;

// --- captions: written for the sharer's voice, plain and specific ----------------------------

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const captions = {
  profile: () =>
    "I review university inventions as an analyser on AVP, the Academic Venture Pipeline: reading the patents, judging how ready they are, and spotting the ones worth taking to market.",
  tier: (tier: string) =>
    `I just reached ${cap(tier)} on AVP, the Academic Venture Pipeline. Tiers there are earned when other analysers find your reviews of university technologies helpful.`,
  badge: (label: string, description: string) =>
    `New badge on AVP, the Academic Venture Pipeline: ${label}. ${description}.`,
  technology: (title: string, university: string) =>
    `${title}, from ${university}, is one of the more novel technologies I've read on AVP, the Academic Venture Pipeline. Worth a look if you follow university innovation.`,
};
