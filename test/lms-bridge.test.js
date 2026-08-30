import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLMSResult, readLMSContext } from '../src/lms-bridge.js'

test('reads learner and parent context supplied by the LMS', () => {
  const context = readLMSContext('?studentId=s1&studentName=An%20Nguyen&courseId=c1&assignmentId=a1&parentOrigin=https%3A%2F%2Flms.example.com')
  assert.deepEqual(context, {
    learner: { studentId: 's1', studentName: 'An Nguyen', courseId: 'c1', assignmentId: 'a1' },
    gameId: '', attemptId: 'standalone', parentOrigin: 'https://lms.example.com',
  })
})

test('builds the completion payload expected by DOL LMS', () => {
  const result = buildLMSResult({ gameId: 'game-1', score: 8, maxScore: 10, durationSeconds: 61.4, answers: [{ correct: true }], completedAt: '2026-08-31T00:00:00.000Z' })
  assert.equal(result.event, 'DOL_LMS_RESULT')
  assert.equal(result.status, 'completed')
  assert.equal(result.score, 8)
  assert.equal(result.maxScore, 10)
  assert.equal(result.durationSeconds, 61)
  assert.equal(result.correctCount, 8)
  assert.equal(result.incorrectCount, 2)
  assert.deepEqual(result.answers, [{ correct: true }])
})
