const BASE_URL = ""

// ===== UTILITY: HTML Escape =====
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = "error") {
  const container = document.getElementById("toast-container")
  if (!container) return

  const toast = document.createElement("div")
  toast.className = `toast toast-${type}`

  const icons = { error: "❌", success: "✅", info: "ℹ️", warning: "⚠️" }
  toast.innerHTML = `<span class="toast-icon">${icons[type] || ""}</span><span class="toast-msg">${escapeHtml(message)}</span>`

  container.appendChild(toast)

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add("toast-show"))

  setTimeout(() => {
    toast.classList.remove("toast-show")
    toast.addEventListener("transitionend", () => toast.remove())
  }, 3500)
}

// ===== AUTH GUARD =====
function checkAuth() {
  const userId = localStorage.getItem("userId")
  const path = window.location.pathname

  if (path.includes("login.html") || path.includes("signup.html")) return

  if (!userId) {
    const isInPages = path.includes("/pages/")
    window.location.href = isInPages ? "signup.html" : "./pages/signup.html"
  }
}

checkAuth()

// ===== NAVBAR =====
function renderNavbar() {
  const nav = document.getElementById("navbar")
  if (!nav) return

  const userId = localStorage.getItem("userId")
  const userName = localStorage.getItem("userName")
  const isInPages = window.location.pathname.includes("/pages/")
  const homePath = isInPages ? "../index.html" : "index.html"
  const loginPath = isInPages ? "login.html" : "./pages/login.html"
  const signupPath = isInPages ? "signup.html" : "./pages/signup.html"

  if (userId) {
    nav.innerHTML = `
      <a class="nav-brand" href="${homePath}">📚 MCQ App</a>
      <div class="nav-actions">
        <span class="nav-user">👤 ${escapeHtml(userName || "User")}</span>
        <button class="btn-nav btn-nav-logout" onclick="logout()">Logout</button>
      </div>
    `
  } else {
    nav.innerHTML = `
      <a class="nav-brand" href="${homePath}">📚 MCQ App</a>
      <div class="nav-actions">
        <a class="btn-nav btn-nav-login" href="${loginPath}">Login</a>
        <a class="btn-nav btn-nav-signup" href="${signupPath}">Sign Up</a>
      </div>
    `
  }
}

function logout() {
  localStorage.removeItem("userId")
  localStorage.removeItem("userName")
  localStorage.removeItem("chapterId")
  localStorage.removeItem("result")

  const isInPages = window.location.pathname.includes("/pages/")
  window.location.href = isInPages ? "login.html" : "./pages/login.html"
}

renderNavbar()

// ===== AUTH =====
async function handleLogin(event) {
  event.preventDefault()

  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value
  const btn = document.getElementById("login-btn")

  if (!email || !password) {
    showToast("Please fill in all fields", "warning")
    return
  }

  btn.disabled = true
  btn.textContent = "Logging in..."

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      showToast(data.error || "Login failed", "error")
      btn.disabled = false
      btn.textContent = "Login"
      return
    }

    localStorage.setItem("userId", data._id)
    localStorage.setItem("userName", data.name || "User")
    showToast("Login successful!", "success")
    setTimeout(() => (window.location.href = "../index.html"), 500)
  } catch (err) {
    showToast("Network error. Please try again.", "error")
    btn.disabled = false
    btn.textContent = "Login"
  }
}

async function handleSignup(event) {
  event.preventDefault()

  const name = document.getElementById("name").value.trim()
  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value
  const btn = document.getElementById("signup-btn")

  if (!name || !email || !password) {
    showToast("Please fill in all fields", "warning")
    return
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "warning")
    return
  }

  btn.disabled = true
  btn.textContent = "Signing up..."

  try {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      showToast(data.error || "Signup failed", "error")
      btn.disabled = false
      btn.textContent = "Sign Up"
      return
    }

    localStorage.setItem("userId", data._id)
    localStorage.setItem("userName", data.name || name)
    showToast("Account created!", "success")
    setTimeout(() => (window.location.href = "../index.html"), 500)
  } catch (err) {
    showToast("Network error. Please try again.", "error")
    btn.disabled = false
    btn.textContent = "Sign Up"
  }
}

// ===== CHAPTERS =====
async function loadChapters() {
  const container = document.getElementById("chapters")
  if (!container) return

  try {
    const res = await fetch(`${BASE_URL}/chapters`)
    const data = await res.json()

    // Remove loader
    const loader = document.getElementById("chapters-loader")
    if (loader) loader.remove()

    if (!data.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>📭 No chapters available yet.</p>
          <p class="empty-sub">Check back later!</p>
        </div>
      `
      return
    }

    data.forEach(ch => {
      const div = document.createElement("div")
      div.className = "chapter-card"
      div.innerHTML = `
        <div class="chapter-info">
          <h3>${escapeHtml(ch.title)}</h3>
          ${ch.description ? `<p class="chapter-desc">${escapeHtml(ch.description)}</p>` : ""}
          <span class="chapter-meta">${ch.mcqs ? ch.mcqs.length : 0} questions</span>
        </div>
        <button class="btn btn-primary" onclick="startQuiz('${ch._id}')">Start Quiz</button>
      `
      container.appendChild(div)
    })
  } catch (err) {
    const loader = document.getElementById("chapters-loader")
    if (loader) loader.remove()

    container.innerHTML = `
      <div class="empty-state">
        <p>😟 Failed to load chapters.</p>
        <button class="btn btn-secondary" onclick="location.reload()">🔄 Retry</button>
      </div>
    `
  }
}

function startQuiz(chapterId) {
  localStorage.setItem("chapterId", chapterId)
  window.location.href = "./pages/quiz.html"
}

if (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/")) {
  loadChapters()
}

// ===== QUIZ =====
let answers = []
let quizMcqs = []

function updateProgress() {
  const countEl = document.getElementById("progress-count")
  const barEl = document.getElementById("progress-bar")
  const totalEl = document.getElementById("progress-total")

  if (!countEl || !barEl || !totalEl) return

  const total = quizMcqs.length
  const answered = answers.length
  countEl.textContent = answered
  totalEl.textContent = total
  barEl.style.width = total > 0 ? `${(answered / total) * 100}%` : "0%"
}

async function loadQuiz() {
  const chapterId = localStorage.getItem("chapterId")
  const container = document.getElementById("quiz")
  const progressEl = document.getElementById("quiz-progress")

  if (!chapterId) {
    showToast("No chapter selected. Redirecting...", "warning")
    setTimeout(() => (window.location.href = "../index.html"), 1000)
    return
  }

  try {
    const res = await fetch(`${BASE_URL}/quiz/${chapterId}`)

    if (!res.ok) {
      throw new Error("Failed to fetch quiz")
    }

    const data = await res.json()
    quizMcqs = data

    // Remove loader
    const loader = document.getElementById("quiz-loader")
    if (loader) loader.remove()

    // Show progress and submit
    if (progressEl) progressEl.style.display = "block"
    const submitBar = document.getElementById("submit-bar")
    if (submitBar) submitBar.style.display = "block"

    updateProgress()

    if (!data.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>📭 No questions in this chapter yet.</p>
          <button class="btn btn-secondary" onclick="window.location.href='../index.html'">🏠 Back to Chapters</button>
        </div>
      `
      if (submitBar) submitBar.style.display = "none"
      return
    }

    data.forEach((q, index) => {
      const div = document.createElement("div")
      div.className = "question-card"
      div.id = `question-${index}`

      div.innerHTML = `
        <p class="question-number">Question ${index + 1} of ${data.length}</p>
        <p class="question-text">${escapeHtml(q.question)}</p>
        ${q.options.map((opt, i) => `
          <label class="option-label" id="q${index}-opt${i}">
            <input type="radio" name="q${index}"
              onclick="selectAnswer(${index}, '${q._id}', ${i}, ${q.correctOption})">
            ${escapeHtml(opt)}
          </label>
        `).join("")}
      `

      container.appendChild(div)
    })
  } catch (err) {
    const loader = document.getElementById("quiz-loader")
    if (loader) loader.remove()

    container.innerHTML = `
      <div class="empty-state">
        <p>😟 Failed to load quiz.</p>
        <button class="btn btn-secondary" onclick="location.reload()">🔄 Retry</button>
      </div>
    `
  }
}

function selectAnswer(questionIndex, questionId, selectedOption, correctOption) {
  const existing = answers.find(a => a.questionId === questionId)
  if (existing) return // Already answered — one chance

  answers.push({ questionId, selectedOption })

  const questionCard = document.getElementById(`question-${questionIndex}`)
  const labels = questionCard.querySelectorAll(".option-label")

  labels.forEach(label => {
    label.classList.add("disabled")
    const radio = label.querySelector("input[type='radio']")
    if (radio) radio.disabled = true
  })

  const correctLabel = document.getElementById(`q${questionIndex}-opt${correctOption}`)
  if (correctLabel) correctLabel.classList.add("correct")

  if (selectedOption !== correctOption) {
    const wrongLabel = document.getElementById(`q${questionIndex}-opt${selectedOption}`)
    if (wrongLabel) wrongLabel.classList.add("wrong")
  }

  updateProgress()
}

if (window.location.pathname.includes("quiz.html")) {
  loadQuiz()
}

// ===== SUBMIT =====
async function submitTest() {
  const userId = localStorage.getItem("userId")
  const chapterId = localStorage.getItem("chapterId")
  const btn = document.getElementById("submit-btn")

  if (answers.length === 0) {
    showToast("Answer at least one question before submitting", "warning")
    return
  }

  btn.disabled = true
  btn.textContent = "Submitting..."

  try {
    const res = await fetch(`${BASE_URL}/submit-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userId,
        chapter: chapterId,
        answers: answers
      })
    })

    const data = await res.json()

    if (!res.ok) {
      showToast(data.error || "Failed to submit test", "error")
      btn.disabled = false
      btn.textContent = "Submit Test"
      return
    }

    localStorage.setItem("result", JSON.stringify(data))
    window.location.href = "result.html"
  } catch (err) {
    showToast("Network error. Please try again.", "error")
    btn.disabled = false
    btn.textContent = "Submit Test"
  }
}

// ===== RESULT =====
function loadResult() {
  const raw = localStorage.getItem("result")
  const div = document.getElementById("result")

  if (!raw || !div) {
    showToast("No result data found. Redirecting...", "warning")
    setTimeout(() => (window.location.href = "../index.html"), 1000)
    return
  }

  const data = JSON.parse(raw)

  // Determine color for score
  let scoreClass = "score-stat"
  if (data.score >= 80) scoreClass += " score-great"
  else if (data.score >= 50) scoreClass += " score-okay"
  else scoreClass += " score-low"

  div.innerHTML = `
    <div class="result-stats">
      <div class="stat-box correct-stat">
        <div class="stat-value">${data.correct}</div>
        <div class="stat-label">Correct</div>
      </div>
      <div class="stat-box wrong-stat">
        <div class="stat-value">${data.wrong}</div>
        <div class="stat-label">Wrong</div>
      </div>
      <div class="stat-box ${scoreClass}">
        <div class="stat-value">${data.score}%</div>
        <div class="stat-label">Score</div>
      </div>
    </div>
    <div class="result-summary">
      <p>Attempted: <strong>${data.attempted}</strong> of <strong>${data.totalQuestions}</strong> questions</p>
    </div>
    <div class="result-actions">
      <button class="btn btn-primary" onclick="retakeTest()">🔄 Retake Test</button>
      <button class="btn btn-secondary" onclick="goHome()">🏠 Home</button>
    </div>
  `
}

function retakeTest() {
  localStorage.removeItem("result")
  window.location.href = "quiz.html"
}

function goHome() {
  localStorage.removeItem("result")
  window.location.href = "../index.html"
}

if (window.location.pathname.includes("result.html")) {
  loadResult()
}
