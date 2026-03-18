const BASE_URL = ""

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// ===== AUTH GUARD =====

function checkAuth() {
  const userId = localStorage.getItem("userId")
  const path = window.location.pathname

  // Allow login and signup pages without auth
  if (path.includes("login.html") || path.includes("signup.html")) {
    return
  }

  // All other pages require login
  if (!userId) {
    const isInPages = window.location.pathname.includes("/pages/")
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

async function login() {
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!data._id) {
      alert("Invalid email or password")
      return
    }

    localStorage.setItem("userId", data._id)
    localStorage.setItem("userName", data.name || "User")
    window.location.href = "../index.html"
  } catch (err) {
    alert("Login failed. Please try again.")
  }
}

async function signup() {
  const name = document.getElementById("name").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  try {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    })

    const data = await res.json()
    localStorage.setItem("userId", data._id)
    localStorage.setItem("userName", data.name || name)
    window.location.href = "../index.html"
  } catch (err) {
    alert("Signup failed. Please try again.")
  }
}

// ===== CHAPTERS =====

async function loadChapters() {
  try {
    const res = await fetch(`${BASE_URL}/chapters`)
    const data = await res.json()

    const container = document.getElementById("chapters")

    data.forEach(ch => {
      const div = document.createElement("div")
      div.className = "chapter-card"
      div.innerHTML = `
        <h3>${escapeHtml(ch.title)}</h3>
        <button class="btn btn-primary" onclick="startQuiz('${ch._id}')">Start Quiz</button>
      `
      container.appendChild(div)
    })
  } catch (err) {
    console.error("Failed to load chapters:", err)
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

async function loadQuiz() {
  const chapterId = localStorage.getItem("chapterId")

  try {
    const res = await fetch(`${BASE_URL}/quiz/${chapterId}`)
    const data = await res.json()

    quizMcqs = data
    const container = document.getElementById("quiz")

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
    console.error("Failed to load quiz:", err)
  }
}

function selectAnswer(questionIndex, questionId, selectedOption, correctOption) {
  const existing = answers.find(a => a.questionId === questionId)
  if (existing) {
    existing.selectedOption = selectedOption
  } else {
    answers.push({ questionId, selectedOption })
  }

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
}

if (window.location.pathname.includes("quiz.html")) {
  loadQuiz()
}

// ===== SUBMIT =====

async function submitTest() {
  const userId = localStorage.getItem("userId")
  const chapterId = localStorage.getItem("chapterId")

  const totalQuestions = quizMcqs.length
  const attempted = answers.length
  let correct = 0

  answers.forEach(ans => {
    const mcq = quizMcqs.find(q => q._id === ans.questionId)
    if (mcq && mcq.correctOption === ans.selectedOption) {
      correct++
    }
  })

  const wrong = attempted - correct
  const score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0

  try {
    const res = await fetch(`${BASE_URL}/submit-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userId,
        chapter: chapterId,
        totalQuestions,
        attempted,
        correct,
        wrong,
        score
      })
    })

    const data = await res.json()
    localStorage.setItem("result", JSON.stringify(data))
    window.location.href = "result.html"
  } catch (err) {
    alert("Failed to submit test. Please try again.")
  }
}

// ===== RESULT =====

function loadResult() {
  const data = JSON.parse(localStorage.getItem("result"))

  const div = document.getElementById("result")

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
      <div class="stat-box score-stat">
        <div class="stat-value">${data.score}%</div>
        <div class="stat-label">Score</div>
      </div>
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
