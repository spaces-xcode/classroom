// =========================================================
// بيانات العناصر التعليمية
// =========================================================
const items = [
  { id: "yasmine",   word: "ياسمين", image: "yasmine.png" },
  { id: "bushra",    word: "بشرى",   image: "bushra.png" },
  { id: "daoud",     word: "داود",   image: "daoud.png" },
  { id: "sami",      word: "سامي",   image: "sami.png" },
  { id: "rabbit",    word: "أرنب",   image: "rabbit.png" },
  { id: "lemon",     word: "ليمون",  image: "lemon.png" },
  { id: "hand",      word: "يد",     image: "hand.png" },
  { id: "chicken",   word: "دجاجة",  image: "chicken.png" },
  { id: "giraffe",   word: "زرافة",  image: "giraffe.png" },
  { id: "deer",      word: "غزال",   image: "deer.png" },
  { id: "policeman", word: "ضابط",   image: "policeman.png" },
  { id: "balloon",   word: "بالون",  image: "balloon.png" }
];

// تحويل القائمة إلى كائن يسهل البحث فيه بالمعرّف
const itemsById = Object.fromEntries(items.map(it => [it.id, it]));

// =========================================================
// عناصر الواجهة
// =========================================================
const overlay = document.getElementById("overlay");
const wordCard = document.getElementById("wordCard");
const wordText = document.getElementById("wordText");
const wordCardClose = document.getElementById("wordCardClose");
const repeatBtn = document.getElementById("repeatBtn");
const soundToggle = document.getElementById("soundToggle");
const restartBtn = document.getElementById("restartBtn");

let soundEnabled = true;
let hideTimer = null;
let currentWord = "";
let arabicVoice = null;

// =========================================================
// اختيار صوت عربي إن وُجد (Web Speech API)
// =========================================================
function pickArabicVoice() {
  if (!("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  arabicVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("ar")) || null;
}

if ("speechSynthesis" in window) {
  pickArabicVoice();
  // بعض المتصفحات تحمّل الأصوات بشكل غير متزامن
  window.speechSynthesis.onvoiceschanged = pickArabicVoice;
}

function speak(word) {
  if (!soundEnabled) return;
  if (!("speechSynthesis" in window)) return; // لا يوجد دعم؛ نستمر بدون خطأ
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "ar-SA";
    if (arabicVoice) utterance.voice = arabicVoice;
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    // نتجاهل أي خطأ في النطق دون إزعاج الطفل
    console.warn("تعذر النطق:", err);
  }
}

// =========================================================
// صوت نقر بسيط بدون ملفات خارجية (باستخدام Web Audio API)
// =========================================================
let audioCtx = null;
function playClickSound() {
  if (!soundEnabled) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(700, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
  } catch (err) {
    // بعض المتصفحات قد تمنع الصوت قبل أول تفاعل؛ لا مشكلة
  }
}

// =========================================================
// تأثير النجوم الصغيرة
// =========================================================
function spawnStars(x, y) {
  const starChars = ["⭐", "✨", "🌟"];
  const count = 6;
  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.textContent = starChars[Math.floor(Math.random() * starChars.length)];
    const angle = (Math.PI * 2 * i) / count;
    const distance = 60 + Math.random() * 40;
    star.style.setProperty("--sx", `${Math.cos(angle) * distance}px`);
    star.style.setProperty("--sy", `${Math.sin(angle) * distance}px`);
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 750);
  }
}

// =========================================================
// إظهار / إخفاء بطاقة الكلمة
// =========================================================
function showWord(item, sourceEl) {
  currentWord = item.word;
  wordText.textContent = item.word;

  overlay.hidden = false;
  wordCard.hidden = false;

  // إعادة تشغيل الأنيميشن في حال الضغط المتكرر السريع
  wordCard.style.animation = "none";
  // إجبار المتصفح على إعادة الحساب
  void wordCard.offsetWidth;
  wordCard.style.animation = "";

  playClickSound();
  speak(item.word);

  if (sourceEl) {
    const rect = sourceEl.getBoundingClientRect();
    spawnStars(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideWord, 2600);
}

function hideWord() {
  overlay.hidden = true;
  wordCard.hidden = true;
  clearTimeout(hideTimer);
}

// =========================================================
// ربط الأحداث بالعناصر التفاعلية
// =========================================================
function bindItemEvents() {
  const buttons = document.querySelectorAll(".hotspot[data-id]");
  buttons.forEach(btn => {
    const id = btn.getAttribute("data-id");
    const item = itemsById[id];
    if (!item) return;

    btn.setAttribute("aria-label", item.word);

    const handleActivate = () => {
      btn.classList.add("bounce");
      setTimeout(() => btn.classList.remove("bounce"), 200);
      showWord(item, btn);
    };

    btn.addEventListener("click", handleActivate);

    // دعم لوحة المفاتيح (Enter / Space) - العناصر هي أزرار بالفعل فهذا يعمل تلقائياً غالباً،
    // لكن نضيفه صراحة لضمان التوافق
    btn.addEventListener("keyup", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleActivate();
      }
    });
  });
}

// =========================================================
// أزرار التحكم العامة
// =========================================================
wordCardClose.addEventListener("click", hideWord);
overlay.addEventListener("click", hideWord);

repeatBtn.addEventListener("click", () => {
  if (currentWord) {
    playClickSound();
    speak(currentWord);
  }
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
  soundToggle.classList.toggle("muted", !soundEnabled);
  if (!soundEnabled && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

restartBtn.addEventListener("click", () => {
  hideWord();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  // إعادة اللعبة إلى حالتها الأولية (لا توجد نقاط أو حالة تحتاج لإعادة تعيين حالياً،
  // لكن الدالة جاهزة لأي حالة تُضاف لاحقاً)
  document.querySelectorAll(".item.bounce").forEach(el => el.classList.remove("bounce"));
});

// =========================================================
// بدء التشغيل
// =========================================================
document.addEventListener("DOMContentLoaded", bindItemEvents);
