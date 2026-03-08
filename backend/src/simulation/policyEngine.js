const policy = {
  taxRate: 0.1,
  policeStrength: 0.2,
  welfareRate: 0.25,
  stimulusMultiplier: 1,
};

function updatePolicy(newPolicy) {
  Object.assign(policy, newPolicy);
}

function getPolicy() {
  return policy;
}

export { getPolicy, updatePolicy };
