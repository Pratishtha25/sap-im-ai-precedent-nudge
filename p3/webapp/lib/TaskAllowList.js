/**
 * MVP task allow-list for My Inbox precedent teaser.
 */

const DEFAULT_TITLE_PATTERNS = [
  /Root\s+Causes\s+Hierarchy/i,
  /Review\s+and\s+complete\s+investigation/i,
  /Review\s+and\s+Complete\s+Incident/i,
];

function isTaskAllowedForPrecedent(taskTitle, allowedStepIds = [], taskStepId) {
  if (taskStepId && allowedStepIds.length > 0) {
    return allowedStepIds.includes(taskStepId);
  }
  if (!taskTitle || typeof taskTitle !== "string") return false;
  return DEFAULT_TITLE_PATTERNS.some((re) => re.test(taskTitle));
}

module.exports = {
  DEFAULT_TITLE_PATTERNS,
  isTaskAllowedForPrecedent,
};
