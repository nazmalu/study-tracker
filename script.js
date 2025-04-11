const loginButton = document.getElementById("login-button");
const usernameInput = document.getElementById("username");
const form = document.getElementById("study-form");
const recordList = document.getElementById("record-list");
const resetButton = document.getElementById("reset-button");
const searchInput = document.getElementById("search-input");

let records = JSON.parse(localStorage.getItem("records")) || [];
let chart = null;
let editingIndex = null;
let wrongQuestions = [];

const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const quizFeedback = document.getElementById("quiz-feedback");
const nextQuestionBtn = document.getElementById("next-question");
const retryWrongBtn = document.getElementById("retry-wrong");

// 🔃 起動時にログイン状態をチェック
window.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("loggedInUser");

  if (user) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
  }

  displayRecords();
});

// 🔐 ログイン処理
loginButton.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (username) {
    localStorage.setItem("loggedInUser", username);
    document.getElementById("login-section").style.display = "none";
    document.getElementById("app-section").style.display = "block";
  } else {
    alert("ユーザー名を入力してください！");
  }
});

// 🔁 モード切り替え処理（←この位置にまとめるのがベスト！）
const recordMode = document.getElementById("record-mode");
const quizMode = document.getElementById("quiz-mode");
const showRecordBtn = document.getElementById("show-record-mode");
const showQuizBtn = document.getElementById("show-quiz-mode");

showRecordBtn.addEventListener("click", () => {
  recordMode.style.display = "block";
  quizMode.style.display = "none";
});

showQuizBtn.addEventListener("click", () => {
  recordMode.style.display = "none";
  quizMode.style.display = "block";
  loadNextQuestion(); // クイズ開始
});


// 💾 ローカル保存
function saveRecords() {
  localStorage.setItem("records", JSON.stringify(records));
}

// 📋 表示処理（検索含む）
function displayRecords() {
  recordList.innerHTML = "";
  const keyword = searchInput?.value?.toLowerCase() || "";
  const filtered = records.filter(record =>
    record.content.toLowerCase().includes(keyword) ||
    record.category.toLowerCase().includes(keyword)
  );

  filtered.forEach((record, index) => {
    const li = document.createElement("li");
    li.textContent = `${record.date} - ${record.category} - ${record.content}（${record.time}分）`;

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.style.marginLeft = "10px";
    editBtn.addEventListener("click", () => {
      document.getElementById("date").value = record.date;
      document.getElementById("category").value = record.category;
      document.getElementById("content").value = record.content;
      document.getElementById("time").value = record.time;
      editingIndex = index;
      document.querySelector("button[type='submit']").textContent = "更新する";
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.style.color = "red";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.addEventListener("click", () => {
      records.splice(index, 1);
      saveRecords();
      displayRecords();
    });

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    recordList.appendChild(li);
  });

  drawChart(filtered);
}

// 📊 グラフ描画
function drawChart(dataToDisplay) {
  if (chart) chart.destroy();

  const dateMap = {};
  dataToDisplay.forEach(record => {
    const date = record.date;
    const time = parseInt(record.time);
    if (!isNaN(time)) {
      dateMap[date] = (dateMap[date] || 0) + time;
    }
  });

  const sortedDates = Object.keys(dateMap).sort();
  const sortedData = sortedDates.map(date => dateMap[date]);

  const ctx = document.getElementById('study-chart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedDates,
      datasets: [{
        label: '勉強時間（分）',
        data: sortedData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// 📝 記録フォーム送信
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const content = document.getElementById("content").value;
  const time = document.getElementById("time").value;

  const newRecord = { date, category, content, time };

  if (editingIndex !== null) {
    records[editingIndex] = newRecord;
    editingIndex = null;
    document.querySelector("button[type='submit']").textContent = "記録する";
  } else {
    records.push(newRecord);
  }

  saveRecords();
  displayRecords();
  form.reset();

  const userId = localStorage.getItem("loggedInUser") || "guest";

  fetch("https://np8wr1qqcl.execute-api.ap-northeast-1.amazonaws.com/dev/record", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId,
      content,
      time,
      category
    })
  })
    .then(res => res.json())
    .then(data => {
      console.log("✅ AWS保存成功:", data);
    })
    .catch(err => {
      console.error("❌ AWS保存失敗:", err);
    });
});

// 🔍 検索入力
if (searchInput) {
  searchInput.addEventListener("input", () => {
    displayRecords();
  });
}

// 🧹 初期化
resetButton.addEventListener("click", () => {
  const confirmReset = confirm("すべての記録を削除してもよいですか？");
  if (confirmReset) {
    localStorage.removeItem("records");
    records = [];
    displayRecords();
  }
});

// 🚪 ログアウト
const logoutButton = document.getElementById("logout-button");
logoutButton.addEventListener("click", () => {
  const confirmLogout = confirm("ログアウトしますか？");
  if (confirmLogout) {
    localStorage.removeItem("loggedInUser");
    location.reload();
  }
});

// ❓ クイズ出題ロジック
const quizData = [
  {
    question: "日本の首都は？",
    options: ["大阪", "東京", "名古屋", "札幌"],
    answer: "東京"
  },
  {
    question: "CSSは何の略？",
    options: ["Color Style Sheet", "Cascading Style Sheets", "Creative Style Set", "Code Style System"],
    answer: "Cascading Style Sheets"
  }
];

function loadNextQuestion() {
  quizFeedback.textContent = "";
  nextQuestionBtn.style.display = "none";

  currentQuestion = quizData[Math.floor(Math.random() * quizData.length)];
  quizQuestion.textContent = currentQuestion.question;
  quizOptions.innerHTML = "";

  currentQuestion.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.style.margin = "5px";
    btn.addEventListener("click", () => {
      if (option === currentQuestion.answer) {
        quizFeedback.textContent = "✅ 正解！";
      } else {
        quizFeedback.textContent = `❌ 不正解！正解は「${currentQuestion.answer}」`;
        wrongQuestions.push(currentQuestion);
      }
      nextQuestionBtn.style.display = "inline-block";
      retryWrongBtn.style.display = "inline-block";
    });
    quizOptions.appendChild(btn);
  });
}

nextQuestionBtn.addEventListener("click", loadNextQuestion);

retryWrongBtn.addEventListener("click", () => {
  if (wrongQuestions.length === 0) {
    quizFeedback.textContent = "🎉 間違えた問題はありません！";
    return;
  }

  const index = Math.floor(Math.random() * wrongQuestions.length);
  currentQuestion = wrongQuestions[index];

  quizFeedback.textContent = "";
  nextQuestionBtn.style.display = "none";

  quizQuestion.textContent = currentQuestion.question;
  quizOptions.innerHTML = "";

  currentQuestion.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.style.margin = "5px";
    btn.addEventListener("click", () => {
      if (option === currentQuestion.answer) {
        quizFeedback.textContent = "✅ 正解！";
      } else {
        quizFeedback.textContent = `❌ 不正解！正解は「${currentQuestion.answer}」`;
        wrongQuestions.push(currentQuestion);
      }
      nextQuestionBtn.style.display = "inline-block";
    });
    quizOptions.appendChild(btn);
  });
});
