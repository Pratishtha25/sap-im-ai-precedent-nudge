/**
 * MVP task allow-list matchers (title fallback until workflow step IDs are known).
 */

const DEFAULT_TITLE_PATTERNS = [
  /Root\s+Causes\s+Hierarchy/i,
  /Review\s+and\s+complete\s+investigation/i,
];

/**
 * @param {string} taskTitle
 * @param {string[]} [allowedStepIds] stable IDs when discovered
 * @param {string} [taskStepId]
 * @returns {boolean}
 */
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
