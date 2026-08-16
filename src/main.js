import './styles.css'
import logoUrl from '../assets/brand/dol-logo.png'
import correctUrl from '../assets/audio/sfx/correct-chime.mp3'
import wrongUrl from '../assets/audio/sfx/wrong-soft.mp3'
import victoryUrl from '../assets/audio/sfx/victory-fanfare.mp3'
import clippyUrl from './assets/clippy.png'
import { isValidLinkLabel, linkSlots, missions } from './game-data.js'

const sounds = {
  correct: new Audio(correctUrl),
  wrong: new Audio(wrongUrl),
  victory: new Audio(victoryUrl),
}

Object.values(sounds).forEach((sound) => { sound.volume = 0.42 })

const linkingTokens = [
  { id: 'first-a', label: 'First,' },
  { id: 'second', label: 'Second,' },
  { id: 'however', label: 'However,' },
  { id: 'first-b', label: 'First,' },
  { id: 'besides', label: 'Besides,' },
]

function shuffledTokens() {
  const tokens = [...linkingTokens]
  do {
    for (let index = tokens.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[tokens[index], tokens[swapIndex]] = [tokens[swapIndex], tokens[index]]
    }
  } while (tokens.map((token) => token.label).join('|') === linkSlots.map((slot) => slot.answer).join('|'))
  return tokens
}

const state = {
  phase: 'welcome',
  completed: [],
  hintVisible: false,
  muted: false,
  timer: 60,
  timerRunning: false,
  timerId: null,
  selectedToken: null,
  placements: {},
  feedback: '',
  feedbackKind: '',
  locking: false,
  tokenOrder: shuffledTokens(),
  linksChecked: false,
  invalidSlots: [],
}

const app = document.querySelector('#app')

const icons = {
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.5 3a4 4 0 0 0-2-3.46v6.92A4 4 0 0 0 16.5 12Z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm11.5 1 2 2-2 2 1.5 1.5 2-2 2 2 1.5-1.5-2-2 2-2L21 8.5l-2 2-2-2L15.5 10Z"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.65 9.2l2.08-.68A4.8 4.8 0 1 0 8.2 8.1L11 11H3V3l2.62 2.62A6.97 6.97 0 0 1 12 5Z"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21h6v-2H9v2Zm3-19a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2Zm2.1 11.68-.9.52V15h-2.4v-.8l-.9-.52a4.8 4.8 0 1 1 4.2 0Z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v10h14V10a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V6Zm3 9.73V18h-2v-2.27a2 2 0 1 1 2 0Z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 11h-5v-2h3V6h2v7Z"/></svg>',
}

function playSound(name) {
  if (state.muted) return
  const sound = sounds[name]
  sound.currentTime = 0
  sound.play().catch(() => {})
}

function tokenById(id) {
  return linkingTokens.find((token) => token.id === id)
}

function clippy(mood = 'thinking') {
  return `<div class="clippy clippy--${mood}" aria-hidden="true">
    <img src="${clippyUrl}" alt="" />
    <span class="clippy__talk-line clippy__talk-line--one"></span>
    <span class="clippy__talk-line clippy__talk-line--two"></span>
  </div>`
}

function topbar() {
  const count = state.completed.length
  return `<header class="topbar">
    <div class="brand">
      <img src="${logoUrl}" alt="DOL English" />
      <span class="brand__divider"></span>
      <div><strong>Clippy's Writing Mission</strong><small>Build it. Link it. Read it.</small></div>
    </div>
    <div class="teacher-tools">
      <div class="progress-summary" aria-label="${count} of 10 sentences complete">
        <span>Paragraph power</span>
        <div class="power-dots">${missions.map((_, index) => `<i class="${index < count ? 'is-filled' : ''}"></i>`).join('')}</div>
        <b>${count}/10</b>
      </div>
      <button class="icon-button" data-action="mute" aria-label="${state.muted ? 'Unmute sound' : 'Mute sound'}" title="${state.muted ? 'Unmute' : 'Mute'}">${state.muted ? icons.mute : icons.sound}</button>
      <button class="icon-button" data-action="reset" aria-label="Reset game" title="Reset game">${icons.reset}</button>
    </div>
  </header>`
}

function paragraphPanel({ compact = false, connect = false } = {}) {
  const sentences = missions.map((mission, index) => state.completed[index] || mission.sample)
  return `<section class="paragraph-panel ${compact ? 'paragraph-panel--compact' : ''}" aria-label="Our paragraph">
    <div class="paragraph-heading">
      <div><span class="eyebrow">Our paragraph</span><strong>${connect ? 'Connect the ideas' : `${state.completed.length} sentence${state.completed.length === 1 ? '' : 's'} locked in`}</strong></div>
      <span class="page-tab">DRAFT 01</span>
    </div>
    <ol class="paragraph-lines">
      ${sentences.map((sentence, index) => {
        const slot = connect ? linkSlots.find((item) => item.before === index) : null
        const placedId = slot ? state.placements[index] : ''
        const placedToken = placedId ? tokenById(placedId) : null
        const placed = placedToken?.label || ''
        const isInvalid = state.invalidSlots.includes(index)
        const showLine = connect || index < state.completed.length
        const isNext = index === state.completed.length && !connect
        const isHidden = !connect && index > state.completed.length
        const isLatest = !connect && index === state.completed.length - 1
        return `<li class="${showLine ? 'is-complete' : ''} ${isNext ? 'is-next' : ''} ${isHidden ? 'is-hidden' : ''} ${isLatest ? 'is-latest' : ''}">
          <span class="line-number">${String(index + 1).padStart(2, '0')}</span>
          <div class="sentence-line">
            ${slot ? `<button class="link-slot ${placed ? 'is-filled' : ''} ${isInvalid ? 'is-incorrect' : ''}" data-slot="${index}" ${placedId ? `data-placed-token="${placedId}" draggable="true"` : ''} aria-label="Linking word before sentence ${index + 1}">${placed || 'linking word'}</button>` : ''}
            <span>${showLine ? sentence : 'Your next sentence will land here...'}</span>
          </div>
          ${showLine && !connect ? '<span class="lock-mark">LOCKED</span>' : ''}
        </li>`
      }).join('')}
    </ol>
  </section>`
}

function missionView() {
  const index = state.completed.length
  const mission = missions[index]
  if (!mission) return boxView()
  const timerClass = state.timer <= 10 ? 'is-low' : ''

  return `<main class="mission-layout">
    <aside class="guide-panel">
      <div class="guide-name"><span class="status-dot"></span> CLIPPY ONLINE</div>
      ${clippy(mission.timed ? 'challenge' : 'thinking')}
      <div class="speech-bubble">
        <span class="speech-kicker">MISSION ${String(index + 1).padStart(2, '0')}</span>
        <p>${mission.prompt}</p>
      </div>
      <p class="guide-tip">Say ideas aloud. The teacher types the class answer.</p>
    </aside>

    <section class="workbench">
      <div class="mission-meta">
        <span class="mission-count">Sentence ${index + 1} <i>/ 10</i></span>
        <span class="category-tag category-tag--${mission.category.toLowerCase()}">${mission.category}</span>
      </div>
      <div class="idea-note">
        <span class="pin"></span>
        <span class="eyebrow">Your idea</span>
        <div class="idea-flow"><strong>${mission.idea[0]}</strong><span class="idea-arrow">${mission.direction === 'backward' ? '←' : '→'}</span><strong>${mission.idea[1]}</strong></div>
      </div>

      <div class="factory-section">
        <div class="section-title"><span>Sentence factory</span><small>Choose the right Word pattern</small></div>
        <div class="word-cards word-cards--patterns">
          <span class="factory-pattern">Cause–Effect</span>
          <span class="factory-pattern">Advantages–Disadvantages</span>
        </div>
      </div>

      ${mission.timed ? `<div class="timer-strip ${timerClass}">
        <span>${icons.clock}</span><strong id="timer-value">${state.timer}</strong><small>seconds</small>
        <button class="mini-button" data-action="timer">${state.timerRunning ? 'Pause' : state.timer < 60 ? 'Resume' : 'Start challenge'}</button>
      </div>` : ''}

      <div class="answer-section">
        <label for="sentence-input"><span>Teacher types the class's answer</span><small>One complete sentence</small></label>
        <textarea id="sentence-input" rows="2" placeholder="Start typing here..." maxlength="220"></textarea>
        <div class="answer-actions">
          <div class="hint-wrap">
            <button class="hint-button" data-action="hint">${icons.bulb} ${state.hintVisible ? 'Hide pattern' : 'Reveal a pattern'}</button>
            ${state.hintVisible ? `<span class="pattern-chip"><i>Useful pattern</i>${mission.pattern}</span>` : ''}
          </div>
          <button class="sample-button" data-action="sample">Use sample answer</button>
          <button class="lock-button" data-action="lock" ${state.locking ? 'disabled' : ''}>${icons.lock} ${state.locking ? 'LOCKING...' : 'LOCK IT IN'}</button>
        </div>
        <p id="input-feedback" class="input-feedback" role="status"></p>
      </div>
    </section>
    ${paragraphPanel({ compact: true })}
  </main>`
}

function welcomeView() {
  return `<main class="welcome-screen">
    <div class="welcome-copy">
      <span class="mission-label">DOL CLASS MISSION · WRITING</span>
      <h1>One idea.<br><em>One strong sentence.</em></h1>
      <p>Each time, you will see an idea. Use the right Word patterns to write a full sentence from that idea. Got it?</p>
      <div class="welcome-actions">
        <button class="start-button" data-action="start">LET'S BUILD ${icons.play}</button>
        <span>10 sentences · 1 secret round</span>
      </div>
    </div>
    <div class="welcome-clippy">
      <div class="hello-bubble">Hi! My name is Clippy!<br><strong>I’m here to help you write a paragraph!</strong></div>
      ${clippy('hello')}
      <div class="desk-shadow"></div>
    </div>
    <div class="mission-route" aria-label="Mission route">
      <span class="is-current">01</span><i></i><span>05</span><i></i><span>10</span><i></i><span class="route-box">SECRET BOX</span>
    </div>
  </main>`
}

function boxView() {
  return `<main class="box-stage">
    <div class="box-copy">
      <span class="eyebrow">Paragraph complete?</span>
      <h1>Wait a second…</h1>
      <p>Our sentences are ready. There is just one thing left before they become a complete paragraph.</p>
      <div class="box-dialogue">Wait! I forgot one thing. Open this box.</div>
    </div>
    <div class="box-clippy">${clippy('surprised')}</div>
    <button class="secret-box" data-action="open-box" aria-label="Open Clippy's secret box">
      <span class="box-lid"><i></i></span>
      <span class="box-base"><strong>CLIPPY'S</strong><small>SECRET WORD BOX</small></span>
      <span class="click-label">CLICK TO OPEN</span>
    </button>
    <div class="box-preview">${paragraphPanel({ compact: true })}</div>
  </main>`
}

function connectView() {
  const placedIds = Object.values(state.placements)
  const available = state.tokenOrder.filter((token) => !placedIds.includes(token.id))
  const done = Object.keys(state.placements).length === linkSlots.length

  return `<main class="connect-stage ${done ? 'is-done' : ''}">
    <section class="connect-header">
      <div>
        <span class="eyebrow">Mini boss round</span>
        <h1>Connect the paragraph</h1>
        <p>Let’s use these words to connect your sentences and form a complete essay!</p>
      </div>
      <div class="connect-guide">${clippy(done ? 'happy' : 'thinking')}<p>${done ? 'Every idea clicks!' : 'Think: add, order, or contrast?'}</p></div>
    </section>
    <div class="connect-workspace">
      ${paragraphPanel({ connect: true })}
      <aside class="word-box">
        <div class="word-box__top"><span>Clippy's word box</span><b>${available.length} left</b></div>
        <div class="link-tokens" data-return-zone aria-label="Available linking words">
          ${available.map((token) => `<button draggable="true" class="link-token ${state.selectedToken === token.id ? 'is-selected' : ''}" data-token="${token.id}" aria-pressed="${state.selectedToken === token.id}"><span class="grip">⠿</span>${token.label}</button>`).join('')}
        </div>
        <div class="connection-key">
          <span><i class="key-dot key-dot--blue"></i>order benefits</span>
          <span><i class="key-dot key-dot--red"></i>show contrast</span>
          <span><i class="key-dot key-dot--amber"></i>order disadvantages</span>
        </div>
        <p class="connect-feedback ${state.feedbackKind}" role="status">${state.feedback || 'Arrange all five words freely, then check your paragraph.'}</p>
        ${done && !state.linksChecked ? `<button class="check-links-button" data-action="check-links">CHECK CONNECTIONS</button>` : ''}
        ${state.linksChecked ? `<button class="finish-button" data-action="finish">READ OUR PARAGRAPH ${icons.play}</button>` : ''}
      </aside>
    </div>
  </main>`
}

function completeView() {
  const linkedSentences = state.completed.map((sentence, index) => {
    const linker = tokenById(state.placements[index])?.label
    return `${linker ? `<strong>${linker}</strong> ` : ''}${sentence}`
  }).join(' ')
  return `<main class="final-stage">
    <div class="final-rays"></div>
    <section class="final-card">
      <div class="final-clippy">${clippy('happy')}</div>
      <span class="eyebrow">Mission accomplished</span>
      <h1>That sounds like a paragraph.</h1>
      <p class="final-paragraph">${linkedSentences}</p>
      <div class="final-footer">
        <div><span>10</span><small>sentences</small></div><i></i><div><span>5</span><small>connections</small></div>
        <button class="start-button" data-action="reset-now">PLAY AGAIN ${icons.reset}</button>
      </div>
    </section>
  </main>`
}

function render() {
  const views = {
    welcome: welcomeView,
    mission: missionView,
    box: boxView,
    connect: connectView,
    complete: completeView,
  }
  app.innerHTML = `<div class="game-shell">${topbar()}${views[state.phase]()}</div>`
  bindEvents()
}

function bindEvents() {
  app.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => handleAction(button.dataset.action))
  })

  app.querySelectorAll('[data-token]').forEach((token) => {
    token.addEventListener('click', () => {
      state.selectedToken = state.selectedToken === token.dataset.token ? null : token.dataset.token
      const selected = tokenById(state.selectedToken)
      state.feedback = selected ? `“${selected.label}” selected. Now choose a slot.` : ''
      state.feedbackKind = ''
      render()
    })
    token.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', token.dataset.token)
      event.dataTransfer.effectAllowed = 'move'
    })
  })

  app.querySelectorAll('[data-slot]').forEach((slot) => {
    slot.addEventListener('click', () => {
      const before = Number(slot.dataset.slot)
      const placedToken = slot.dataset.placedToken
      if (state.selectedToken) {
        if (state.selectedToken === placedToken) {
          delete state.placements[before]
          state.selectedToken = null
          state.linksChecked = false
          state.invalidSlots = []
          state.feedback = 'Word returned to the box.'
          render()
        } else {
          placeToken(before, state.selectedToken)
        }
      } else if (placedToken) {
        state.selectedToken = placedToken
        state.feedback = `“${tokenById(placedToken).label}” selected. Choose another slot to move or swap it.`
        state.feedbackKind = ''
        render()
      }
    })
    slot.addEventListener('dragstart', (event) => {
      if (!slot.dataset.placedToken) return
      event.dataTransfer.setData('text/plain', slot.dataset.placedToken)
      event.dataTransfer.effectAllowed = 'move'
    })
    slot.addEventListener('dragover', (event) => {
      event.preventDefault()
      slot.classList.add('is-over')
    })
    slot.addEventListener('dragleave', () => slot.classList.remove('is-over'))
    slot.addEventListener('drop', (event) => {
      event.preventDefault()
      placeToken(Number(slot.dataset.slot), event.dataTransfer.getData('text/plain'))
    })
  })

  const returnZone = app.querySelector('[data-return-zone]')
  if (returnZone) {
    returnZone.addEventListener('dragover', (event) => {
      event.preventDefault()
      returnZone.classList.add('is-over')
    })
    returnZone.addEventListener('dragleave', () => returnZone.classList.remove('is-over'))
    returnZone.addEventListener('drop', (event) => {
      event.preventDefault()
      const tokenId = event.dataTransfer.getData('text/plain')
      const sourceEntry = Object.entries(state.placements).find(([, placedId]) => placedId === tokenId)
      if (!sourceEntry) return
      delete state.placements[sourceEntry[0]]
      state.selectedToken = null
      state.linksChecked = false
      state.invalidSlots = []
      state.feedback = 'Word returned to the box. Keep arranging freely.'
      state.feedbackKind = ''
      render()
    })
  }
}

function handleAction(action) {
  if (action === 'start') {
    state.phase = 'mission'
    render()
    requestAnimationFrame(() => document.querySelector('#sentence-input')?.focus())
  }
  if (action === 'mute') {
    state.muted = !state.muted
    render()
  }
  if (action === 'hint') {
    state.hintVisible = !state.hintVisible
    render()
  }
  if (action === 'sample') {
    const input = document.querySelector('#sentence-input')
    input.value = missions[state.completed.length].sample
    input.focus()
  }
  if (action === 'lock') lockSentence()
  if (action === 'timer') toggleTimer()
  if (action === 'check-links') checkLinks()
  if (action === 'open-box') {
    state.phase = 'connect'
    state.feedback = 'The words are loose! Build the logical path.'
    playSound('victory')
    render()
  }
  if (action === 'finish') {
    state.phase = 'complete'
    playSound('victory')
    render()
  }
  if (action === 'reset' && window.confirm('Reset this classroom mission and clear the paragraph?')) resetGame()
  if (action === 'reset-now') resetGame()
}

function lockSentence() {
  const input = document.querySelector('#sentence-input')
  const feedback = document.querySelector('#input-feedback')
  const sentence = input.value.trim()
  if (sentence.length < 8 || !/[a-z]/i.test(sentence)) {
    feedback.textContent = 'Clippy needs a complete sentence before it can be locked.'
    feedback.className = 'input-feedback is-error'
    input.focus()
    playSound('wrong')
    return
  }
  const finalSentence = /[.!?]$/.test(sentence) ? sentence : `${sentence}.`
  state.locking = true
  stopTimer()
  const rect = input.getBoundingClientRect()
  const flyer = document.createElement('div')
  flyer.className = 'sentence-flyer'
  flyer.textContent = finalSentence
  flyer.style.left = `${rect.left}px`
  flyer.style.top = `${rect.top}px`
  flyer.style.width = `${rect.width}px`
  document.body.appendChild(flyer)
  requestAnimationFrame(() => flyer.classList.add('is-flying'))
  playSound('correct')

  window.setTimeout(() => {
    state.completed.push(finalSentence)
    state.hintVisible = false
    state.timer = 60
    state.locking = false
    flyer.remove()
    state.phase = state.completed.length === missions.length ? 'box' : 'mission'
    render()
    requestAnimationFrame(() => document.querySelector('#sentence-input')?.focus())
  }, 680)
}

function toggleTimer() {
  if (state.timerRunning) {
    stopTimer()
    render()
    return
  }
  if (state.timer <= 0) state.timer = 60
  state.timerRunning = true
  state.timerId = window.setInterval(() => {
    state.timer -= 1
    const value = document.querySelector('#timer-value')
    if (value) value.textContent = state.timer
    if (state.timer <= 10) document.querySelector('.timer-strip')?.classList.add('is-low')
    if (state.timer <= 0) {
      stopTimer()
      state.feedback = "Time's up — Clippy needs backup. Class?"
      render()
    }
  }, 1000)
  render()
}

function stopTimer() {
  window.clearInterval(state.timerId)
  state.timerId = null
  state.timerRunning = false
}

function placeToken(before, tokenId) {
  if (!linkSlots.some((slot) => slot.before === before) || !tokenById(tokenId)) return
  const sourceEntry = Object.entries(state.placements).find(([, placedId]) => placedId === tokenId)
  const sourceBefore = sourceEntry ? Number(sourceEntry[0]) : null
  const displacedToken = state.placements[before]

  if (sourceBefore !== null) delete state.placements[sourceBefore]
  state.placements[before] = tokenId
  if (displacedToken && sourceBefore !== null) state.placements[sourceBefore] = displacedToken

  state.selectedToken = null
  state.linksChecked = false
  state.invalidSlots = []
  state.feedback = displacedToken ? 'Words swapped. Keep arranging, then check all connections.' : 'Word placed. You can still move or swap it.'
  state.feedbackKind = ''
  render()
}

function checkLinks() {
  const invalid = linkSlots.filter((slot) => {
    const label = tokenById(state.placements[slot.before])?.label
    return !isValidLinkLabel(slot.before, label)
  }).map((slot) => slot.before)

  state.invalidSlots = invalid
  if (invalid.length === 0) {
    state.linksChecked = true
    state.feedback = 'All connections work! Second and Besides can switch places here.'
    state.feedbackKind = 'is-success'
    playSound('correct')
  } else {
    state.linksChecked = false
    state.feedback = `${invalid.length} connection${invalid.length === 1 ? '' : 's'} need another look. You can move or swap any word.`
    state.feedbackKind = 'is-gentle'
    playSound('wrong')
  }
  render()
}

function resetGame() {
  stopTimer()
  Object.assign(state, {
    phase: 'welcome', completed: [], hintVisible: false, timer: 60,
    selectedToken: null, placements: {}, feedback: '', feedbackKind: '', locking: false,
    tokenOrder: shuffledTokens(),
    linksChecked: false, invalidSlots: [],
  })
  render()
}

render()
