let questions = [];
let currentQuestion = 0;
let score = 0;
let userAnswers = [];
let reviewingMistakes = false;
let mistakes = [];
let correctCount = 0;
let incorrectCount = 0;
let answered = false;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function loadQuestions() {
  const res = await fetch("preguntas.json");
  const data = await res.json();
  questions = data.questions;
  shuffle(questions);
  showQuestion();
}

function showProgress() {
  const percent = Math.round(((currentQuestion + 1) / questions.length) * 100);
  return `
    <div class="w-full bg-gray-200 h-2 rounded mb-2">
      <div class="bg-blue-500 h-2 rounded" style="width: ${percent}%;"></div>
    </div>
  `;
}

function showQuestion() {
  answered = false;
  const q = questions[currentQuestion];
  const isMultiple = q.correct.length > 1;
  let html = `
    <div class="mb-2 text-sm text-white flex justify-between">
      <span>Pregunta ${currentQuestion + 1} de ${questions.length}</span>
      <span>
        <span class="text-green-600 font-bold">✓ ${correctCount}</span>
        <span class="mx-1">|</span>
        <span class="text-red-600 font-bold">✗ ${incorrectCount}</span>
      </span>
    </div>
    ${showProgress()}
    <div class="mb-4 text-lg text-white mt-4 font-semibold">${q.question}</div>
  `;
  html += `<form id="options-form" class="space-y-2">`;
  q.options.forEach((opt, idx) => {
    const letter = String.fromCharCode(97 + idx);
    html += `
      <label class="flex items-center space-x-2 cursor-pointer">
        <input type="${
          isMultiple ? "checkbox" : "radio"
        }" name="option" value="${letter}" class="${
      isMultiple ? "form-checkbox" : "form-radio"
    } h-5 w-5 text-blue-600">
        <span class="text-white">${letter}) ${opt}</span>
      </label>
    `;
  });
  html += "</form>";
  document.getElementById("question-section").innerHTML = html;
  document.getElementById("feedback").innerHTML = "";
  document.getElementById("prev-btn").disabled = currentQuestion === 0;
  document.getElementById("next-btn").textContent =
    currentQuestion === questions.length - 1 ? "Finalizar" : "Siguiente";
  document.getElementById("next-btn").disabled = true;

  document.querySelectorAll('input[name="option"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (isMultiple) {
        document.getElementById("next-btn").disabled =
          !document.querySelectorAll('input[name="option"]:checked').length;
      } else {
        document.getElementById("next-btn").disabled = !document.querySelector(
          'input[name="option"]:checked'
        );
      }
    });
  });

  if (userAnswers[currentQuestion]) {
    userAnswers[currentQuestion].forEach((val) => {
      const el = document.querySelector(`input[name="option"][value="${val}"]`);
      if (el) el.checked = true;
    });
    document.getElementById("next-btn").disabled = false;
  }
}

function checkAnswer() {
  const q = questions[currentQuestion];
  const isMultiple = q.correct.length > 1;
  let selected = [];
  if (isMultiple) {
    selected = Array.from(
      document.querySelectorAll('input[name="option"]:checked')
    ).map((el) => el.value);
  } else {
    const checked = document.querySelector('input[name="option"]:checked');
    if (checked) selected = [checked.value];
  }
  userAnswers[currentQuestion] = selected;
  const correct = q.correct.slice().sort().join(",");
  const user = selected.slice().sort().join(",");
  let feedback = "";
  let showExpBtn = "";
  const wasCorrect = q.answeredCorrectly || false;

  if (correct === user) {
    feedback = `<span class="text-green-600 font-bold">¡Correcto!</span>`;
    if (!wasCorrect) {
      score++;
      correctCount++;
      if (mistakes.includes(currentQuestion)) {
        mistakes = mistakes.filter((idx) => idx !== currentQuestion);
      }
    }
    q.answeredCorrectly = true;
  } else {
    feedback = `<span class="text-red-600 font-bold">Incorrecto.</span> <br>
      <span class="text-gray-700">Respuesta correcta: <b>${q.correct.join(
        ", "
      )}</b></span>`;
    showExpBtn = `
      <button id="show-exp"
        class="ml-2 mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded border border-blue-400 hover:bg-blue-200 transition"
        style="display:inline-block"
      >Ver explicación</button>
      <div id="exp-div" class="mt-2 text-sm text-gray-700 bg-blue-50 rounded p-2 border border-blue-200 hidden">${
        q.explanation || ""
      }</div>
    `;
    if (wasCorrect) {
      score--;
      correctCount--;
    }
    if (!q.answeredCorrectly) {
      incorrectCount++;
    }
    if (!mistakes.includes(currentQuestion)) mistakes.push(currentQuestion);
    q.answeredCorrectly = false;
  }
  document.getElementById("feedback").innerHTML = feedback + showExpBtn;
  document
    .querySelectorAll('input[name="option"]')
    .forEach((el) => (el.disabled = true));
  if (showExpBtn) {
    document.getElementById("show-exp").onclick = function (e) {
      e.preventDefault();
      document.getElementById("exp-div").classList.toggle("hidden");
      this.textContent = document
        .getElementById("exp-div")
        .classList.contains("hidden")
        ? "Ver explicación"
        : "Ocultar explicación";
      this.classList.toggle("bg-blue-200");
      this.classList.toggle("bg-blue-100");
    };
  }
}

function nextHandler() {
  if (!answered) {
    checkAnswer();
    answered = true;
    document.getElementById("next-btn").textContent =
      currentQuestion === questions.length - 1 ? "Ver resultado" : "Continuar";
  } else {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      showQuestion();
    } else {
      showScore();
    }
  }
}

document.getElementById("next-btn").addEventListener("click", nextHandler);

document.getElementById("prev-btn").addEventListener("click", () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
  }
});

function showScore() {
  document.getElementById("question-section").innerHTML = "";
  document.getElementById("feedback").innerHTML = "";
  document.getElementById("prev-btn").style.display = "none";
  document.getElementById("next-btn").style.display = "none";
  document.getElementById("score-section").classList.remove("hidden");
  let reviewBtn = "";
  if (mistakes.length > 0) {
    reviewBtn = `<button id="review-mistakes" class="mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-700">Repasar fallos (${mistakes.length})</button>`;
  }
  document.getElementById("score-section").innerHTML = `
    <div class="text-2xl font-bold mb-2">¡Test finalizado!</div>
    <div class="text-lg">
      Puntuación: <span class="font-bold">${score}</span> de ${questions.length}<br>
      <span class="text-green-600 font-bold">✓ Correctas: ${correctCount}</span><br>
      <span class="text-red-600 font-bold">✗ Incorrectas: ${incorrectCount}</span>
    </div>
    ${reviewBtn}
    <button onclick="location.reload()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 ml-2">Repetir test</button>
  `;
  if (reviewBtn) {
    document.getElementById("review-mistakes").onclick = () => {
      reviewingMistakes = true;
      questions = mistakes.map((idx) => questions[idx]);
      currentQuestion = 0;
      score = 0;
      correctCount = 0;
      incorrectCount = 0;
      userAnswers = [];
      mistakes = [];
      document.getElementById("score-section").classList.add("hidden");
      document.getElementById("prev-btn").style.display = "";
      document.getElementById("next-btn").style.display = "";
      showQuestion();
    };
  }
}

window.onload = loadQuestions;



document.getElementById('dev-questions-btn').addEventListener('click', async () => {
  const res = await fetch('desarrollo.json');
  const data = await res.json();
  const devQuestions = data.devQuestions;
  let html = `<h2 class="text-xl font-bold mb-4 text-white">Preguntas de desarrollo</h2>`;
  devQuestions.forEach((q, idx) => {
    html += `
      <div class="mb-6">
        <div class="font-semibold text-white mb-1">${idx + 1}. ${q.question}</div>
        <div class="bg-blue-50 border-l-4 border-corporate-600 p-3 text-gray-900 rounded">${q.answer}</div>
      </div>
    `;
  });
  document.getElementById('dev-questions-section').innerHTML = html;
  document.getElementById('dev-questions-section').style.display = 'block';
  document.getElementById('dev-questions-section').scrollIntoView({ behavior: 'smooth' });
});
