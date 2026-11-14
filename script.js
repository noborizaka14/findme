const messageArea = document.getElementById("message-area");
const messageText = document.getElementById("message-text");
const inputArea = document.getElementById("input-area");
const userInput = document.getElementById("user-input");
const submitButton = document.getElementById("submit-button");
const mordal = document.getElementById("mordal");

const progress = [];

const url = "https://script.google.com/macros/s/AKfycbzdUJEBiI5USRrQMKHmsi_Y1QNe4giWkjT-293-YuEsoQnYfzmBjQOP4QedBuv0XzWpZA/exec";
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

const handlers = {
    // "hello"
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824": async v => {
        startMordal();
        try {
            const r = await getResponse(v);
            messageText.innerText = r.message;
        } finally {
            await endMordal();
        }
    },
    // "どういうこと🫪"
    "25822b673db556891deaec02044c9c0182788d78def811e7d6d46de46309346d": async v => {
        startMordal();
        try {
            const r = await getResponse(v);
            messageText.innerText = r.message;
        } finally {
            await endMordal();
        }
    },
    // "動画"
    "02e75b6def98d47d873700db05e5b45643a2903e000b23bc2b67f8d42102e6e3": async v => {
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
        } finally {
            await endMordal();
        }
    },
    // エラー処理
    "TOO_LONG_INPUT": async () => {
        messageText.innerText = "入力が長過ぎます。100文字以内で入力してください。"
    }
};

const defaultHandler = async v => {
    messageText.innerText = `ありがとうございます。こんにちは、${v}さん。`;
};

submitButton.addEventListener("click", async () => {
    const inputValue = userInput.value;
    if(inputValue.length < 100){
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
