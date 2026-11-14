const messageArea = document.getElementById("message-area");
const messageText = document.getElementById("message-text");
const inputArea = document.getElementById("input-area");
const userInput = document.getElementById("user-input");
const submitButton = document.getElementById("submit-button");
const mordal = document.getElementById("mordal");

let progress = [];
// [ユーザー名, あいさつ１, あいさつ2, 要求]
let messageTemplates = [];
// クリック時に設定

const url = "https://script.google.com/macros/s/AKfycbxL5g2UJ6v2vNnW2hBybtGPrGIujOOG3IPhgzT5BXwJXLzL-xqhkmIRpCtq0jowkHu6MQ/exec";
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
const fill = (t, ...args) => t.replace(/\{(\d+)\}/g, (m, i) => args[i] ?? m);

const handlers = {
    // "こんにちは"
    "125aeadf27b0459b8760c13a3d80912dfa8a81a68261906f60d87f4a0268646c": async v => {
        if(progress[0]){
            startMordal();
            try {
                const r = await getResponse(v);
                messageText.innerText = fill(r.message, ...messageTemplates);
                progress[1] = v;
            } finally {
                await endMordal();
            }
        }
    },
    // "ありがとう"
    "5773be7d3dedf7cbda8a0ea503873b85d558dcbb78a636f491ed206a375eda3f": async v => {
        if(progress[1]){
            startMordal();
            try {
                const r = await getResponse(v);
                messageText.innerText = r.message;
                progress[2] = v;
            } finally {
                await endMordal();
            }
        }
    },
    // "動画"
    "02e75b6def98d47d873700db05e5b45643a2903e000b23bc2b67f8d42102e6e3": async v => {
        if(progress[2]){
            startMordal();
            try {
                const r = await getResponse(v);
                messageText.innerText = r.message;
                const p = document.createElement("p");
                const video = document.createElement("video");
                const descriptionArea = document.getElementById("description-area");
                p.innerText = r.videoMessage;
                p.classList.add("content");
                video.src = r.videoSrc;
                video.controls = "true";
                video.classList.add("video01");
                p.appendChild(video);
                descriptionArea.appendChild(p);
                progress[3] = v;
            } finally {
                await endMordal();
            }
        }
    },
    // エラー処理
    "TOO_LONG_INPUT": async () => {
        messageText.innerText = "入力が長過ぎます。100文字以内で入力してください。"
    }
};

const defaultHandler = async v => {
    if(!progress[0]){
        messageText.innerText = `ありがとうございます。こんにちは、${v}さん。`;
        progress[0] = v;
    }
};

submitButton.addEventListener("click", async () => {
    const inputValue = userInput.value;
    if(inputValue.length < 100){
        messageTemplates = [progress[0], new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()];
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