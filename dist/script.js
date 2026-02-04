// JS
(() => {
  // --- Elements
  const stepRegistration = document.getElementById('stepRegistration');
  const stepWheel = document.getElementById('stepWheel');

  const regForm = document.getElementById('regForm');
  const nameInput = document.getElementById('nameInput');

  const helloText = document.getElementById('helloText');

  const wheel = document.getElementById('wheel');
  const spinBtn = document.getElementById('spinBtn');
  const restartBtn = document.getElementById('restartBtn');

  const messageBox = document.getElementById('messageBox');
  const msgTitle = document.getElementById('msgTitle');
  const msgBody = document.getElementById('msgBody');
  const codeText = document.getElementById('codeText');
  const copyBtn = document.getElementById('copyBtn');

  // --- Wheel config
  // 8 sectors, each 45deg
  const prizes = [
    { label: "Стікери", msg: "Забирай набір стікерів на стенді 😊" },
    { label: "Знижка 5%", msg: "Покажи код менеджеру — активуємо знижку 5%." },
    { label: "Футболка", msg: "Футболка твоя! Підійди до стенду." },
    { label: "Знижка 10%", msg: "Клас! Знижка 10% — покажи код." },
    { label: "Шопер", msg: "Шопер у подарунок — забирай на стенді." },
    { label: "Кепка", msg: "Кепка чекає на тебе на стенді 😎" },
    { label: "Сюрприз", msg: "Є сюрприз! Підійди — скажемо який 😉" },
    { label: "Другий шанс", msg: "Майже! Але даруємо ще одну спробу 🙌" }
  ];

  const sectorCount = prizes.length;
  const sectorAngle = 360 / sectorCount;

  let userName = "";
  let isSpinning = false;
  let extraSpinAvailable = false; // demo: allow one extra spin if "Другий шанс"
  let currentRotation = 0;

  // --- Helpers
  function show(el){ el.classList.remove('hidden'); }
  function hide(el){ el.classList.add('hidden'); }

  function randInt(min, max){
    // inclusive min/max
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeCode(){
    // ACTU-XXXXXX (4–6)
    const len = randInt(4, 6);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for(let i=0;i<len;i++){
      out += chars[Math.floor(Math.random()*chars.length)];
    }
    return `ACTU-${out}`;
  }

  function setMessage({title, body, code}){
    msgTitle.textContent = title;
    msgBody.textContent = body;
    codeText.textContent = code || "ACTU-";
    show(messageBox);
  }

  function resetMessage(){
    hide(messageBox);
    msgTitle.textContent = "Вітаємо!";
    msgBody.textContent = "";
    codeText.textContent = "ACTU-";
  }

  function lockUI(locked){
    spinBtn.disabled = locked;
    restartBtn.disabled = locked;
    nameInput.disabled = locked;
  }

  // Determine prize based on final rotation and pointer at 0deg (top).
  // Because wheel rotates, we map angle to sector index:
  function getPrizeIndexFromRotation(rotationDeg){
    // Normalize rotation to [0..360)
    const normalized = ((rotationDeg % 360) + 360) % 360;

    // Pointer is at top; label index 0 starts at 0deg in conic-gradient.
    // But because the wheel rotates clockwise, the sector at the pointer depends on inverse angle.
    // We convert to "where pointer points" in wheel's local coordinates:
    const pointerAngleOnWheel = (360 - normalized) % 360;

    // Sector 0 covers [0..45), sector 1 [45..90) etc.
    const index = Math.floor(pointerAngleOnWheel / sectorAngle) % sectorCount;
    return index;
  }

  // --- Flow: Registration -> Wheel
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (nameInput.value || "").trim();
    if(!name) return;

    userName = name;
    helloText.textContent = `Привіт, ${userName}!`;
    hide(stepRegistration);
    show(stepWheel);
    resetMessage();

    // reset state
    isSpinning = false;
    extraSpinAvailable = false;
    currentRotation = 0;
    wheel.style.transform = `rotate(${currentRotation}deg)`;
  });

  // --- Spin logic
  spinBtn.addEventListener('click', () => {
    if(isSpinning) return;

    isSpinning = true;
    lockUI(true);
    resetMessage();

    // Random target sector (0..7)
    // For a nicer feel, add multiple full spins + land in random area within sector
    const targetIndex = randInt(0, sectorCount - 1);

    // We want the pointer to land in the middle of the target sector for clarity
    const targetCenterAngle = (targetIndex * sectorAngle) + (sectorAngle / 2);

    // Convert to needed rotation (clockwise):
    // pointerAngleOnWheel = (360 - normalizedRotation) => want pointerAngleOnWheel == targetCenterAngle
    // => normalizedRotation = 360 - targetCenterAngle
    const desiredNormalizedRotation = (360 - targetCenterAngle) % 360;

    const fullSpins = randInt(5, 7); // number of full rotations
    const jitter = randInt(-10, 10); // small randomness, still inside sector
    const nextRotation = (fullSpins * 360) + desiredNormalizedRotation + jitter;

    currentRotation += nextRotation;

    wheel.style.transform = `rotate(${currentRotation}deg)`;

    // Wait until CSS transition ends
    const onDone = () => {
      wheel.removeEventListener('transitionend', onDone);

      const idx = getPrizeIndexFromRotation(currentRotation);
      const prize = prizes[idx];

      // Demo logic: "Другий шанс" allows one more spin, otherwise show code
      if(prize.label === "Другий шанс"){
        if(!extraSpinAvailable){
          extraSpinAvailable = true;
          setMessage({
            title: `Оу! ${userName}, другий шанс 🙌`,
            body: prize.msg,
            code: "—"
          });
          // Allow another spin
          isSpinning = false;
          lockUI(false);
          return;
        }
        // If already used, treat as small prize
        const code = makeCode();
        setMessage({
          title: `Вітаємо, ${userName}!`,
          body: `Цього разу: Стікери. ${prizes[0].msg}`,
          code
        });
      } else {
        const code = makeCode();
        setMessage({
          title: `Вітаємо, ${userName}!`,
          body: `Ти виграв(ла): ${prize.label}. ${prize.msg}`,
          code
        });
      }

      isSpinning = false;
      lockUI(false);
    };

    wheel.addEventListener('transitionend', onDone, { once: true });
  });

  // --- Restart
  restartBtn.addEventListener('click', () => {
    userName = "";
    nameInput.value = "";
    show(stepRegistration);
    hide(stepWheel);
    resetMessage();
    lockUI(false);
  });

  // --- Copy
  copyBtn.addEventListener('click', async () => {
    const txt = codeText.textContent.trim();
    if(!txt || txt === "ACTU-" || txt === "—") return;

    try{
      await navigator.clipboard.writeText(txt);
      const prev = copyBtn.textContent;
      copyBtn.textContent = "Готово ✅";
      setTimeout(() => (copyBtn.textContent = prev), 900);
    } catch(e){
      // fallback
      alert("Не вдалося скопіювати. Скопіюй вручну: " + txt);
    }
  });
})();