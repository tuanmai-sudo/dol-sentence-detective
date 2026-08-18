import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateAccuracy, challenges, countComponents, getPerformance } from '../src/game-data.js'

test('game contains ten fixed B1 sentence challenges', () => {
  assert.equal(challenges.length, 10)
  assert.equal(new Set(challenges.map(({ id }) => id)).size, 10)
  assert.ok(challenges.every(({ segments, steps }) => segments.length > steps.length))
})

test('every step points to one unique clickable section in its sentence', () => {
  challenges.forEach(({ id, segments, steps }) => {
    const selectable = segments.filter(({ context }) => !context)
    const selectableIds = new Set(selectable.map(({ id }) => id))
    assert.equal(selectableIds.size, selectable.length, `${id} has duplicate sections`)
    steps.forEach(({ answer }) => assert.ok(selectableIds.has(answer), `${id} is missing ${answer}`))
    assert.equal(new Set(steps.map(({ answer }) => answer)).size, steps.length, `${id} reuses an answer`)
  })
})

test('verb patterns are progressively revealed and later questions stay simple', () => {
  assert.ok(challenges.every(({ instruction }) => !instruction.includes('+ somebody')))
  assert.ok(challenges.some(({ steps }) => steps.some(({ pattern }) => pattern === 'encourage + somebody + to V')))
  assert.deepEqual(challenges[0].steps.slice(2).map(({ label }) => label), ['V', 'Noun', 'Adj'])
  assert.deepEqual(challenges[0].steps.slice(3).map(({ revealAt }) => revealAt), [3, 3])
  assert.ok(challenges.slice(2).every(({ structure }) => !/Although|If|Because/.test(structure)))
  assert.ok(challenges.every(({ steps }) => steps.every(({ label }) => !/Object|Base verb/i.test(label))))
})

test('questions two and three use the requested sections', () => {
  assert.equal(challenges[1].steps[0].answer, 'reduce-stress')
  assert.equal(challenges[1].steps.at(-1).answer, 'study-plan')
  assert.deepEqual(challenges[2].steps.map(({ answer }) => answer), ['students', 'participate', 'interesting-activities'])
  assert.ok(challenges[2].segments.some(({ context, text }) => context && text === 'in'))
})

test('performance bands and accuracy follow incorrect-check scoring', () => {
  assert.equal(getPerformance(0).title, 'Exceptional job!')
  assert.equal(getPerformance(3).title, 'Well done!')
  assert.equal(getPerformance(4).title, 'Good effort!')
  assert.equal(getPerformance(8).title, 'Keep practising!')
  assert.equal(calculateAccuracy(50, 0), 100)
  assert.equal(calculateAccuracy(50, 10), 83)
  assert.equal(countComponents(), 41)
})
