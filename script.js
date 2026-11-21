const messageArea = document.getElementById("message-area");
const messageText = document.getElementById("message-text");
const inputArea = document.getElementById("input-area");
const userInput = document.getElementById("user-input");
const submitButton = document.getElementById("submit-button");
const mordal = document.getElementById("mordal");

let gameState = {
  userName: null,
  step: "init",
};
let messageTemplates = [];
// クリック時に設定

const url = "https://script.google.com/macros/s/AKfycbxZW7i0etQ1UUwVkE9zNS-1FWAmiALgp3SSiPSmaLn2PP0fpLV5URuDkWAdQCJU9DfP-Q/exec";
const params = new URLSearchParams();

async function getResponse(param){
    try{
        params.set("trigger", param);
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

submitButton.addEventListener("click", async () => {
    const inputValue = userInput.value;
    if(inputValue.length < 100){
        messageTemplates = [gameState.userName, new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()];
        const p = document.createElement("p");
        p.innerText = inputValue;
        p.className = "message-item message-item-user";
        messageArea.appendChild(p);
        const h = await hashText(inputValue);
        const handler = handlers[h] ?? defaultHandler;
        await handler(inputValue);
    }else{
        const handler = handlers["TOO_LONG_INPUT"];
        await handler(inputValue);
    }
});

userInput.addEventListener("keydown", e => {
    if(e.key === "Enter"){
        submitButton.click();
    }
});

function startMordal(){
    mordal.removeAttribute("hidden");
    mordal.animate([{opacity: "0"}, {opacity: "0.4"}], 100);
    document.body.classList.add("mordal-state");
}

function endMordal(){
    mordal.animate([{opacity: "0.4"}, {opacity: "0"}], 100)
        .finished
        .then(() => {
            mordal.setAttribute("hidden", "hidden");
            document.body.classList.remove("mordal-state");
        });
}

// テキスト処理と返信の取得・描画
const fill = (t, ...args) => t.replace(/\{(\d+)\}/g, (m, i) => args[i] ?? m);
// ターゲット要素を取得するヘルパー（id や data-target に対応）
const findTarget = selectorOrId => {
  if (!selectorOrId) return null;
  return (
    document.getElementById(selectorOrId) ||
    document.querySelector(`[data-target="${selectorOrId}"]`) ||
    document.querySelector(selectorOrId)
  );
}

const f0 = async v => {
    if(true){
        startMordal();
        try {
            const r = await getResponse(v);
            renderResponse(r, messageTemplates);
        } finally {
            await endMordal();
        }
    }
}

const handlers = {
    "125aeadf27b0459b8760c13a3d80912dfa8a81a68261906f60d87f4a0268646c": f0,
    "4427d0b0e72940e3caa881c7b21e48136cbd002b7dcd8c991a38686fabe39929": f0, 
    "b3bec268e6aa07bbaf58b20e52eb1bede898dc214a7fbce93ccc58eaddd67686": f0,
    "8059f43b69df9852539afc1f29b566b7f4c42992bf4394d66df37c2398729087": f0,
    "565339bc4d33d72817b583024112eb7f5cdf3e5eef0252d6ec1b9c9a94e12bb3": f0,
    "7b2c6e4e5f4a77b1fc265497fc360d54de4549e7d36d30425c59d1610257f859": f0,
    "320716270511ba5406317acc3e74c2de8b29a3d6cb80883dd01598aa7d82a504": f0,
    "2d7ab4d39c1671dc2669d1c0cc736aa276706461675242e7d353ef6b68c69158": f0,
    "02e75b6def98d47d873700db05e5b45643a2903e000b23bc2b67f8d42102e6e3": f0,
    // エラー処理
    "TOO_LONG_INPUT": async () => {
        messageText.innerText = "入力が長過ぎます。100文字以内で入力してください。"
    }
};

const defaultHandler = async v => {
    if(!gameState.userName){
        renderResponse({content: [{type: "text", message: "こんにちは、{0}さん。"}]}, [v]);
        gameState.userName = v;
        gameState.step = "set name";
    }
};

// 1. content：チャット風に流す要素を追加
function applyContent(contentList = [], templates = []) {
  for (const item of contentList) {
    if (!item || !item.type) continue;

    if (item.type === "text") {
      const p = document.createElement("p");
      if (item.id) p.id = item.id;
      p.className = "message-item";
      p.innerText = fill(item.message ?? "", ...templates);
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
function renderResponse(data, templates = []) {
  if (!data) return;
  applyContent(data.content, templates);
  applyMutation(data.mutation);
  applyEffect(data.effect);
  applyState(data.state);
}
