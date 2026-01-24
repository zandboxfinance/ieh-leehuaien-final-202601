import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";


// ==========================================
// 1. 設定 API KEY (請在此填入你的 Key)
// ==========================================
const API_KEY = "不給你看";


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


let chatSession;


async function initGame() {
  if (API_KEY === "YOUR_API_KEY") {
    addMessage("ai", "⚠️ 請在 JavaScript 程式碼中填入你的 Google API Key 才能開始遊戲！");
    return;
  }


  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    // 使用 gemini-1.5-flash，這是目前最穩定且快速的模型
    // 如果你有 gemini-3 權限，可改為該模型名稱
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: GAME_SETTING
    });


    chatSession = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.9,
      },
    });


    // 啟動遊戲 (發送第一則隱藏訊息來觸發開場)
    sendToAI("遊戲開始，請描述第一幕。");
   
  } catch (error) {
    addMessage("ai", `初始化失敗: ${error.message}`);
  }
}


async function sendToAI(text, isHidden = false) {
  if (!isHidden) addMessage("user", text);
 
  // 鎖定輸入
  userInput.disabled = true;
  sendBtn.disabled = true;
  sendBtn.innerText = "思考中...";


  try {
    const result = await chatSession.sendMessage(text);
    const response = result.response.text();
    addMessage("ai", response);
  } catch (error) {
    addMessage("ai", `發生錯誤: ${error.message}`);
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
  div.innerHTML = role === 'ai' ? marked.parse(text) : text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight; // 自動捲動到底部
}


// 事件監聽
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