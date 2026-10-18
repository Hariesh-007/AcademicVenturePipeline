// NASA TRL scale (esto.nasa.gov/trl), shortened. `evidence` = what a reviewer would typically expect to see.
export const TRL_LEVELS = [
  { n: 1, title: "Basic principles observed", evidence: "Peer-reviewed publication of the underlying science." },
  { n: 2, title: "Concept formulated", evidence: "A practical application is described, but still speculative." },
  { n: 3, title: "Proof of concept", evidence: "Lab results that validate the key predicted parameters." },
  { n: 4, title: "Validated in the lab", evidence: "Components work together in a laboratory environment." },
  { n: 5, title: "Validated in a relevant environment", evidence: "Performance holds under realistic conditions and inputs." },
  { n: 6, title: "Prototype in a relevant environment", evidence: "A representative prototype is demonstrated end to end." },
  { n: 7, title: "Prototype in an operational environment", evidence: "A near-final system runs where it would actually be used." },
  { n: 8, title: "System complete and qualified", evidence: "Final system passes test and qualification." },
  { n: 9, title: "Proven in operation", evidence: "Successful operation over real missions or production runs." },
];
