const PROJECT_ID = "smart-plant-care-system-179aa"; 
const API_URL = `https://smart-plant-care-system-179aa-default-rtdb.asia-southeast1.firebasedatabase.app/Sensor.json`;

// --- ตั้งค่าการคำนวณ % ดิน ---
// ปกติ ESP32 อ่านค่า Analog ได้ 0-4095
// ค่า 4095 = แห้งสนิท (0%)
// ค่า 0    = เปียกสนิท (100%)
const SOIL_MAX_DRY = 4095; // ค่าตอนแห้งสุด (เปลี่ยนตัวเลขนี้ถ้าเซนเซอร์คุณค่าสูงสุดไม่ใช่ 4095)
const SOIL_MIN_WET = 0;    // ค่าตอนเปียกสุด

const REFRESH_MS = 5000;

// Elements
const refreshBtn = document.getElementById("refreshBtn");
const connDot = document.getElementById("connDot");
const connText = document.getElementById("connText");
const updatedEl = document.getElementById("updated");

function calculateSoilPercent(rawValue) {

  let percent = ((SOIL_MAX_DRY - rawValue) / (SOIL_MAX_DRY - SOIL_MIN_WET)) * 100;
  
  // บังคับค่าให้อยู่ในช่วง 0-100 (เผื่อค่า sensor แกว่งเกินขอบ)
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;
  
  return Math.round(percent); 
}

function setBadge(state){
  if(state === "ok"){
    connDot.style.backgroundColor = "#22c55e"; 
    connText.textContent = "Online";
    connText.style.color = "#15803d";
  } else if(state === "err"){
    connDot.style.backgroundColor = "#ef4444"; 
    connText.textContent = "Error";
    connText.style.color = "#b91c1c";
  } else {
    connDot.style.backgroundColor = "#fbbf24"; 
    connText.textContent = "Loading...";
    connText.style.color = "#b45309";
  }
}

function updateCard(id, valueText, statusText) {
  const card = document.getElementById(id);
  if(card) {
    const valEl = card.querySelector(".value");
    const statEl = card.querySelector(".status");
    valEl.innerText = valueText;
    statEl.innerText = statusText;
  }
}

function showNoData(message = "Offline"){
  updateCard("soil", "--", message);
  updateCard("light", "--", message);
  updatedEl.innerText = "อัปเดตล่าสุด: --";
}

async function fetchData() {
  if(!PROJECT_ID || PROJECT_ID === "ใส่ชื่อโปรเจคของคุณตรงนี้"){
    setBadge("err");
    alert("อย่าลืมแก้ชื่อ PROJECT_ID ในไฟล์ app.js นะครับ!");
    return;
  }

  setBadge("loading");
  refreshBtn.disabled = true;
  refreshBtn.innerText = "⏳...";

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Network response was not ok");
    
    const data = await res.json(); 
    if(!data){
      setBadge("err");
      showNoData("No Data");
      return;
    }

    const soilRaw = data.Soil;
    const light = data.Light;

    // --- 1. คำนวณ % ดิน ---
    let soilDisplay = "-- %";
    let soilStatus = "รอข้อมูล";

    if (soilRaw !== undefined) {
      const percent = calculateSoilPercent(soilRaw);
      soilDisplay = `${percent} %`;
      
      // เกณฑ์บอกสถานะจาก %
       if(percent==0){
        soilStatus = "🌵 รอข้อมูล";
      }
      else if (percent < 30) {
        soilStatus = "💧 ดินแห้ง รดน้ำด่วน";
      } else if (percent > 80) {
        soilStatus = "💦 แฉะเกินไป";
      } 
      else if (percent<40){
        soilStatus = "🌿 ขาดน้ำนิดหน่อย";
      }
      else {
        soilStatus = "🌱 ชุ่มชื้นกำลังดี";
      }
    }

    let lightStatus = "รอข้อมูล";
  if (light !== undefined) {
       if (light < 300) {
           lightStatus = "🌑 มืดเกินไป สังเคราะห์แสงไม่ได้";
       } else if (light >= 300 && light < 900) {
           lightStatus = "☁️ แสงเหมาะกับไม้ในร่ม";
       } else if (light >= 900 && light < 3000) {
           lightStatus = "🌤 แสงเพียงพอ";
       } else {
           lightStatus = "☀️ แดดแรงเกินไป อาจทำให้ใบไหม้";
       }
    }

    // --- อัปเดตหน้าจอ ---
    updateCard("soil", soilDisplay, soilStatus);
    updateCard("light", light ?? "--", lightStatus);

    const now = new Date();
    updatedEl.innerText = "อัปเดตล่าสุด: " + now.toLocaleTimeString("th-TH");

    setBadge("ok");

  } catch (err) {
    console.error("Error fetching data:", err);
    setBadge("err");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerText = "🔄 Refresh";
  }
}

refreshBtn.addEventListener("click", fetchData);

fetchData();
setInterval(fetchData, REFRESH_MS);