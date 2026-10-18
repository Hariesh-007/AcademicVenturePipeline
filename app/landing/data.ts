// One illustrative technology follows the visitor through every scene.
// Nothing here is a real record — it is labelled "Illustrative example" wherever it renders.

export const TECH = {
  name: "Low-temperature CO₂-to-methanol catalyst",
  short: "CO₂ → methanol catalyst",
  ref: "IN 2019/041 · filed 2019 · status: unlicensed",
  trl: 4,
};

export { TRL_LEVELS } from "@/lib/trl"; // shared with the analyser reader

export const EVIDENCE = [
  { label: "Lab fixed-bed reactor runs", source: "Lab notebook · 2018" },
  { label: "100-hour stability result", source: "Journal article · 2020" },
  { label: "Catalyst composition claims", source: "Patent IN 2019/041" },
];

export const MISSING = [
  "Performance on real flue gas, with impurities",
  "Reproducible synthesis at kilogram scale",
  "Techno-economic analysis at pilot scale",
];

export const DISCOVERY_LINKS = ["Patents", "Papers", "Evidence", "Technical data", "Market", "Regulatory"];

export const GRAPH_NODES = ["Patent", "Research paper", "Prior art", "TEA / LCA", "Regulation", "Market", "Reviewer analysis"];

export const PIPELINE = ["Technology", "Evidence", "Analysis", "TRL", "Gaps", "Dossier"];
