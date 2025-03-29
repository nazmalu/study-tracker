const form = document.getElementById("study-form");
const recordList = document.getElementById("record-list");
const resetButton = document.getElementById("reset-button");

let records = JSON.parse(localStorage.getItem("records")) || [];
let chart = null;
let editingIndex = null;

function saveRecords() {
  localStorage.setItem("records", JSON.stringify(records));
}

function displayRecords() {
  recordList.innerHTML = "";

  const keyword = document.getElementById("search-input")?.value?.toLowerCase() || "";

  const filteredRecords = records.filter(record =>
    record.content.toLowerCase().includes(keyword) ||
    record.category.toLowerCase().includes(keyword)
  );

  filteredRecords.forEach((record, index) => {
    const li = document.createElement("li");
    li.textContent = `${record.date} - ${record.category} - ${record.content}（${record.time}分）`;

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.title = "この記録を編集";
    editBtn.style.marginLeft = "10px";
    editBtn.addEventListener("click", () => {
      document.getElementById("date").value = record.date;
      document.getElementById("content").value = record.content;
      document.getElementById("time").value = record.time;
      document.getElementById("category").value = record.category;
      editingIndex = index;
      document.querySelector("button[type='submit']").textContent = "更新する";
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.title = "この記録を削除";
    deleteBtn.style.background = "none";
    deleteBtn.style.border = "none";
    deleteBtn.style.color = "red";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.addEventListener("click", () => {
      records.splice(index, 1);
      saveRecords();
      displayRecords();
    });

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    recordList.appendChild(li);
  });

  drawChart(filteredRecords);
}

function drawChart(dataToDisplay) {
  if (chart) {
    chart.destroy();
  }

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

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const date = document.getElementById("date").value;
  const content = document.getElementById("content").value;
  const time = document.getElementById("time").value;
  const category = document.getElementById("category").value;

  const newRecord = { date, content, time, category };

  // ✅ AWSに保存
  fetch("https://np8wr1qqcl.execute-api.ap-northeast-1.amazonaws.com/dev/record", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: "user1",
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

  // ✅ ローカル保存
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
});

const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    displayRecords();
  });
}

// 初期化ボタン処理
resetButton.addEventListener("click", () => {
  const confirmReset = confirm("すべての記録を削除してもよいですか？");
  if (confirmReset) {
    localStorage.removeItem("records");
    records = [];
    displayRecords();
  }
});

// 初期表示
displayRecords();