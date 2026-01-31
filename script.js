// ==========================================
// 1. 設定 API KEY (請在此填入你的 Key)
// ==========================================
const API_KEY = "AIzaSyAsq5fDEYoUzHk6lQy2zkC1QLO0Oh9Nr44"; // 請填入你的 API Key

// ==========================================
// 2. 遊戲背景設定 (System Prompt)
// ==========================================
const GAME_SETTING = `
你是一個 TRPG 的地下城主 (GM)。
遊戲背景：中古世紀奇幻世界，充滿魔法與危險。
玩家身分：一名剛踏入冒險者公會的新手，身上只有一把生鏽的劍。
你的任務：
1. 根據玩家輸入，推進劇情。
2. 判定玩家行動是否成功 (例如攻擊可能失誤)。
3. 請用繁體中文回答，描述要生動，可以使用 Markdown 格式 (粗體、列表)。
4. 每次回答最後，請給出 2-3 個可能的行動建議。
5. 請偶爾給予玩家目前的狀態更新（像是財富、擁有的東西、身體的狀態等等）。
6. 若玩家在遊戲中死亡的話會在失去一半的金錢和一些物品後重生
7. 貨幣有銅幣、銀幣、和金幣
現在，請描述遊戲的開場。
`;

// ==========================================
// 3. 程式邏輯
// ==========================================
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// 用來替代原本 SDK 的 chatSession，手動儲存對話歷史
let chatHistory = [];

async function initGame() {
  // 簡單檢查 Key 是否有填 (根據你的邏輯)
  if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    addMessage("ai", "⚠️ 請在 JavaScript 程式碼中填入你的 Google API Key 才能開始遊戲！");
    return;
  }

  // 啟動遊戲 (發送第一則隱藏訊息來觸發開場)
  // 這邊不需要建立 model 物件了，直接呼叫 sendToAI
  sendToAI("遊戲開始，請描述第一幕。", true);
}

async function sendToAI(text, isHidden = false) {
  if (!isHidden) addMessage("user", text);

  // 1. 將玩家的訊息加入歷史紀錄 (role: user)
  chatHistory.push({
    role: "user",
    parts: [{ text: text }]
  });

  // 鎖定輸入
  userInput.disabled = true;
  sendBtn.disabled = true;
  sendBtn.innerText = "思考中...";

  try {
    // 2. 使用 fetch 發送請求
    // 注意：這裡使用 gemini-1.5-flash，這是目前最穩定且免費額度較高的模型
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          // 這裡傳送完整的對話歷史，讓 AI 記得上下文
          contents: chatHistory,
          // 設定 System Prompt
          systemInstruction: {
            parts: [{ text: GAME_SETTING }]
          },
          // 設定生成參數
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.9,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API 連線失敗: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 檢查是否有回傳內容
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("AI 沒有回應內容");
    }

    const reply = data.candidates[0].content.parts[0].text;

    // 3. 將 AI 的回應加入歷史紀錄 (role: model)
    chatHistory.push({
      role: "model",
      parts: [{ text: reply }]
    });

    addMessage("ai", reply);

  } catch (error) {
    addMessage("ai", `發生錯誤: ${error.message}`);
    // 如果出錯，把剛剛使用者那條訊息從歷史中移除，避免卡住
    chatHistory.pop(); 
  } finally {
    // 解鎖輸入
    userInput.disabled = false;
    sendBtn.disabled = false;
    sendBtn.innerText = "行動";
    userInput.focus();
  }
}

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  // 使用 marked 解析 Markdown (讓粗體、列表正常顯示)
  // 確保你的 HTML 有引入 marked.js，否則這裡會報錯，若無則改回 innerText
  if (typeof marked !== 'undefined') {
      div.innerHTML = role === 'ai' ? marked.parse(text) : text;
  } else {
      div.innerText = text;
  }
  
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight; // 自動捲動到底部
}

// 事件監聽 (完全沒變)
sendBtn.addEventListener('click', () => {
  const text = userInput.value.trim();
  if (text) {
    sendToAI(text);
    userInput.value = '';
  }
});

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

// 開始遊戲
initGame();
