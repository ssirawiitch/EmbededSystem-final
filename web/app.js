// =========================
// 1) CONFIG
// =========================
const CHANNEL_ID = "3196507"; // ใส่ Channel ID ของคุณ

// Thresholds
const SOIL_DRY_THRESHOLD = 2500;
const LIGHT_OK_THRESHOLD = 1500;

const REFRESH_MS = 20000;
const API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?results=1`;

// =========================
// 2) ELEMENTS
// =========================
const refreshBtn = document.getElementById("refreshBtn");
const connDot = document.getElementById("connDot");
const connText = document.getElementById("connText"); // เพิ่ม Text element
const updatedEl = document.getElementById("updated");

// -------------------------
// ฟังก์ชันจัดการสถานะการเชื่อมต่อ (ปรับให้เข้ากับ UI ใหม่)
function setBadge(state){
  if(state === "ok"){
    connDot.style.backgroundColor = "#22c55e"; // สีเขียว
    connText.textContent = "Online";
    connText.style.color = "#15803d";
  } else if(state === "err"){
    connDot.style.backgroundColor = "#ef4444"; // สีแดง
    connText.textContent = "Error";
    connText.style.color = "#b91c1c";
  } else {
    connDot.style.backgroundColor = "#fbbf24"; // สีเหลือง
    connText.textContent = "Loading...";
    connText.style.color = "#b45309";
  }
}

function updateCard(id, valueText, statusText) {
  const card = document.getElementById(id);
  if(card) {
    card.querySelector(".value").innerText = valueText;
    card.querySelector(".status").innerText = statusText;
  }
}

function showNoData(message = "ไม่มีข้อมูล"){
  updateCard("soil", "--", message);
  updateCard("light", "--", message);
  updateCard("temp", "--", message);
  updateCard("humi", "--", message);
  updatedEl.innerText = "อัปเดตล่าสุด: --";
}

// =========================
// 3) MAIN FETCH (Logic เดิม)
// =========================
async function fetchData() {
  if(!CHANNEL_ID || CHANNEL_ID === "YOUR_CHANNEL_ID"){
    setBadge("err");
    showNoData("No Channel ID");
    return;
  }

  setBadge("loading");
  refreshBtn.disabled = true;
  refreshBtn.innerText = "⏳...";

  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    const json = await res.json();

    const feed = json?.feeds?.[0];
    if(!feed){
      setBadge("err");
      showNoData();
      return;
    }

    // Mapping Data
    const soilRaw = feed.field1;
    const lightRaw = feed.field2;
    const tempRaw = feed.field3;
    const humiRaw = feed.field4;

    const soil = soilRaw != null ? parseInt(soilRaw) : null;
    const light = lightRaw != null ? parseInt(lightRaw) : null;
    const temp = tempRaw != null ? parseFloat(tempRaw) : null;
    const humi = humiRaw != null ? parseFloat(humiRaw) : null;

    // Logic ตรวจสอบค่า
    const soilStatus = soil == null
      ? "รอข้อมูล"
      : soil > SOIL_DRY_THRESHOLD
        ? "💧 ดินแห้ง"
        : "🌱 ดินชื้นดี";

    const lightStatus = light == null
      ? "รอข้อมูล"
      : light > LIGHT_OK_THRESHOLD
        ? "🌤 แสงพอ"
        : "🌑 แสงน้อย";

    const tempStatus = temp == null
      ? "รอข้อมูล"
      : temp > 35
        ? "🥵 ร้อน"
        : temp < 20
          ? "🥶 เย็น"
          : "🌡 ปกติ";

    const humiStatus = humi == null
      ? "รอข้อมูล"
      : humi < 40
        ? "💨 แห้งไป"
        : humi > 80
          ? "💦 ชื้นไป"
          : "👌 ปกติ";

    // Update UI
    updateCard("soil", soil ?? "--", soilStatus);
    updateCard("light", light ?? "--", lightStatus);
    updateCard("temp", (temp ?? "--") + " °C", tempStatus);
    updateCard("humi", (humi ?? "--") + " %", humiStatus);

    const t = feed.created_at ? new Date(feed.created_at) : null;
    updatedEl.innerText = "อัปเดตล่าสุด: " + (t ? t.toLocaleTimeString("th-TH") : "--");

    setBadge("ok");
  } catch (err) {
    console.error("Error fetching data:", err);
    setBadge("err");
    showNoData("Connect Fail");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerText = "🔄 Refresh";
  }
}

// =========================
// 4) EVENTS
// =========================
refreshBtn.addEventListener("click", fetchData);

fetchData();
setInterval(fetchData, REFRESH_MS);