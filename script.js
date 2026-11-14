const messageArea = document.getElementById("message-area");
const messageText = document.getElementById("message-text");
const inputArea = document.getElementById("input-area");
const userInput = document.getElementById("user-input");
const submitButton = document.getElementById("submit-button");
const mordal = document.getElementById("mordal");

let progress = [];
// [ユーザー名, あいさつ１, あいさつ2, ]
let messageTemplates = [];
// クリック時に設定

const url = "https://script.google.com/macros/s/AKfycbzFF4YSPJnQsP23txqkO8ry_0HdcJAfLXRhSGLeBNdaH-V1dtBmLzj6onyJh1lH1bN-sg/exec";
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

// テキスト処理と返信の取得・描画

const fill = (t, ...args) => t.replace(/\{(\d+)\}/g, (m, i) => args[i] ?? m);

const f0 = async v => {
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
}

const f1 = async v => {
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
}

const f2 = async v => {
    if(progress[2]){
        startMordal();
        try {
            const r = await getResponse(v);
            const img = document.createElement("img");
            img.src = r.imgUrl;
            messageText.innerText = fill(r.message, ...messageTemplates);
            messageText.insertAdjacentElement('beforeend', img);
            progress[1] = v;
        } finally {
            await endMordal();
        }
    }
}

const fv = async v => {
    if(true){
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
            descriptionArea.insertAdjacentElement("afterbegin", p);
        } finally {
            await endMordal();
        }
    }
}

const handlers = {

    "125aeadf27b0459b8760c13a3d80912dfa8a81a68261906f60d87f4a0268646c": f0,
    "4427d0b0e72940e3caa881c7b21e48136cbd002b7dcd8c991a38686fabe39929": f0, 
    "b3bec268e6aa07bbaf58b20e52eb1bede898dc214a7fbce93ccc58eaddd67686": f0,

    "8059f43b69df9852539afc1f29b566b7f4c42992bf4394d66df37c2398729087": f1,
    "565339bc4d33d72817b583024112eb7f5cdf3e5eef0252d6ec1b9c9a94e12bb3": f1,
    "7b2c6e4e5f4a77b1fc265497fc360d54de4549e7d36d30425c59d1610257f859": f1,

    "320716270511ba5406317acc3e74c2de8b29a3d6cb80883dd01598aa7d82a504": f2,
    "2d7ab4d39c1671dc2669d1c0cc736aa276706461675242e7d353ef6b68c69158": f2,

    "02e75b6def98d47d873700db05e5b45643a2903e000b23bc2b67f8d42102e6e3": fv,

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
