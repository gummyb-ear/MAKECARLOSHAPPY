/* =======================
  Utilities
======================= */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function setImg(el, path){
  // 공백/한글 파일명 대응
  el.src = encodeURI(path);
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

/* =======================
  Screens
======================= */
const screens = {
  start: $('[data-screen="start"]'),
  story: $('[data-screen="story"]'),
  game:  $('[data-screen="game"]')
};

function showScreen(name){
  Object.values(screens).forEach(s => s.classList.remove('screen--active'));
  screens[name].classList.add('screen--active');
}

/* Clicking title -> go home (start screen) */
$$('.js-home').forEach(el => {
  el.addEventListener('click', () => goHome());
});

function goHome(){
  // reset everything
  hideDialogue();
  hidePopup();
  clearProps();
  resetBarModes();
  eyebrowEl.style.color = '';
  eyebrowEl.classList.remove('eyebrow--cycle');
  showScreen('start');
}

/* =======================
  Story typing
======================= */
const STORY_LINES = [
  "명비,",
  "",
  "당신은 탈리하우스의 직원입니다.",
  "",
  "오늘은 언더보스, 카를로스 로코의 기분이 저조해 보이는군요.",
  "",
  "언더보스에 대해 아는 정보를 총동원하여 그의 기분을 북돋아 줍시다.",
  "",
  "그를 더욱 우울하게 만들지 않도록 주의하세요."
];

const storyBox = $('#storyBox');
async function typeStory(lines, charDelay=22, lineDelay=260){
  storyBox.textContent = "";
  for (const line of lines){
    for (const ch of line){
      storyBox.textContent += ch;
      await sleep(charDelay);
    }
    storyBox.textContent += "\n";
    await sleep(lineDelay);
  }
}

/* =======================
  Assets (paths)
======================= */
const ASSETS = {
  bg: {
    office: 'assets/bg/carlos_office_bg.png',
  },

  char: {
    base0: 'assets/char/carloshappy_0.png',
    base1: 'assets/char/carloshappy_1.png',
    base2: 'assets/char/carloshappy_2.png',

    bad: 'assets/char/carloshappy_badend.png',

    hand: 'assets/char/carloshappy_hand.png',
    prosthetic: 'assets/char/carloshappy_prosthetic.png',
    face: 'assets/char/carloshappy_face.png',
    head: 'assets/char/carloshappy_head.png',
    kiss: 'assets/char/carloshappy_kiss.png',
    butt: 'assets/char/carloshappy_butt.png',

    happyEnd1: 'assets/char/carloshappy_happyend_1.png',
    happyEnd2: 'assets/char/carloshappy_happyend_2.png',
    happyEnd3: 'assets/char/carloshappy_happyend_3.png',

    badDoor: 'assets/char/carloshappy_badend_door.png',

    heroinChoice: 'assets/char/carloshappy_heroin.png',
    heroinEnd: 'assets/char/carloshappy_heroinend.png'
  },

  props: {
    lucky: 'assets/props/object_luckystrike.png',
    camel: 'assets/props/object_camel.png',
    snack: 'assets/props/object_snack.png',
    postcard: 'assets/props/object_postcard.png',
    meds: 'assets/props/object_pills.png',

    sprite1: 'assets/props/sprite_1.png',
    isaac1: 'assets/props/isaac_1.png',
    isaac2: 'assets/props/isaac_2.png',
    sprite2: 'assets/props/sprite_2.png'
  }
};

/* =======================
  Game Elements
======================= */
const btnStart = $('#btnStart');
const btnToGame = $('#btnToGame');

const bgEl = $('#bg');
const charEl = $('#char');
const propEl = $('#prop');
const prop2El = $('#prop2');
const prop3El = $('#prop3');

const popupEl = $('#popup');

const barLabelEl = $('#barLabel');
const barEl = $('#bar');
const fills = $$('.barFill');

const choicesHomeEl = $('#choicesHome');
const dialogueViewEl = $('#dialogueView');
const eyebrowEl = $('#eyebrow');
const speakerEl = $('#speaker');
const dialogueEl = $('#dialogue');
const btnContinue = $('#btnContinue');
const subChoicesEl = $('#subChoices');

const stageFrame = $('#stageFrame');

/* =======================
  State
======================= */
let state = null;

/*
progress: 0..3  (3 segments)
used: Set of choice ids
mode: "normal" | "red" | "heroin"
pending: currently selected item waiting on "continue" or subchoices
*/
function resetState(){
  state = {
    progress: 0,
    used: new Set(),
    mode: 'normal',
    ended: false,
    isBranchSelecting: false
  };
}

/* =======================
  Choice Data
  kind: "unchanged" | "happy" | "unhappy" | "branch" | "confirm"
======================= */
const CHOICES = {
  chat: [
    {
      id: 'chat_work',
      text: '업무에 대해 얘기한다',
      result: 'unchanged',
      dialogue: '그래, 수고했네. 이만 들어가 봐.'
    },
    {
      id: 'chat_looks',
      text: '언더보스의 용모를 칭찬한다',
      result: 'unchanged',
      dialogue: '...갑자기 무슨 소리를 하나 했더니. 일이나 해...​'
    },
    {
      id: 'chat_redhook',
      text: '레드 훅에 대해 얘기한다',
      result: 'unhappy',
      dialogue: '너, 그건 어떻게... ... 내게서 어떤 반응을 기대하는 거야?'
    },
    {
      id: 'chat_bill',
      text: '의안에 대해 얘기한다',
      result: 'unhappy',
      dialogue: '하, 하... 나가.'
    },
    {
      id: 'chat_isaac',
      text: '아이작에 대해 얘기한다',
      result: 'branch',
      dialogue: '보스가 왜?',
      branchTitle: '(아래에서 선택)',
      branchChoices: [
        {
          id: 'isaac_sleep',
          text: '같이 숙직실에 들어가는 걸 봤는데 둘이 동침하느냐고 묻는다',
          result: 'unhappy',
          dialogue: '...이런 ㅆ... 나가. 당장.'
        },
        {
          id: 'isaac_halfdead',
          text: '언더보스를 욕하던 놈을 아이작이 반 죽여놓은 사실을 말한다',
          result: 'unhappy',
          dialogue: '...알고 있으니까 굳이 말 안 해줘도 된다. 용건은 그게 끝인가?'
        },
        {
          id: 'isaac_goodmood',
          text: '오늘 아이작 기분이 좋아보인다고 말한다',
          result: 'happy',
          dialogue: '​그래? ...그렇군. 참고하지. 알려줘서 고맙네.'
        }
      ]
    },
    {
      id: 'chat_thanks',
      text: '잘 챙겨줘서 고맙다고 한다',
      result: 'happy',
      dialogue: '​별 거 아니야. ...힘든 일이 있으면 언제든지 말하고.'
    }
  ],

  touch: [
    {
      id: 'touch_lefthand',
      text: '왼손을 잡는다',
      result: 'unchanged',
      dialogue: '...왜 이러나?',
      charOverride: ASSETS.char.hand
    },
    {
      id: 'touch_arm',
      text: '의수를 잡는다',
      result: 'unhappy',
      dialogue: '​이건 좀 예의가 없는 행동이라는 거, 몰라?',
      charOverride: ASSETS.char.prosthetic
    },
    {
      id: 'touch_face',
      text: '얼굴을 만진다',
      result: 'unhappy',
      dialogue: '...지금 뭐 하는 거지?...',
      charOverride: ASSETS.char.face
    },
    {
      id: 'touch_hair',
      text: '머리를 만진다',
      result: 'unhappy',
      dialogue: '?? 내가 네 개처럼 보이나...?',
      charOverride: ASSETS.char.head
    },
    {
      id: 'touch_kiss',
      text: '키스를 시도한다',
      result: 'confirm',
      confirmTextBold: '정말?',
      confirmChoices: [
        {
          id: 'kiss_yes',
          text: '네!',
          result: 'instantBad',
          dialogue: 'What the fu...',
          charOverride: ASSETS.char.kiss
        },
        {
          id: 'kiss_back',
          text: '돌아가기',
          result: 'back'
        }
      ]
    },
    {
      id: 'touch_butt',
      text: '엉덩이를 만진다',
      result: 'confirm',
      confirmTextBold: '정말?',
      confirmChoices: [
        {
          id: 'butt_yes',
          text: '네!',
          result: 'instantBad',
          dialogue: '...미친 새낀가?',
          charOverride: ASSETS.char.butt
        },
        {
          id: 'butt_back',
          text: '돌아가기',
          result: 'back'
        }
      ]
    }
  ],

  action: [
    {
      id: 'act_lucky',
      text: '담배(럭키 스트라이크)를 준다',
      result: 'happy',
      dialogue: '아, 고마워. 내가 이거 피우는 거 어떻게 알았나?',
      prop: ASSETS.props.lucky
    },
    {
      id: 'act_camel',
      text: '담배(카멜)를 준다',
      result: 'unchanged',
      dialogue: '고맙지만 이 브랜드는 안 피워.',
      prop: ASSETS.props.camel
    },
    {
      id: 'act_snack',
      text: '간식을 준다',
      result: 'unchanged',
      dialogue: '음… 고맙네. (나중에 머서 줘야겠군.)',
      prop: ASSETS.props.snack
    },
    {
      id: 'act_postcard',
      text: '바다 사진이 담긴 엽서를 준다',
      result: 'happy',
      dialogue: '예쁘군. 나 주는 건가? 고마워.',
      prop: ASSETS.props.postcard
    },
    {
      id: 'act_meds',
      text: '우울증 약을 준다',
      result: 'unhappy',
      dialogue: '…내가 이런 게 필요해 보였나?',
      prop: ASSETS.props.meds
    },
    {
      id: 'act_heroin',
      text: '헤로인을 준다',
      result: 'confirmHeroin',
      confirmTextBold: '정말?',
      confirmChoices: [
        {
          id: 'heroin_yes',
          text: '네!',
          result: 'instantHeroin',
          dialogue: '...하아.',
          charOverride: ASSETS.char.heroinChoice
        },
        {
          id: 'heroin_back',
          text: '돌아가기',
          result: 'back'
        }
      ]
    }
  ]
};

/* =======================
  Initialization
======================= */
btnStart.addEventListener('click', async () => {
  showScreen('story');
  btnToGame.disabled = true;
  await typeStory(STORY_LINES, 22, 240);
  btnToGame.disabled = false;
});

btnToGame.addEventListener('click', () => {
  showScreen('game');
  startGame();
});

function startGame(){
  resetState();

  // set base images
    setImg(bgEl, ASSETS.bg.office);
    charEl.hidden = false;
    setImg(charEl, ASSETS.char.base0);

  clearProps();
  hidePopup();
  resetBarModes();
  renderBar();
  showHomeChoices();
  eyebrowEl.style.color = '';
  eyebrowEl.classList.remove('eyebrow--cycle');
  initTabs();
}

/* =======================
  Render Home Choices
======================= */
function showHomeChoices(){
  choicesHomeEl.hidden = false;
  dialogueViewEl.hidden = true;
  subChoicesEl.hidden = true;
  btnContinue.hidden = true;
  speakerEl.style.display = 'none';

  renderList('#listChat', CHOICES.chat);
  renderList('#listTouch', CHOICES.touch);
  renderList('#listAction', CHOICES.action);
  hidePopup();
  clearProps();
  setBaseCharByProgress();
}

function renderList(containerSel, items){
  const root = $(containerSel);
  root.innerHTML = '';

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choiceBtn';

    btn.textContent = item.text;

    const used = state.used.has(item.id) || state.ended;
    if (used){
      btn.disabled = true;
      btn.classList.add('choiceBtn--used');
    }

    btn.addEventListener('click', () => onPick(item));
    root.appendChild(btn);
  });
}

/* =======================
  Dialogue Mode
======================= */
function showDialogue(){
  speakerEl.style.display = '';
  choicesHomeEl.hidden = true;
  dialogueViewEl.hidden = false;
}

function hideDialogue(){
  choicesHomeEl.style.opacity = "1";
  dialogueViewEl.hidden = true;
  choicesHomeEl.hidden = false;
  eyebrowEl.textContent = '';
  dialogueEl.textContent = '';
  subChoicesEl.innerHTML = '';
  subChoicesEl.hidden = true;
  btnContinue.hidden = true;
  speakerEl.textContent = '카를로스:';
  speakerEl.style.display = '';
}

/* typing dialogue */
async function typeDialogue(text, charDelay=18){
  dialogueEl.textContent = '';
  for (const ch of text){
    dialogueEl.textContent += ch;
    await sleep(charDelay);
  }
}

/* =======================
  Popup
======================= */
function showPopup(kind, text){
  popupEl.hidden = false;
  popupEl.className = 'popup';

  if (kind === 'white') popupEl.classList.add('popup--white');
  if (kind === 'green') popupEl.classList.add('popup--green');
  if (kind === 'red') popupEl.classList.add('popup--red');
  if (kind === 'heroin') popupEl.classList.add('popup--heroin');

  popupEl.textContent = text;
}

function hidePopup(){
  popupEl.hidden = true;
  popupEl.textContent = '';
  popupEl.className = 'popup';
}

/* =======================
  Props
======================= */
function clearProps(){
  propEl.hidden = true; propEl.removeAttribute('src');
  prop2El.hidden = true; prop2El.removeAttribute('src');
  prop3El.hidden = true; prop3El.removeAttribute('src');

  stageFrame.classList.remove('wave');
  [propEl, prop2El, prop3El].forEach(el => {
  el.style.left = el.style.top = el.style.right = el.style.bottom = '';
  el.style.width = el.style.height = '';
  el.style.transform = '';
});
}

function setProp1(path, style={}){
  propEl.hidden = false;
  setImg(propEl, path);
  applyPropStyle(propEl, style);
}
function setProp2(path, style={}){
  prop2El.hidden = false;
  setImg(prop2El, path);
  applyPropStyle(prop2El, style);
}
function setProp3(path, style={}){
  prop3El.hidden = false;
  setImg(prop3El, path);
  applyPropStyle(prop3El, style);
}

function applyPropStyle(el, s){
  // reset first
  el.style.left = '';
  el.style.top = '';
  el.style.right = '';
  el.style.bottom = '';
  el.style.width = '';
  el.style.height = '';
  el.style.transform = '';

  Object.assign(el.style, s);
}

/* =======================
  Returning Home
======================= */

function setBaseCharByProgress(){
  charEl.hidden = false;

  if (state.progress <= 0) setImg(charEl, ASSETS.char.base0);
  else if (state.progress === 1) setImg(charEl, ASSETS.char.base1);
  else setImg(charEl, ASSETS.char.base2); // progress 2 이상
}

/* =======================
  Progress Bar (0..3)
======================= */
function resetBarModes(){
  state.mode = 'normal';
  barEl.classList.remove('bar--red', 'bar--heroin');
  barLabelEl.textContent = 'HAPPINESS';
  barLabelEl.style.color = 'var(--green)';
}

function setRedFailBar(){
  state.mode = 'red';
  barEl.classList.remove('bar--heroin');
  barEl.classList.add('bar--red');
  barLabelEl.textContent = 'UNHAPPINESS';
  barLabelEl.style.color = 'var(--red)';
  // fills forced full by CSS
}

function setHeroinBar(){
  state.mode = 'heroin';
  barEl.classList.remove('bar--red');
  barEl.classList.add('bar--heroin');
  barLabelEl.textContent = 'HAPPINESS';
  barLabelEl.style.color = 'var(--green)';
}

function renderBar(){
  barEl.setAttribute('aria-valuenow', String(state.progress));

  // if special modes, CSS overrides
  if (state.mode !== 'normal') return;

  for (let i=0; i<3; i++){
    fills[i].style.width = (i < state.progress) ? '100%' : '0%';
  }
}

/* progress transitions: slide feel */
async function animateBarTo(newValue){
  const old = state.progress;
  state.progress = clamp(newValue, 0, 3);

  // simple "slide" illusion: delay then render
  await sleep(120);
  renderBar();

  // keep old for semantics if needed
  return { old, now: state.progress };
}

/* =======================
  Game Flow (Pick)
======================= */
async function onPick(item){
  choicesHomeEl.style.opacity = "0.2";
  if (state.ended) return;
  if (state.used.has(item.id)) return;

  // mark used for main choices immediately (branch/confirm choices are separate ids)
  state.used.add(item.id);

  // reset transient UI
  hidePopup();
  clearProps();

  // baseline portrait
  setBaseCharByProgress();

  // open dialogue view
  showDialogue();

  // Step 1: immediate (eyebrow + basic view)
  eyebrowEl.textContent = `> ${item.text}`;
  speakerEl.textContent = '카를로스:';
  dialogueEl.textContent = '';
  btnContinue.hidden = true;
  subChoicesEl.hidden = true;
  subChoicesEl.innerHTML = '';

  // Special flows
  if (item.result === 'branch'){
    // Show his first line, then offer 3 sub choices (no continue)
    // Unchanged popup
    state.isBranchSelecting = true;
    await doResultVisual('unchanged', item);
    await typeDialogue(item.dialogue);
    await sleep(180);

    // show branch options
    showBranchChoices(item.branchChoices);
    return;
  }

  if (item.result === 'confirm' || item.result === 'confirmHeroin'){
    // show bold "정말?" as dialogue, then offer 2 choices
    hidePopup();
    clearProps();
    renderBar();
    btnContinue.hidden = true;

    speakerEl.style.display = 'none';
    dialogueEl.textContent = '';
    dialogueEl.innerHTML = `<b>${item.confirmTextBold ?? '정말?'}</b>`;
    await sleep(120);
    showConfirmChoices(item.confirmChoices, item.result);
    return;
  }

  // Normal choices (unchanged/happy/unhappy)
  await doResultVisual(item.result, item);
  await typeDialogue(item.dialogue);

}

/* Show branch choices for Isaac */
function showBranchChoices(branchChoices){
  subChoicesEl.hidden = false;
  subChoicesEl.innerHTML = '';

  branchChoices.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choiceBtn';
    btn.textContent = b.text;

    const used = state.used.has(b.id) || state.ended;
    if (used){
      btn.disabled = true;
      btn.classList.add('choiceBtn--used');
    }

    btn.addEventListener('click', async () => {
      if (state.ended) return;
      if (state.used.has(b.id)) return;

      state.used.add(b.id);
      state.isBranchSelecting = false;
      subChoicesEl.hidden = true;
      subChoicesEl.innerHTML = '';
      subChoicesEl.hidden = true;

      // reset speaker visibility
      speakerEl.style.display = '';
      speakerEl.textContent = '카를로스:';

      eyebrowEl.textContent = `> ${b.text}`;
      dialogueEl.textContent = '';
      btnContinue.hidden = true;
      hidePopup();
      clearProps();

      // branch choice visual+bar update
      await doResultVisual(b.result, b);
      await typeDialogue(b.dialogue);

      await sleep(160);
    });

    subChoicesEl.appendChild(btn);
  });
}

/* Confirm choices (kiss/butt/heroin) */
function showConfirmChoices(confirmChoices, confirmType){
  subChoicesEl.hidden = false;
  subChoicesEl.innerHTML = '';

  confirmChoices.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choiceBtn';
    btn.textContent = c.text;

    // confirm sub-choices are also blocked after selecting (optional)
    const used = state.used.has(c.id) || state.ended;
    if (used){
      btn.disabled = true;
      btn.classList.add('choiceBtn--used');
    }

    btn.addEventListener('click', async () => {
      if (state.ended) return;
      if (state.used.has(c.id)) return;

      state.used.add(c.id);
      subChoicesEl.hidden = true;
      subChoicesEl.innerHTML = '';

      // back option
      if (c.result === 'back'){
        // restore speaker display
        speakerEl.style.display = '';
        hideDialogue();
        showHomeChoices();
        return;
      }

      // YES path
      eyebrowEl.textContent = `> ${c.text}`;
      speakerEl.style.display = '';
      speakerEl.textContent = '카를로스:';
      dialogueEl.textContent = '';
      btnContinue.hidden = true;
      subChoicesEl.hidden = true;

      hidePopup();
      clearProps();

      // override portrait for confirm-yes
      if (c.charOverride) setImg(charEl, c.charOverride);

      if (c.result === 'instantBad'){
        // instant bad ending: red bar fill + label UNHAPPINESS + continue -> bad ending
        await doInstantBad(c.dialogue);
        return;
      }

      if (c.result === 'instantHeroin'){
        // heroin ending: gradient bar + unique popup + continue -> heroin ending
        await doInstantHeroin(c.dialogue);
        return;
      }
    });

    subChoicesEl.appendChild(btn);
  });
}

/* =======================
  Visual Result Handler
  - animations order:
    1 immediate
    2 progress bar slides
    3 popup
    4 dialogue typing then chevron
======================= */
async function doResultVisual(result, item, opts={}){
  // 1 immediate: portrait override / props
    if (item.charOverride){
  setImg(charEl, item.charOverride);
    }
  if (item.prop) setProp1(item.prop);

  // 2 progress update (unless forced unchanged)
  if (!opts.forceNoProgressChange){
    if (result === 'happy'){
      const next = state.progress + 1;

      // if at 2 and becomes happy -> leads to happy ending after continue
      await animateBarTo(next);

      // 3 popup
      showPopup('green', '언더보스의 기분이 좋아졌습니다!');
      await sleep(220);

      // set portrait stage for "happy" result
      if (!item.charOverride){
      setBaseCharByProgress();
      }

      // if reached 3, queue happy ending on continue
      if (state.progress >= 3){
        // We'll attach end route when continue is shown by caller
        // (caller shows continue after typing; we override onclick there)
        hookContinueToHappyEnding();
      }

    } else if (result === 'unhappy'){
      const next = state.progress - 1;

      // if at 0 and unhappy -> red fail mode and bad ending on continue
      if (state.progress <= 0){
        setRedFailBar();
        // popup red
        showPopup('red', '언더보스는 기분이 나빠졌습니다…');
        await sleep(220);

        // portrait to bad reaction
        if (!item.charOverride){
  setImg(charEl, ASSETS.char.bad);
}

        // queue bad ending on continue
        hookContinueToBadEnding();
      } else {
        await animateBarTo(next);

        showPopup('red', '언더보스는 기분이 나빠졌습니다…');
        await sleep(220);

        if (!item.charOverride){
  setImg(charEl, ASSETS.char.bad);
}
      }

    } else {
      // unchanged
      await sleep(140);
      showPopup('white', '언더보스는 그냥 그래 보입니다.');
      await sleep(220);
      if (!item.charOverride){
      setBaseCharByProgress();
      }
      renderBar();
    }
  } else {
    // forced unchanged (for confirm pre-step)
    await sleep(140);
    showPopup('white', '언더보스는 그냥 그래 보입니다.');
    await sleep(220);
    renderBar();
  }
}

function hidePopupAfter(ms){
  setTimeout(() => {
    if (!popupEl.hidden) hidePopup();
  }, ms);
}

/* When progress reaches 3 -> happy ending on continue */
function hookContinueToHappyEnding(){
  // We override continue handler AFTER caller shows it.
  // To make sure it always routes: we set a flag on state.
  state._pendingEnd = 'happy';
}
function hookContinueToBadEnding(){
  state._pendingEnd = 'bad';
}

/* Wrap continue button show to check pending end */
async function showContinueOrEnd(){
    if (state?.isBranchSelecting) {
    btnContinue.hidden = true;
    return;
  }
      if (!subChoicesEl.hidden) {
    btnContinue.hidden = true;
    return;
      }
  btnContinue.hidden = false;
  btnContinue.textContent = '»';

  btnContinue.onclick = async () => {
    const pending = state._pendingEnd;
    state._pendingEnd = null;

    if (pending === 'happy'){
      await playHappyEnding();
      return;
    }
    if (pending === 'bad'){
      await playBadEnding();
      return;
    }

    hideDialogue();
    showHomeChoices();
  };
}

/* =======================
  Instant End Flows
======================= */
async function doInstantBad(dialogueText){
  // force red bar full
  setRedFailBar();
  setImg(charEl, ASSETS.char.bad);

  // popup + dialogue
  showPopup('red', '언더보스는 기분이 나빠졌습니다…');
  await sleep(220);

  speakerEl.textContent = '카를로스:';
  await typeDialogue(dialogueText);

  await sleep(160);
  btnContinue.hidden = false;
  btnContinue.textContent = '»';
  btnContinue.onclick = async () => playBadEnding();
}

async function doInstantHeroin(dialogueText){
  setHeroinBar();
  showPopup('heroin', '언더보스의 기분이 좋아졌습니다?');
  await sleep(220);

  speakerEl.textContent = '카를로스:';
  await typeDialogue(dialogueText);

  await sleep(160);
  btnContinue.hidden = false;
  btnContinue.textContent = '»';
  btnContinue.onclick = async () => playHeroinEnding();
}

/* =======================
  Override: after ANY normal choice typed, show continue
  (We call this after typeDialogue in onPick / branch handlers.)
======================= */
const _origTypeDialogue = typeDialogue;
typeDialogue = async function(text, charDelay=18){
  await _origTypeDialogue(text, charDelay);
  // after typing, show chevron (and route to ending if pending)
  await showContinueOrEnd();
};

/* =======================
  Endings
======================= */
async function playHappyEnding(){
    subChoicesEl.innerHTML = '';
    subChoicesEl.hidden = true;
  state.ended = true;
  clearProps();
  hidePopup();
  resetBarModes();
  renderBar();

  showDialogue();
  subChoicesEl.hidden = true;
  speakerEl.style.display = 'none';

  eyebrowEl.textContent = '> END 1. HAPPY ENDING';
  eyebrowEl.style.color = 'var(--green)';

  // stage initial happy image
  setImg(charEl, ASSETS.char.happyEnd1);

  // dialogue
  const endText =
    "언더보스가 작게 웃습니다.\n" +
    "당신의 노력으로 언더보스의 기분이 나아졌습니다!\n" +
    "당신은 언더보스를 가장 기쁘게 만들 수 있는 사람임에 틀림없어요.";
  await typeDialogue(endText, 16);

  // wait a little, then burst prop + swap char to happy2
  await sleep(1080);
  setProp1(ASSETS.props.sprite1, {
    left: '80%',
    top: '6%',
    width: '10%',
    height: 'auto'
  });
  setImg(charEl, ASSETS.char.happyEnd2);

  // continue -> Mercer sequence
  btnContinue.hidden = false;
  btnContinue.textContent = '»';
  btnContinue.onclick = async () => {
    // step 2: props appear one by one (inside bg)
    clearProps();
    setImg(charEl, ASSETS.char.happyEnd2);

    // place props naturally: use transform with CSS? simplest: reuse prop layers (full-screen contain)
    // If you want exact positioning, change .prop to allow absolute positioning per-image.
    setProp1(ASSETS.props.isaac1, {
      left: '70%',
      top: '10%',
      width: '19%',
      height: 'auto'
    });
  await sleep(640);

    setProp2(ASSETS.props.isaac2, {
      left: '80%',
      top: '36%',
      width: '20%',
      height: 'auto'
    });
  await sleep(640);

    setProp3(ASSETS.props.sprite2, {
      left: '75%',
      top: '58%',
      width: '7%',
      height: 'auto'
    });

    speakerEl.style.display = 'none';
    eyebrowEl.textContent = '';
    dialogueEl.textContent = '... ... ...';

    btnContinue.onclick = async () => {
      // step 3
      clearProps();
      setImg(charEl, ASSETS.char.happyEnd3);

      speakerEl.style.display = '';
      speakerEl.textContent = '카를로스:';
      eyebrowEl.textContent = '';
      dialogueEl.innerHTML = ''; // line by line
      btnContinue.hidden = true;

      // show lines one by one (except "카를로스:")
      const lines = [
        { text: '... ... 뭐야? 참 나, 하하...', cls:'line--white' },
        { text: '...엥~? 언더보스, 저런 표정도 지을 줄 알았던가요?!', cls:'line--green' },
        { text: '누군 웃게 하려고 이 고생을 했는데!', cls:'line--green' },
        { text: '허무하다, 허무해... ...', cls:'line--green' }
      ];

      for (const ln of lines){
        const div = document.createElement('div');
        div.className = ln.cls;
        div.textContent = ln.text;
        dialogueEl.appendChild(div);
        await sleep(640);
      }
      btnContinue.hidden = false;
      btnContinue.textContent = '다시하기 »';
      btnContinue.onclick = () => {
        eyebrowEl.classList.remove('eyebrow--cycle');
        eyebrowEl.style.color = '';
        goHome();
      };

      await sleep(160);
    };
  };
}

async function playBadEnding(){
    subChoicesEl.innerHTML = '';
    subChoicesEl.hidden = true;
  state.ended = true;
  clearProps();
  hidePopup();

  setImg(bgEl, ASSETS.bg.office);
  bgEl.hidden = false;
  
  charEl.hidden = false;
  setImg(charEl, ASSETS.char.badDoor);

  // bar: red fail
  setRedFailBar();

  showDialogue();
  subChoicesEl.hidden = true;
  speakerEl.style.display = 'none';

  eyebrowEl.textContent = '> END 2. BAD ENDING';
  eyebrowEl.style.color = 'var(--red)';

  const text =
    "언더보스는 더욱 우울해졌습니다.\n" +
    "가뜩이나 나쁘던 기분이 바닥까지 치달았나 보군요.\n" +
    "언더보스가 좋아하는 것과 싫어하는 것에 대해 잘 생각해 봅시다.";
  await typeDialogue(text, 16);

  btnContinue.hidden = false;
  btnContinue.textContent = '다시하기 »';
  btnContinue.onclick = () => {
    eyebrowEl.classList.remove('eyebrow--cycle');
    goHome();
  };
}

async function playHeroinEnding(){
    subChoicesEl.innerHTML = '';
    subChoicesEl.hidden = true;
  state.ended = true;
  clearProps();
  hidePopup();

  setHeroinBar();
  renderBar();

  // waving effect
  stageFrame.classList.add('wave');

  setImg(charEl, ASSETS.char.heroinEnd);

  showDialogue();
  subChoicesEl.hidden = true;
  speakerEl.style.display = 'none';

  eyebrowEl.textContent = '>  END 3 - HAPPY ENDING?';
  eyebrowEl.classList.add('eyebrow--cycle');

  const text =
    "언더보스는 분명 기분이 좋아 보입니다.\n" +
    "봐요, 웃고 있잖아요.\n" +
    "저 행복한 얼굴을 보세요!";
  await typeDialogue(text, 16);

  btnContinue.hidden = false;
  btnContinue.textContent = '다시하기 »';
  btnContinue.onclick = () => {
    eyebrowEl.classList.remove('eyebrow--cycle');
    eyebrowEl.style.color = '';
    goHome();
  };
}

/* =======================
  Boot
======================= */
(function boot(){
  showScreen('start');
})();

/* =======================
   Tab Switching
======================= */

function initTabs(){
  const tabBtns = $$('.tabBtn');
  const panels = $$('.tabPanel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {

      // 버튼 active 처리
      tabBtns.forEach(b => b.classList.remove('tabBtn--active'));
      btn.classList.add('tabBtn--active');

      // 패널 전환
      const target = btn.dataset.tab;
      panels.forEach(p => {
        p.classList.toggle(
          'tabPanel--active',
          p.dataset.panel === target
        );
      });

    });
  });
}