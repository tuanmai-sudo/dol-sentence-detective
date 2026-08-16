import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidLinkLabel, linkSlots, missions } from '../src/game-data.js'

test('writing mission has a complete ten-sentence loop', () => {
  assert.equal(missions.length, 10)
  assert.ok(missions.every((mission) => mission.idea.length === 2))
  assert.ok(missions.every((mission) => mission.pattern && mission.sample.endsWith('.')))
})

test('linking round covers five transitions with the requested words', () => {
  assert.deepEqual(linkSlots.map((slot) => slot.answer), ['First,', 'Second,', 'However,', 'First,', 'Besides,'])
  assert.equal(new Set(linkSlots.map((slot) => slot.before)).size, linkSlots.length)
})

test('mission narration and reference answers match slides 32–41 and 45–46', () => {
  assert.deepEqual(missions.map((mission) => mission.prompt), [
    'Let’s begin!',
    'Great job! Here’s another one.',
    'Very well done! Here’s something a bit harder!',
    'You aced it! How about this one?',
    'Another idea for you!',
    'This one’s easy. See if you can do it in 1 minute!',
    'This one’s hard! Challenge your best friend! Who can do it faster?',
    'You’re really good! Try this!',
    'Finally! We’re nearly done. Only one more!',
    'I lied! But really, here’s the last one!',
  ])
  assert.equal(missions[4].sample, 'This helps them to become open-minded.')
  assert.equal(missions[6].sample, 'Having bad English prevents students from communicating well.')
})

test('Second and Besides are interchangeable in the two addition slots', () => {
  assert.equal(isValidLinkLabel(3, 'Second,'), true)
  assert.equal(isValidLinkLabel(3, 'Besides,'), true)
  assert.equal(isValidLinkLabel(8, 'Second,'), true)
  assert.equal(isValidLinkLabel(8, 'Besides,'), true)
  assert.equal(isValidLinkLabel(5, 'However,'), true)
  assert.equal(isValidLinkLabel(5, 'Second,'), false)
})
