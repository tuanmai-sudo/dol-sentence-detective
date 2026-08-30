import './styles.css'
import logoUrl from '../assets/brand/dol-logo.png'
import correctUrl from '../assets/audio/sfx/correct-chime.mp3'
import wrongUrl from '../assets/audio/sfx/wrong-soft.mp3'
import victoryUrl from '../assets/audio/sfx/victory-fanfare.mp3'
import astronautUrl from './assets/astronaut-guide.png'
import { calculateAccuracy, challenges, countComponents, getPerformance } from './game-data.js'
import { createLMSBridge } from './lms-bridge.js'

const app = document.querySelector('#app')
const lms = createLMSBridge('dol-sentence-detective-b1')
const completionKey = `dol-sentence-detective:${lms.storageScope}:completed:v1`
const sounds = {
  correct: new Audio(correctUrl),
  wrong: new Audio(wrongUrl),
  victory: new Audio(victoryUrl),
}
Object.values(sounds).forEach((sound) => { sound.volume = 0.4 })

const icons = {
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.5 3a4 4 0 0 0-2-3.46v6.92A4 4 0 0 0 16.5 12Z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm11.5 1 2 2-2 2 1.5 1.5 2-2 2 2 1.5-1.5-2-2 2-2L21 8.5l-2 2-2-2L15.5 10Z"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.35 9.95l2.05-.76A4.8 4.8 0 1 0 8.2 8.1L11 11H3V3l2.63 2.63A6.96 6.96 0 0 1 12 5Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.2 16.2-4.4-4.4-1.6 1.6 6 6L21 7.6 19.4 6Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13.2 5.3-1.4 1.4 4.3 4.3H4v2h12.1l-4.3 4.3 1.4 1.4 6.7-6.7Z"/></svg>',
}

function initialState() {
  return {
    phase: 'welcome',
    questionIndex: 0,
    stepIndex: 0,
    selected: null,
    mistakes: challenges.map(() => 0),
    answers: challenges.map(() => []),
    feedback: '',
    feedbackKind: '',
    muted: false,
    completionEmitted: false,
  }
}

function restoredState() {
  try { const saved = JSON.parse(localStorage.getItem(completionKey) || 'null'); return saved?.phase === 'results' ? { ...initialState(), ...saved, completionEmitted: true } : null } catch { return null }
}
let state = restoredState() || initialState()

function playSound(name) {
  if (state.muted) return
  const sound = sounds[name]
  sound.currentTime = 0
  sound.play().catch(() => {})
}

function segmentText(challenge, id) {
  return challenge.segments.find((segment) => segment.id === id)?.text || ''
}

function totalMistakes() {
  return state.mistakes.reduce((sum, value) => sum + value, 0)
}

function completedComponents() {
  const before = challenges.slice(0, state.questionIndex).reduce((sum, challenge) => sum + challenge.steps.length, 0)
  return before + (state.phase === 'play' ? state.stepIndex : state.phase === 'results' ? challenges[state.questionIndex]?.steps.length || 0 : 0)
}

function topbar() {
  const done = state.phase === 'results' ? countComponents() : completedComponents()
  const percent = Math.round((done / countComponents()) * 100)
  return `<header class="topbar">
    <div class="brand">
      <img src="${logoUrl}" alt="DOL English" />
      <span class="brand__line"></span>
      <div><strong>Sentence Detective</strong><small>Giải mã cấu trúc câu</small></div>
    </div>
    ${state.phase !== 'welcome' ? `<div class="topbar__progress" aria-label="Tiến độ ${percent}%"><span><i style="width:${percent}%"></i></span><b>${percent}%</b></div>` : ''}
    <div class="topbar__tools">
      <button class="icon-button" data-action="mute" aria-label="${state.muted ? 'Bật âm thanh' : 'Tắt âm thanh'}" title="${state.muted ? 'Bật âm thanh' : 'Tắt âm thanh'}">${state.muted ? icons.mute : icons.sound}</button>
      ${state.phase === 'play' ? `<button class="icon-button" data-action="reset" aria-label="Làm lại lượt hiện tại" title="Làm lại lượt hiện tại">${icons.reset}</button>` : ''}
    </div>
  </header>`
}

function welcomeView() {
  return `<main class="welcome">
    <section class="welcome__copy">
      <span class="eyebrow">DOL GRAMMAR MISSION · B1</span>
      <h1>Nhìn từng mảnh.<br><em>Hiểu cả câu.</em></h1>
      <p>Chọn phần câu phù hợp với từng thành phần ngữ pháp. Câu càng dài, bạn càng cần quan sát thật kỹ!</p>
      <div class="how-to">
        <div><b>1</b><span><strong>Nhìn thành phần sáng xanh</strong><small>Đó là phần bạn cần tìm.</small></span></div>
        <div><b>2</b><span><strong>Chọn một section rồi kiểm tra</strong><small>Nếu chưa đúng, hãy thử lại.</small></span></div>
      </div>
      <button class="primary-button" data-action="start">BẮT ĐẦU THỬ THÁCH ${icons.arrow}</button>
    </section>
    <aside class="welcome__guide">
      <div class="guide-bubble"><span>Xin chào!</span><strong>Mình sẽ giúp bạn tìm manh mối trong từng câu.</strong></div>
      <img src="${astronautUrl}" alt="Phi hành gia hướng dẫn DOL" />
      <div class="guide-shadow"></div>
    </aside>
  </main>`
}

function resolvedStructureText(step, answer) {
  const prefixes = [
    ['For +', 'For '], ['To +', 'To '], ['Because of +', 'Because of '],
    ['Although +', 'Although '], ['If +', 'If '], ['due to +', 'due to '],
    ['because +', 'because '], ['by +', 'by '], ['in +', 'in '],
    ['with +', 'with '], ['for +', 'for '],
  ]
  const match = prefixes.find(([label]) => step.label.startsWith(label))
  return `${match?.[1] || ''}${answer}`
}

function structureFormula(challenge) {
  const finished = state.stepIndex >= challenge.steps.length
  const visibleSteps = challenge.steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => finished || step.revealAt === undefined || state.stepIndex >= step.revealAt)

  return `<div class="structure-formula" role="heading" aria-level="1" aria-label="Cấu trúc: ${challenge.structure}">
    ${visibleSteps.map(({ step, index }, visibleIndex) => {
      const done = index < state.stepIndex
      const active = index === state.stepIndex
      const revealed = step.revealAt !== undefined && state.stepIndex === step.revealAt
      const answer = done ? segmentText(challenge, step.answer) : ''
      const text = done ? resolvedStructureText(step, answer) : step.label
      const join = visibleIndex === 0 ? '' : (step.joinBefore || '+')
      return `${join ? `<span class="formula-join ${revealed ? 'is-revealed' : ''}">${join}</span>` : ''}<span class="formula-part ${done ? 'is-done' : ''} ${active ? 'is-active' : ''} ${revealed ? 'is-revealed' : ''}">${text}</span>`
    }).join('')}
  </div>`
}

function sentenceBoard(challenge) {
  const locked = new Set(state.answers[state.questionIndex])
  return `<div class="sentence-board" aria-label="Câu tiếng Anh cần phân tích">
    ${challenge.segments.map((segment) => {
      const suffix = segment.suffix || ''
      if (segment.context) return `<span class="context-word">${segment.text}${suffix}</span>`
      const isLocked = locked.has(segment.id)
      const isSelected = state.selected === segment.id
      return `<button class="sentence-piece ${isLocked ? 'is-locked' : ''} ${isSelected ? 'is-selected' : ''}" data-segment="${segment.id}" ${isLocked ? 'disabled' : ''} aria-pressed="${isSelected}">${segment.text}${suffix}</button>`
    }).join(' ')}
  </div>`
}

function playView() {
  const challenge = challenges[state.questionIndex]
  const finished = state.stepIndex >= challenge.steps.length
  const currentStep = finished ? null : challenge.steps[state.stepIndex]
  return `<main class="play-layout">
    <section class="play-card">
      <div class="question-head">
        <span class="eyebrow">CÂU ${String(state.questionIndex + 1).padStart(2, '0')} / 10 · CẤU TRÚC TỔNG</span>
        <span class="attempt-badge"><b>${state.mistakes[state.questionIndex]}</b> lần thử lại</span>
        ${structureFormula(challenge)}
      </div>
      <div class="task-prompt">
        <p>${finished ? '<strong>Bạn đã giải mã cả câu!</strong> Các thành phần đúng đã được điền vào cấu trúc.' : `Chọn phần câu phù hợp với <strong>${currentStep.label}</strong>.`}</p>
      </div>
      ${sentenceBoard(challenge)}
      <div class="feedback ${state.feedbackKind}" role="status" aria-live="polite">
        <span class="feedback__icon">${state.feedbackKind === 'success' ? icons.check : state.feedbackKind === 'error' ? '!' : '?'}</span>
        <p>${state.feedback || (finished ? 'Tuyệt lắm! Hãy chuyển sang câu tiếp theo.' : 'Nhấn vào một phần câu, sau đó chọn “Kiểm tra”.')}</p>
      </div>
      <div class="play-actions">
        ${finished
          ? `<button class="primary-button" data-action="next">${state.questionIndex === challenges.length - 1 ? 'XEM KẾT QUẢ' : 'CÂU TIẾP THEO'} ${icons.arrow}</button>`
          : `<button class="check-button" data-action="check" ${state.selected ? '' : 'disabled'}>${icons.check} KIỂM TRA</button>`}
      </div>
    </section>
    <aside class="mission-panel">
      <span class="mission-panel__label">NHIỆM VỤ</span>
      <div class="mission-panel__number">${String(state.questionIndex + 1).padStart(2, '0')}</div>
      <p>Chọn đúng từng thành phần theo thứ tự từ trái sang phải.</p>
      <div class="question-dots">${challenges.map((_, index) => `<i class="${index < state.questionIndex ? 'is-done' : ''} ${index === state.questionIndex ? 'is-current' : ''}"></i>`).join('')}</div>
      <img src="${astronautUrl}" alt="" />
    </aside>
  </main>`
}

function buildResults() {
  const total = totalMistakes()
  const correct = countComponents()
  return {
    gameId: 'dol-sentence-detective-b1',
    completedAt: new Date().toISOString(),
    totalIncorrectChecks: total,
    correctComponents: correct,
    accuracy: calculateAccuracy(correct, total),
    performance: getPerformance(total).title,
    sentences: challenges.map((challenge, index) => ({
      number: index + 1,
      id: challenge.id,
      structure: challenge.structure,
      incorrectChecks: state.mistakes[index],
      accuracy: calculateAccuracy(challenge.steps.length, state.mistakes[index]),
    })),
  }
}

function emitCompletion() {
  if (state.completionEmitted) return
  state.completionEmitted = true
  const payload = buildResults()
  window.dispatchEvent(new CustomEvent('dol-game-complete', { detail: payload }))
  lms.complete({
    score: payload.accuracy,
    maxScore: 100,
    correctCount: payload.correctComponents,
    incorrectCount: payload.totalIncorrectChecks,
    answers: payload.sentences,
    details: { performance: payload.performance },
    completedAt: payload.completedAt,
  })
  try { localStorage.setItem(completionKey, JSON.stringify(state)) } catch {}
}

function resultsView() {
  const results = buildResults()
  const performance = getPerformance(results.totalIncorrectChecks)
  return `<main class="results">
    <section class="result-hero result-hero--${performance.tone}">
      <div class="result-rings"></div>
      <span class="eyebrow">HOÀN THÀNH 10 / 10 CÂU</span>
      <h1>${performance.title}</h1>
      <p>${performance.message}</p>
      <div class="result-stats">
        <div><strong>${results.accuracy}%</strong><span>Độ chính xác</span></div>
        <div><strong>${results.totalIncorrectChecks}</strong><span>Lần thử lại</span></div>
        <div><strong>${results.correctComponents}</strong><span>Thành phần đúng</span></div>
      </div>
    </section>
    <section class="result-detail">
      <div class="result-detail__head"><div><span class="eyebrow">CHI TIẾT BÀI LÀM</span><h2>Kết quả từng câu</h2></div><span>Độ chính xác = lựa chọn đúng / tổng số lần kiểm tra</span></div>
      <div class="result-table">
        <div class="result-row result-row--head"><span>Câu</span><span>Cấu trúc</span><span>Thử lại</span><span>Chính xác</span></div>
        ${results.sentences.map((item) => `<div class="result-row"><b>${String(item.number).padStart(2, '0')}</b><span>${item.structure}</span><span>${item.incorrectChecks}</span><strong>${item.accuracy}%</strong></div>`).join('')}
      </div>
      <div class="result-actions"><p>Kết quả đã được gửi về LMS. Muốn làm lượt mới, hãy quay lại dashboard và bấm “Làm lại bài”.</p></div>
    </section>
  </main>`
}

function render() {
  const view = state.phase === 'welcome' ? welcomeView() : state.phase === 'play' ? playView() : resultsView()
  app.innerHTML = `<div class="game-shell">${topbar()}${view}</div>`
  bindEvents()
  if (state.phase === 'play') lms.progress({ resumeState: state })
}

function checkAnswer() {
  const challenge = challenges[state.questionIndex]
  const step = challenge.steps[state.stepIndex]
  if (!state.selected || !step) return
  if (state.selected === step.answer) {
    state.answers[state.questionIndex].push(step.answer)
    state.stepIndex += 1
    state.selected = null
    state.feedback = state.stepIndex === challenge.steps.length
      ? 'Chính xác! Bạn đã hoàn thành toàn bộ câu này.'
      : 'Chính xác! Tiếp tục tìm thành phần kế tiếp nhé.'
    state.feedbackKind = 'success'
    playSound('correct')
  } else {
    state.mistakes[state.questionIndex] += 1
    state.selected = null
    state.feedback = `Không đúng mất rồi, bạn thử lại nha! ${step.hint}`
    state.feedbackKind = 'error'
    playSound('wrong')
  }
  render()
}

function nextQuestion() {
  if (state.questionIndex === challenges.length - 1) {
    state.phase = 'results'
    emitCompletion()
    playSound('victory')
  } else {
    state.questionIndex += 1
    state.stepIndex = 0
    state.selected = null
    state.feedback = ''
    state.feedbackKind = ''
  }
  render()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetGame(startImmediately = false) {
  const muted = state.muted
  state = initialState()
  state.muted = muted
  lms.resetTimer()
  if (startImmediately) state.phase = 'play'
  render()
}

function bindEvents() {
  app.querySelectorAll('[data-segment]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selected = state.selected === button.dataset.segment ? null : button.dataset.segment
      state.feedback = state.selected ? 'Bạn đã chọn một phần câu. Nhấn “Kiểm tra” khi sẵn sàng.' : ''
      state.feedbackKind = ''
      render()
    })
  })
  app.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action
      if (action === 'start') { state.phase = 'play'; render() }
      if (action === 'mute') { state.muted = !state.muted; render() }
      if (action === 'check') checkAnswer()
      if (action === 'next') nextQuestion()
      if (action === 'reset' && window.confirm('Bạn muốn xoá kết quả hiện tại và chơi lại từ đầu?')) resetGame(true)
    })
  })
}

window.DOLSentenceGame = { getResults: buildResults }
window.addEventListener('message', (event) => {
  if (event.source !== window.parent || event.data?.event !== 'DOL_LMS_RESUME') return
  const resumed = event.data.payload?.details?.resumeState
  if (!resumed || resumed.phase !== 'play') return
  state = { ...initialState(), ...resumed, completionEmitted: false }
  render()
})
render()
