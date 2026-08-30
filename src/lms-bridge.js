function validOrigin(value) {
  if (!value) return ''
  if (value === '*') return '*'
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : ''
  } catch { return '' }
}

export function readLMSContext(search = '', referrer = '') {
  const params = new URLSearchParams(search)
  const learner = {
    studentId: params.get('studentId') || params.get('userId') || '',
    studentName: params.get('studentName') || params.get('name') || '',
    courseId: params.get('courseId') || '',
    assignmentId: params.get('assignmentId') || '',
  }
  return {
    learner,
    parentOrigin: validOrigin(params.get('parentOrigin')) || validOrigin(referrer) || '*',
  }
}

export function buildLMSResult({
  gameId, learner = {}, score = 0, maxScore = 0, durationSeconds = 0,
  correctCount, incorrectCount, answers = [], details = {}, completedAt,
}) {
  const normalizedScore = Number(score) || 0
  const normalizedMax = Number(maxScore) || 0
  return {
    event: 'DOL_LMS_RESULT',
    gameId,
    status: 'completed',
    learner,
    score: normalizedScore,
    maxScore: normalizedMax,
    durationSeconds: Math.max(0, Math.round(Number(durationSeconds) || 0)),
    correctCount: Number.isFinite(Number(correctCount)) ? Number(correctCount) : normalizedScore,
    incorrectCount: Number.isFinite(Number(incorrectCount)) ? Number(incorrectCount) : Math.max(0, normalizedMax - normalizedScore),
    answers: Array.isArray(answers) ? answers : [],
    details,
    completedAt: completedAt || new Date().toISOString(),
  }
}

export function createLMSBridge(gameId) {
  const context = readLMSContext(window.location.search, document.referrer)
  let startedAt = Date.now()
  const post = (payload) => {
    if (window.parent !== window) window.parent.postMessage(payload, context.parentOrigin)
  }
  return {
    learner: context.learner,
    resetTimer() { startedAt = Date.now() },
    progress(details = {}) {
      post({ event: 'DOL_GAME_PROGRESS', gameId, status: 'in_progress', learner: context.learner, details })
    },
    complete(result = {}) {
      const payload = buildLMSResult({
        ...result,
        gameId,
        learner: context.learner,
        durationSeconds: result.durationSeconds ?? (Date.now() - startedAt) / 1000,
      })
      post(payload)
      return payload
    },
  }
}
