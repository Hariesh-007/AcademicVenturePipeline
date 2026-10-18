// Analyser guidelines: what to look for, and what a 1 / 3 / 5 means on each dimension.
// Shown beside the review form so every analyser scores against the same anchors.

export type Dimension = {
  key: "novelty" | "productisation" | "feasibility" | "market";
  label: string;
  question: string;
  anchors: Record<1 | 3 | 5, string>;
  lookFor: string[];
};

export const DIMENSIONS: Dimension[] = [
  {
    key: "novelty",
    label: "Novelty",
    question: "Is this genuinely new, or a small step on what already exists?",
    anchors: {
      1: "Close to known products or prior art; the claims are narrow or easy to design around.",
      3: "A real improvement on existing approaches, but competitors could reach it another way.",
      5: "A new mechanism or capability; broad independent claims that are hard to work around.",
    },
    lookFor: ["Independent claims: how broad is claim 1?", "What the background section says it improves on", "Cited prior art and how different this is"],
  },
  {
    key: "productisation",
    label: "Productisation",
    question: "Can this become something a customer buys, uses and pays for?",
    anchors: {
      1: "No clear product form; it is a research result, not something anyone can hold or deploy.",
      3: "A plausible product exists, but it needs a partner, other components or a new process.",
      5: "An obvious product with a clear user, a clear buyer and a simple route to make it.",
    },
    lookFor: ["Who would use it, and who would pay", "Whether it works as a component or a whole product", "What else must exist for it to be useful"],
  },
  {
    key: "feasibility",
    label: "Technical feasibility",
    question: "Will it work outside the lab, at a cost and scale that matters?",
    anchors: {
      1: "Depends on rare materials, extreme conditions, or results not yet reproduced.",
      3: "Works in the lab; scale-up or reliability is unproven but has no known blocker.",
      5: "Uses standard materials and processes; data shows it holds under realistic conditions.",
    },
    lookFor: ["Examples and data in the description", "Materials, operating conditions, yields", "Anything that would be hard to manufacture"],
  },
  {
    key: "market",
    label: "Market potential",
    question: "Is there a big enough, reachable market that needs this now?",
    anchors: {
      1: "Niche or unclear demand; incumbents already solve the problem well enough.",
      3: "A real market with a clear pain, but crowded or slow to buy (heavy regulation, long cycles).",
      5: "A large or fast-growing market with an urgent problem and few good answers today.",
    },
    lookFor: ["The problem statement and who has it", "Regulation or certification it would need", "Existing alternatives and their price"],
  },
];

export const VERDICTS = [
  { value: "promising", label: "Promising", hint: "Worth taking to incubation or a licensing partner." },
  { value: "needs_work", label: "Needs work", hint: "Interesting, but key evidence or a product form is missing." },
  { value: "not_viable", label: "Not viable", hint: "Unlikely to become a product in its current form." },
] as const;

export const RED_FLAGS = [
  "Patent lapsed, abandoned or only provisional, with no follow-up filing",
  "Claims cover a method nobody would pay to use",
  "Performance shown only in simulation",
  "Needs a regulatory approval that would outlast the patent",
  "The applicant has already licensed it elsewhere",
];

export const GOOD_REVIEW = [
  "Name the single biggest reason it could succeed, and the biggest reason it could fail.",
  "Point to the page or claim that supports each score.",
  "Say what evidence would change your verdict.",
];
