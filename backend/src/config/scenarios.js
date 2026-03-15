const SCENARIOS = {
  baseline: {
    name: "Baseline Economy",
    label: "Baseline Economy",
    description: "Standard economic conditions with balanced policy levers.",
    policy: {
      taxRate: 0.1,
      policeStrength: 0.2,
      welfareRate: 0.25,
    },
  },
  highTax: {
    name: "High Tax Economy",
    label: "High Tax Economy",
    description: "Higher taxation to fund redistribution and public services.",
    policy: {
      taxRate: 0.25,
      policeStrength: 0.2,
      welfareRate: 0.25,
    },
  },
  highWelfare: {
    name: "High Welfare Economy",
    label: "High Welfare Economy",
    description: "Expanded welfare support to reduce social vulnerability.",
    policy: {
      taxRate: 0.15,
      policeStrength: 0.2,
      welfareRate: 0.4,
    },
  },
  highPolice: {
    name: "High Police Economy",
    label: "High Police Economy",
    description: "Increased policing emphasis for crime suppression.",
    policy: {
      taxRate: 0.1,
      policeStrength: 0.4,
      welfareRate: 0.25,
    },
  },
  economicCrisis: {
    name: "Economic Crisis",
    label: "Economic Crisis",
    description: "Stress scenario with elevated welfare and active stimulus.",
    policy: {
      taxRate: 0.08,
      policeStrength: 0.3,
      welfareRate: 0.45,
      stimulusMultiplier: 1.8,
    },
  },
};

export function getScenarioTemplates() {
  return SCENARIOS;
}

export function getScenarioByKey(key) {
  return SCENARIOS[key] || null;
}

export default SCENARIOS;
