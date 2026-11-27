const messageArea = document.getElementById("message-area");
const messageText = document.getElementById("message-text");
const inputArea = document.getElementById("input-area");
const userInput = document.getElementById("user-input");
const submitButton = document.getElementById("submit-button");
const modal = document.getElementById("modal");

let gameState = {
  userName: null,
  step: "init",
};

const validHashes = {
    init: [
    ],
    name_set: [
    // はじめまして, よろしく
    "1a7b00c2059a05e6e47ca584d7c2e243da64e90f2d6a8b1d48489be7381ee458",
    "60a3c0ad7844dbc5ef575766d8841aafde04c2a794b059ad0862e23211d419ee",
    ],
    greeted: [
    // チャットボット, 人工無能, 対話型AI
    "b9f7c53dd12321d0272c1ebac3b251297646d78108b76638a85d69dd67eba2a7",
    "76f9e05b292b5a89b26f6c13bcbefaa1bfbc637c69e748d1cea623b15791c47c",
    "068dfb601b73ee5db3ac2f1b518f2fe0937360cdfe8711e6f2da1816eec7ee8b",
    ],
    solved: [
    // "動画"
    "02e75b6def98d47d873700db05e5b45643a2903e000b23bc2b67f8d42102e6e3",
    ]
};

let isValid = false;

const url = "https://script.google.com/macros/s/AKfycbx-34DR9FCz3T-yM9wsAWGC_2dOkysmRN4KCven5X1mDzKAxayt-gOdfgCmrXGKyQtYrw/exec";
const params = new URLSearchParams();

async function getResponse(param){
    try{
        params.set("trigger", param);
        params.set("userName", gameState.userName);
        params.set("step", gameState.step);
        const r = await fetch(url+"?"+params, {
            method: "GET",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: "*/*",
            }
        });
        const obj = await r.json();
        return obj;
    }catch(e){
        console.log(e);
    }
}

async function hashText(text) {
  const msgUint8 = new TextEncoder().encode(text); // (utf-8 の) Uint8Array にエンコードする
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // メッセージをハッシュする
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // バッファーをバイト列に変換する
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // バイト列を 16 進文字列に変換する
  return hashHex;
}

const f0 = async v => {
    submitButton.setAttribute("disabled", "disabled");
    startModal();
    try {
        const r = await getResponse(v);
        if(gameState.userName === null) gameState.userName = r.state.userName;
        renderResponse(r);
    } finally {
        await endModal();
    }
}

submitButton.addEventListener("click", async () => {
    const inputValue = userInput.value;
    const trimmedValue = inputValue.trim();
    if(trimmedValue.length > 100){
        const handler = handlers["TOO_LONG_INPUT"];
        await handler(trimmedValue);
    }else if(trimmedValue == ""){ return;
    }else if(isValid){
        const p = document.createElement("p");
        p.innerText = inputValue;
        p.className = "message-item message-item-user";
        messageArea.appendChild(p);
        userInput.value = "";
        await f0(trimmedValue);
    }else{
    }
});

userInput.addEventListener("keydown", async e => {
    if(e. key === "Enter") submitButton.click();
});

userInput.addEventListener("input", async () => {
    const v = userInput.value.trim();
    if(gameState.userName){
        const h = await hashText(v);
        if(validHashes[gameState.step] && validHashes[gameState.step].includes(h)){
            isValid = true;
            submitButton.removeAttribute("disabled");
        }else{
            isValid = false;
            submitButton.setAttribute("disabled", "disabled");
        }
    }else{
        isValid = true;
        submitButton.removeAttribute("disabled");
    }
});

function startModal(){
    modal.removeAttribute("hidden");
    modal.style.display = "block";
    modal.animate([{opacity: "0"}, {opacity: "0.4"}], 100);
    document.body.classList.add("modal-state");
}

function endModal(){
    modal.animate([{opacity: "0.4"}, {opacity: "0"}], 100)
        .finished
        .then(() => {
            modal.setAttribute("hidden", "hidden");
            modal.style.display = "none";
            document.body.classList.remove("modal-state");
        });
}

// ターゲット要素を取得するヘルパー（id や data-target に対応）
const findTarget = selectorOrId => {
  if (!selectorOrId) return null;
  return (
    document.getElementById(selectorOrId) ||
    document.querySelector(`[data-target="${selectorOrId}"]`) ||
    document.querySelector(selectorOrId)
  );
}

// 1. content：チャット風に流す要素を追加
function applyContent(contentList = []) {
  for (const item of contentList) {
    if (!item || !item.type) continue;

    if (item.type === "text") {
      const p = document.createElement("p");
      if (item.id) p.id = item.id;
      p.className = "message-item";
      p.innerText = item.message ?? "";
      messageArea.appendChild(p);
    } else if (item.type === "image") {
      const wrap = document.createElement("div");
      if (item.id) wrap.id = item.id;
      const img = document.createElement("img");
      img.src = item.src;
      wrap.className = "message-item";
      wrap.appendChild(img);
      messageArea.appendChild(wrap);
    } else if (item.type === "video") {
      const wrap = document.createElement("div");
      if (item.id) wrap.id = item.id;
      const video = document.createElement("video");
      video.src = item.videoSrc;
      video.controls = true;
      wrap.className = "message-item";
      wrap.appendChild(video);
      if (item.videoMessage) {
        const cap = document.createElement("p");
        cap.innerText = item.videoMessage;
        wrap.appendChild(cap);
      }
      messageArea.appendChild(wrap);
    }
  }
}

// 2. mutation：既存要素・固定枠の書き換え
function applyMutation(mutationList = []) {
  for (const m of mutationList) {
    if (!m || !m.type) continue;
    const el = findTarget(m.target);
    if (!el) continue;
    if (m.id) el.dataset.mutationId = m.id;
    if (m.type === "text") {
      el.innerText = m.content ?? "";
    } else if (m.type === "src") {
      if ("src" in el) {
        el.src = m.src ?? "";
      } else {
        el.style.backgroundImage = m.src ? `url("${m.src}")` : "";
      }
    }
  }
}

// 3. effect：色変化や位置ずらしなどの演出
function applyEffect(effectList = []) {
  for (const ef of effectList) {
    if (!ef || !ef.type) continue;
    const el = ef.target ? findTarget(ef.target) : document.body;
    if (!el) continue;
    if (ef.type === "change-color") {
      if (ef.bgcolor !== undefined) el.style.backgroundColor = ef.bgcolor;
      if (ef.color !== undefined) el.style.color = ef.color;
    } else if (ef.type === "translate") {
      el.style.transform = ef.value ? `translate(${ef.value})` : "";
    }
  }
}

// 4. state：進行状態の仮更新
function applyState(nextState) {
  if (!nextState || typeof nextState !== "object") return;
  gameState = { ...gameState, ...nextState };
}

// 応答データ全体を適用するエントリーポイント
function renderResponse(data) {
  if (!data) return;
  applyContent(data.content);
  applyMutation(data.mutation);
  applyEffect(data.effect);
  applyState(data.state);
}
