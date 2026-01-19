export const moduleName = "auto_feature_06";
export const revision = 6;

export const featureBrief = {
  title: "flashy-game-1",
  summary: "A focused product module.",
  checkpoints: [
    "Define success metric",
    "Ship first user flow",
    "Instrument activation funnel",
  ],
};

export const getNextAction = () =>
  featureBrief.checkpoints[0] || "Ship the MVP";
