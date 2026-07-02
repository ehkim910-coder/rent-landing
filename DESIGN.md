# 페이백 오토플랜 랜딩페이지 — 디자인 명세서 (DESIGN.md)

> 참고 사이트: https://payback-autoplan-landing.vercel.app/
> 이 문서는 위 사이트의 **디자인 시스템 + 애니메이션**을 그대로 재현하기 위한 명세다.
> 기술 스택: **순수 정적 HTML + 인라인 `<style>` + 바닐라 JS** (프레임워크 없음).

---

## 0. 핵심 컨셉 한 줄

- **모바일 전용 레이아웃을 PC에서도 강제** (본문 폭 `max-width: 520px` 중앙 고정, 좌우 회색 여백).
- 톤: 깔끔한 화이트 베이스 + **파란색(#0066FF) 단일 포인트 컬러**.
- 신뢰감 위주. 카드형 UI, 부드러운 그림자, 스크롤 진입 페이드업, 손그림(색연필) 밑줄/채점 동그라미가 시그니처.

---

## 1. 컬러 토큰 (`:root`)

```css
:root{
  --bg:#FFFFFF;        /* 페이지 배경(본문) */
  --surface:#F6F8FB;   /* 카드/섹션 보조 배경 (초기값 #F8F9FA → 폴리시에서 #F6F8FB로 덮음) */
  --text:#111111;      /* 기본 텍스트 / 다크 섹션 배경으로도 사용 */
  --text-2:#6B7280;    /* 보조 텍스트 (회색) */
  --text-3:#9CA3AF;    /* 흐린 텍스트 / placeholder */
  --border:#E8EBEF;    /* 카드 테두리 (초기 #E5E7EB → 폴리시에서 #E8EBEF) */
  --divider:#F1F3F5;   /* 옅은 구분선 */
  --point:#0066FF;     /* 메인 포인트(파랑) — CTA, 강조, 링크 */
  --point-dark:#0052cc;/* 버튼 hover */
  --red:#EF4444;       /* 경고/허위·부정 강조 */

  /* 그림자 (디자인 폴리시 구역에서 정의) */
  --shadow:0 2px 6px rgba(17,24,39,.05), 0 18px 36px -22px rgba(17,24,39,.20);
  --shadow-lg:0 10px 28px -10px rgba(17,24,39,.18), 0 32px 60px -30px rgba(17,24,39,.24);
}
```

부가 색상(토큰 외 직접 사용):
- 카카오 버튼: 배경 `#FEE500`, 글자 `#3C1E1E`
- 별점: `#FFB400`
- 다크 섹션 안 파란 강조: `#5C9DFF`
- 베스트 배지: `#FF4D6D`
- 편지(대표 소개) 카드 배경: `#FCFCFA`
- 표 테두리(비교표): `#A9B1BD` / 셀 `#B4BBC6`

---

## 2. 타이포그래피

```css
body{
  font-family:'Pretendard','-apple-system','Apple SD Gothic Neo','Malgun Gothic',sans-serif;
  color:#111;
  line-height:1.7;
  font-size:16px;
  letter-spacing:-0.01em;
  -webkit-font-smoothing:antialiased;
}
```

- **기본 폰트: Pretendard** (없으면 시스템 한글 폰트로 폴백). 별도 웹폰트 로드 코드는 없음 → 필요 시 Pretendard CDN 추가 권장.
- 한글 줄바꿈 깨짐 방지: 본문 다수에 `word-break:keep-all`.
- 자간은 전반적으로 **음수(-0.01 ~ -0.03em)**, 제목일수록 더 타이트.

| 용도 | 모바일 | PC(900px+) | 굵기 |
|---|---|---|---|
| 섹션 제목 `.sec-title` | 24px | 36px* | 700 |
| 히어로 H1 `.hero h1` | 24px | 36px* | 700 |
| 본문 lead | 16px | — | 400 |
| 섹션 부제 `.sec-sub` | 15px | 16px | 400 |
| eyebrow(소제목 라벨) | 12px | — | 700, `letter-spacing:0.08em`, 대문자 |
| 카드 제목 | 16~18px | — | 700 |
| 본문 카드 텍스트 | 14~15px | — | 400~600 |

> *모바일 강제 구역에서 900px+ 도 다시 24px로 덮어쓰는 경우 있음(§9 참고). 실제 화면은 거의 모바일 사이즈로 보인다.

---

## 3. 레이아웃 시스템

### 3-1. 컨테이너
```css
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}   /* 기본 */
.wrap{max-width:100%;padding:0 20px}                    /* 모바일 강제 구역에서 덮어씀 */
```

### 3-2. 모바일 전용 강제 (가장 중요한 트릭)
```css
html{background:#F1F3F5}                  /* 본문 밖 회색 배경 */
body{
  max-width:520px;                        /* 본문 폭 고정 */
  margin:0 auto;                          /* 중앙 정렬 */
  background:#fff;
  box-shadow:0 0 0 1px rgba(0,0,0,.04);   /* 본문 경계 얇은 선 */
  padding-bottom:74px;                    /* 하단 고정바 공간 */
}
```
- PC에서도 520px 모바일 화면처럼 보이게 한다.
- 900px+ 미디어쿼리 안에서 모든 멀티컬럼 그리드를 **1열로 강제**, 섹션 패딩도 모바일 값으로 되돌림(§9).

### 3-3. 섹션 기본
```css
section{padding:64px 0}
@media(min-width:900px){section{padding:120px 0}}  /* → 폴리시에서 128px, 단 모바일강제로 다시 64px */
.surface{background:var(--surface)}   /* 회색 배경 섹션 */
```

### 3-4. 섹션 헤더 패턴
```html
<div class="sec-head">
  <span class="eyebrow">EYEBROW</span>        <!-- 선택 -->
  <h2 class="sec-title">제목 <span class="point">강조</span></h2>
  <p class="sec-sub">부제</p>                  <!-- 선택 -->
</div>
```
- `.sec-title .point{color:var(--point)}` / `.sec-title .red{color:var(--red)}` 으로 키워드 색칠.

---

## 4. 페이지 섹션 순서 (위→아래)

1. **Header** (sticky, 56px) — 로고 + 카카오 상담 버튼
2. **Promo(상단)** — 어드민 이미지 등록 시에만 노출(기본 `display:none`)
3. **01. HERO** — H1 + 영상(자동재생 루프) + 안심칩 3개 + CTA
4. **02. PROBLEM** (`.surface`) — 인용 카드 3개("이런 생각 한 번쯤")
5. **03. GUIDE INTRO** — "3분 안에" + "차부터 고르지 마세요" 경고 + 이미지
6. **04. 핵심 근거** — 비교표(A/B고객) + 색연필 채점 동그라미 + frame-key
7. **05. SOLUTION(계약 순서)** — step 카드 1~4 + frame-key
8. **WHY #1 (대표 소개)** — 편지형 카드(founder-body)
9. **PRICE SLIDES** — 카테고리별(SUV/EV/가성비) **가로 자동 슬라이드 캐러셀**
10. **REVIEWS** — 후기 **가로 자동 슬라이드 캐러셀** (탭 시 모달)
11. **FAQ** — 아코디언
12. **Promo(폼 직전)**
13. **FINAL CTA + FORM** (`.final`, 회색) — 신청 폼
14. **PLEDGE** — 다크 섹션 마무리 약속
15. **Footer** — 링크/사업자 정보 (`padding-bottom:100px`)
16. **하단 고정 네비바** (fixed, 글래스모피즘)
17. 모달들: 차량선택 / 이용약관 / 개인정보 / 후기전체 / 성공 / 토스트

---

## 5. 핵심 컴포넌트 스펙

### 5-1. Header (sticky)
```css
header{position:sticky;top:0;z-index:50;height:56px;background:#fff;border-bottom:1px solid var(--divider)}
.header-inner{max-width:1080px;margin:0 auto;padding:0 20px;height:100%;
  display:flex;justify-content:space-between;align-items:center;gap:12px}
```
- 로고 `img` 높이 48px(작은 화면 40px), `border-radius:10px`.
- 카카오 버튼: 노랑 배경, `border-radius:10px`, 말풍선 SVG 아이콘 + "카카오 상담" 라벨. 360px 이하에서 라벨 숨김.

### 5-2. 하단 고정 네비바 (글래스)
```css
.bottom-nav{
  position:fixed;bottom:0;left:50%;transform:translateX(-50%);
  width:100%;max-width:520px;z-index:100;
  display:flex;align-items:center;gap:10px;
  padding:12px 16px;padding-bottom:calc(12px + env(safe-area-inset-bottom));
  background:rgba(255,255,255,.92);
  backdrop-filter:saturate(180%) blur(16px);
  -webkit-backdrop-filter:saturate(180%) blur(16px);
  border-top:1px solid rgba(0,0,0,.04);
  box-shadow:0 -8px 24px rgba(17,24,39,.06);
}
.bottom-nav a{flex:1;text-align:center;font-size:13.5px;font-weight:600;padding:12px 6px;border-radius:12px}
.bottom-nav .bn-cta{flex:1.4;background:rgba(0,102,255,.92);color:#fff;font-weight:700;
  box-shadow:0 4px 14px -2px rgba(0,102,255,.28)}
.bottom-nav a:active{transform:scale(0.97)}  /* 눌림 효과 */
```

### 5-3. 버튼 (CTA)
```css
.hero-cta,.form-submit{
  background:var(--point);color:#fff;font-weight:600~700;
  border-radius:14px;
  box-shadow:0 8px 22px -8px rgba(0,102,255,.55);  /* 파란 글로우 */
  transition:transform .2s ease, box-shadow .2s ease, background .15s;
}
.hero-cta:hover,.form-submit:hover{
  transform:translateY(-2px);                       /* 호버 리프트 */
  box-shadow:0 14px 30px -8px rgba(0,102,255,.6);
  background:var(--point-dark);
}
.hero-cta{height:56px;padding:0 32px}   .form-submit{height:62px;width:100%}
```
- 히어로 CTA는 모바일 강제 구역에서 `display:flex;justify-content:center;width:fit-content;margin:auto` 로 가운데 정렬.

### 5-4. 카드 공통 (폴리시)
```css
.quote-card,.why-card,.car-card,.form-box,.compare-table,.why-conclusion,.review-card,.frame-key{
  border-radius:18px;
  box-shadow:var(--shadow);
}
.why-card,.car-card{transition:transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s ease, border-color .15s}
.why-card:hover,.car-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}  /* 호버 떠오름 */
```
- 이미지 박스 `.hero-img,.empathy-img`: `border-radius:20px;box-shadow:var(--shadow)`.

### 5-5. 인용 카드 (PROBLEM)
```css
.quote-card{background:#fff;padding:24px 28px 24px 60px;border-radius:18px;position:relative}
.quote-card::before{content:"\201C";position:absolute;left:24px;top:18px;
  font-size:32px;color:var(--point);font-family:Georgia,serif}   /* 파란 큰따옴표 */
```

### 5-6. 비교표 + 색연필 채점 동그라미
```css
.compare-table{width:100%;border-collapse:collapse;background:#fff;
  border:1.5px solid #A9B1BD;border-radius:18px;overflow:hidden;font-size:13.5px}
.compare-table th{background:var(--surface);font-weight:700;border:1px solid #B4BBC6}
.compare-table td.ours{font-weight:700;color:var(--text)}
.compare-table th.h-ours{color:var(--point)}

/* 빨간 색연필로 친 동그라미 (정답 강조) */
.grade-circle{position:relative;display:inline-block;color:var(--red)!important;font-weight:700}
.grade-circle svg{position:absolute;left:50%;top:50%;width:150%;height:185%;
  transform:translate(-50%,-50%) rotate(-3deg)}
.grade-circle svg path{fill:none;stroke:var(--red);stroke-width:3;
  stroke-linecap:round;stroke-dasharray:480}
```
- HTML: 셀 안에 `<span class="grade-circle">월 48만원<svg>...타원 path...</svg></span>`.

### 5-7. 단계(step) 카드
```css
.step{background:#fff;padding:20px 22px;border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow)}
.step-num{color:var(--point);font-weight:800;font-size:16px}  /* "1." 처럼 ::after{content:"."} */
.step-title{font-weight:800}  .step-desc{font-size:13px;color:var(--text-2);margin-top:6px}
```

### 5-8. 강조 박스 (frame-key — 다크)
```css
.frame-key{background:var(--text);color:#fff;border-radius:18px;
  padding:30px 26px;font-size:17px;font-weight:600;line-height:1.75}
.frame-key .point{font-weight:700;text-decoration:underline;
  text-decoration-color:var(--point);text-decoration-thickness:2px;text-underline-offset:5px}
.frame-key .hl{color:#5C9DFF;background:linear-gradient(transparent 62%, rgba(92,157,255,.22) 62%)}  /* 형광펜 */
```

### 5-9. 대표 소개(편지형)
```css
.founder-body{background:#FCFCFA;border:1px solid var(--border);border-radius:16px;
  padding:28px 24px;box-shadow:0 6px 20px -12px rgba(17,24,39,.18);
  font-size:15px;line-height:1.85;color:var(--text-2)}
.founder-body .quote{border-left:3px solid var(--point);background:var(--surface);
  padding:16px 18px;font-weight:700;color:var(--text)}
.founder-points li::before{ /* 파란 체크표시 (border 두 변 + rotate) */
  content:"";width:14px;height:7px;border-left:2px solid var(--point);
  border-bottom:2px solid var(--point);transform:rotate(-45deg)}
```
> **체크리스트 마커 패턴**(파란 체크): `border-left + border-bottom + rotate(-45deg)` — `.cost-list / .result-list / .final-bullets / .founder-points` 전부 동일.

### 5-10. 차량/후기 캐러셀 카드
```css
.car-card{flex:0 0 240px;background:#fff;border:1px solid var(--border);border-radius:18px;overflow:hidden}
.car-photo{aspect-ratio:16/10;background:var(--surface) center/cover}  /* ::after data-name 플레이스홀더 */
.car-cta{display:flex;justify-content:space-between;background:var(--surface);
  color:var(--point);font-weight:700;border-radius:8px;padding:10px 12px}
.car-cta::after{content:"→"}

.review-card{flex:0 0 280px;border-radius:18px;cursor:pointer}
.review-photo{aspect-ratio:16/10}
.review-text{ -webkit-line-clamp:3; overflow:hidden }  /* 3줄 말줄임 */
.review-stars{color:#FFB400}
```
- 캐러셀 래퍼: 좌우 페이드 마스크
```css
.car-track-wrap,.review-track-wrap{position:relative;overflow:hidden;
  -webkit-mask-image:linear-gradient(to right,transparent,#000 32px,#000 calc(100% - 32px),transparent);
  mask-image:linear-gradient(to right,transparent,#000 32px,#000 calc(100% - 32px),transparent)}
.car-track,.review-track{display:flex;gap:14px;overflow-x:auto;
  scrollbar-width:none;cursor:grab;scroll-behavior:auto;touch-action:pan-x pan-y}
.car-track::-webkit-scrollbar{display:none}
.dragging{cursor:grabbing}
```

### 5-11. FAQ 아코디언
```css
.faq-list{border-top:1px solid var(--text)}
.faq-item{border-bottom:1px solid var(--divider)}
.faq-q{padding:24px 48px 24px 0;font-weight:600;cursor:pointer;position:relative}
.faq-q::after{content:"+";position:absolute;right:8px;top:24px;font-size:24px;
  color:var(--text-2);transition:transform .2s}
.faq-item.open .faq-q::after{transform:rotate(45deg);color:var(--point)}   /* + → × */
.faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease}
.faq-item.open .faq-a{max-height:500px;padding:0 0 24px}
```

### 5-12. 폼
```css
.form-box{background:#fff;padding:32px;border-radius:18px;border:1px solid var(--border)}
.form-group input,.form-group select{width:100%;padding:14px 16px;border:1px solid var(--border);
  border-radius:8px;font-size:15px;-webkit-appearance:none;transition:border-color .15s}
.form-group input:focus{outline:none;border-color:var(--point)}  /* 포커스 시 파란 테두리 */
label .req{color:var(--red)}  /* 필수 별표 */
```

### 5-13. 다크 섹션 (core / pledge)
```css
.core,.pledge{background:var(--text);color:#fff}   /* 검정(#111) 배경 */
.pledge-line{font-size:clamp(15px,4.4vw,22px);font-weight:700}
.pledge-line .point{color:#5C9DFF}   /* 다크 위 파랑은 밝은 #5C9DFF */
```

---

## 6. 애니메이션 명세 ⭐ (그대로 가져올 것)

> 전제: 모든 모션은 `@media(prefers-reduced-motion:no-preference)` 안에서만 동작. 접근성 고려.
> 공통 이징: **`cubic-bezier(.16,1,.3,1)`** (감속이 강한 부드러운 ease-out).

### 6-1. 스크롤 진입 페이드업 (`.reveal`) — 시그니처
```css
@media(prefers-reduced-motion:no-preference){
  .reveal{opacity:0;transform:translateY(26px);
    transition:opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1)}
  .reveal.in{opacity:1;transform:none}
}
```
JS:
```js
if(window.matchMedia('(prefers-reduced-motion: no-preference)').matches && 'IntersectionObserver' in window){
  const revealEls = document.querySelectorAll(
    '.sec-head, .founder-note, .quote-card, .why-card, .why-conclusion, .compare-table, ' +
    '.result-list, .case-item, .frame-list, .frame-key, .problem-loss, .final-left, .form-box, .empathy-grid');
  revealEls.forEach(el=>el.classList.add('reveal'));
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }});
  }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
  // 3개씩 묶어 0/0.07/0.14s 계단식 딜레이
  revealEls.forEach((el,i)=>{ el.style.transitionDelay = (Math.min(i%3,2)*0.07)+'s'; io.observe(el); });
}
```
- **핵심**: 화면 진입 시 한 번만 발동(`unobserve`), 3개 단위 stagger 딜레이.

### 6-2. 색연필 밑줄 그리기 (`.u-mark`)
```css
.u-mark svg path{stroke:var(--point);stroke-width:3.5;stroke-dasharray:240;stroke-dashoffset:240}
.u-mark.drawn svg path{stroke-dashoffset:0;transition:stroke-dashoffset .7s ease-out}
```
JS: IntersectionObserver(`threshold:0.6`)로 화면 60% 진입 시 `.drawn` 추가 → 선이 좌→우로 그려짐.
- SVG `<filter id="pencil">`(feTurbulence + feDisplacementMap + grain)로 **거친 색연필 질감 + 군데군데 흰 여백** 표현.

### 6-3. 비교표 채점 동그라미 그리기 (`.grade-circle`)
```css
.grade-circle svg path{stroke-dasharray:480;stroke-dashoffset:480}
.compare-table.in .grade-circle svg path{
  stroke-dashoffset:0;transition:stroke-dashoffset .9s ease-out .55s}  /* 표가 보이면 0.55s 뒤 0.9s간 원 그림 */
```
- 표(`.compare-table`)가 `.reveal.in` 될 때 함께 동그라미가 손으로 그리듯 그려진다.

### 6-4. 가로 자동 슬라이드 캐러셀 (무한 루프) — 차량/후기
JS 동작 요약:
1. 트랙 자식(카드)을 **통째로 복제**해 뒤에 붙임 → 이음매 없는 무한 루프 원본 확보.
2. 원본 1세트 길이(`period`)를 복제본 `offsetLeft`로 측정.
3. `requestAnimationFrame` 루프: 매 프레임 `scrollLeft += 0.4px`(느리게), `period` 넘으면 빼서 되돌림(normalize).
4. **인터랙션**:
   - 마우스 드래그: `pointerdown/move/up`, 이동량 **1.6배**로 빠르게 스크롤, 드래그 중 자동 정지.
   - 터치: `touchmove` 시 일시정지, `touchend` 즉시 재개(세로 스크롤은 `touch-action:pan-x pan-y`로 보존).
   - 휠/카드 내 링크 클릭 시 잠깐 정지 후 자동 재개(`resumeSoon`).
   - 후기 카드는 **드래그 아님 + 탭**일 때만 모달 오픈(`!moved && downCard`).
```js
const SPEED = 0.4 * dir;  // dir=1 정방향, .rev 클래스면 -1
function tick(){ if(!paused){ track.scrollLeft += SPEED; normalize(); } requestAnimationFrame(tick); }
```

### 6-5. 히어로 영상 자동재생 무한루프 (정지 불가)
```js
document.querySelectorAll('video.hero-video').forEach(v=>{
  v.muted=true; v.loop=true; v.removeAttribute('controls');
  const play=()=>{ const p=v.play(); if(p&&p.catch) p.catch(()=>{}); };
  v.addEventListener('pause',()=>{ if(!document.hidden) play(); });  // 멈추면 즉시 재생
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) play(); });
  play();
});
```
- HTML: `<video autoplay muted loop playsinline webkit-playsinline preload="auto" disablepictureinpicture>`.
- 컨트롤 숨김: `video.hero-img::-webkit-media-controls{display:none!important}`.

### 6-6. 모달 등장 애니메이션
```css
/* 차량 모달: 하단에서 슬라이드업 */
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
.car-modal-overlay{animation:fadeIn .2s ease}
.car-modal-box{animation:slideUp .25s cubic-bezier(.16,1,.3,1);border-radius:20px 20px 0 0}

/* 약관 모달: 중앙 팝업 (살짝 떠오름) */
.modal{transform:translateY(12px);transition:transform .25s cubic-bezier(.16,1,.3,1)}
.modal-overlay.open .modal{transform:none}
.modal-overlay{opacity:0;transition:opacity .2s ease}
.modal-overlay.open{opacity:1}
```

### 6-7. 성공 모달 + 체크 그리기
```css
.success-card{transform:translateY(16px) scale(.98);transition:transform .3s cubic-bezier(.16,1,.3,1)}
.success-overlay.open .success-card{transform:none}
.success-icon svg path{stroke-dasharray:32;stroke-dashoffset:32;animation:checkDraw .45s .15s ease forwards}
@keyframes checkDraw{to{stroke-dashoffset:0}}   /* 체크 ✓ 가 그려짐 */
```

### 6-8. 토스트
```css
.toast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%) translateY(20px);
  background:rgba(17,24,39,.94);color:#fff;border-radius:12px;opacity:0;
  transition:opacity .25s,transform .25s}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
```
JS: 3.2초 후 자동 사라짐.

### 6-9. 마이크로 인터랙션 모음
| 요소 | 효과 |
|---|---|
| 모든 버튼/링크 | `:hover` 색/그림자 transition `.15~.2s` |
| 카드 `:hover` | `translateY(-2~-4px)` + 그림자 강화 |
| 하단바 `a:active` | `scale(0.97)` 눌림 |
| FAQ `+` 아이콘 | `rotate(45deg)` → × |
| 폼 input focus | 테두리 파란색 |
| intro-chip hover | `translateY(-2px)` + 테두리 파랑 |

---

## 7. 시그니처 비주얼 디테일 (이 사이트만의 정체성)

1. **손그림 색연필 밑줄/동그라미** — SVG path + `stroke-dasharray` 드로잉 + `feTurbulence` 질감 필터. (꼭 재현)
2. **파란 체크 마커** — border 2변 + `rotate(-45deg)`로 그린 체크표시 (리스트 전반).
3. **다크 강조 박스(frame-key)** — 검정 배경 + 파란 밑줄/형광펜 강조로 핵심 메시지 못 박기.
4. **좌우 페이드 마스크 캐러셀** — 끝이 흐려지며 무한 흐름 느낌.
5. **글래스 하단 고정바** — `backdrop-filter: blur`.
6. **모바일 폭 강제(520px) + 회색 바깥 배경** — 어느 화면에서나 동일한 앱 같은 인상.

---

## 8. 반응형 브레이크포인트

- 주 분기: **`min-width:900px`** (데스크톱), 보조 `640px / 520px / 360px`.
- 단, **모바일 강제 구역**에서 900px+ 다컬럼을 다시 1열·작은 폰트로 덮으므로 실제 데스크톱에서도 모바일 화면이 유지된다.
- 앵커 점프 보정: `#quote,#reviews,#form{scroll-margin-top:64~80px}` (sticky 헤더 가림 방지).

---

## 9. 모바일 강제 오버라이드 (그대로 복사)

```css
@media(min-width:900px){
  .wrap{padding:0 20px}
  section{padding:64px 0}
  .hero{padding:48px 0 80px}
  .core{padding:80px 0}  .final{padding:80px 0 100px}
  .hero-grid{grid-template-columns:1fr;gap:32px}
  .hero-right{display:none}  .hero-img-mobile{display:block}
  .hero h1{font-size:24px}
  .empathy-grid,.cost-grid,.founder,.final-grid{grid-template-columns:1fr;gap:32px}
  .why-grid,.why-differ-grid,.reviews-grid{grid-template-columns:1fr}
  .sec-title{font-size:24px}  .sec-sub{font-size:15px}
  .car-track-wrap{margin:0 -20px}  .car-card{flex:0 0 240px}
}
```

---

## 10. 외부 의존성 / 연동 (디자인 무관, 참고용)

- Pretendard(권장 추가), 별도 아이콘 폰트 없음(전부 인라인 SVG/유니코드).
- 영상/이미지: `image/hero/*.mp4`, Unsplash 플레이스홀더 URL 다수.
- 추적/연동(디자인 외): Meta Pixel, 카카오 채널 SDK, Supabase(콘텐츠·차량·후기 동적화), Google Apps Script(폼 전송), ipify(IP).
- 폼은 `mode:'no-cors'` fetch로 전송 후 성공 모달 표시.

---

## 11. 재현 체크리스트

- [ ] `:root` 컬러 토큰 + 두 그림자 변수 정의
- [ ] `body{max-width:520px;margin:auto}` + `html{background:#F1F3F5}` 모바일 강제
- [ ] Pretendard 폰트 로드
- [ ] sticky 헤더 / 글래스 하단 고정바
- [ ] `.reveal` 스크롤 페이드업 + IntersectionObserver + stagger 딜레이
- [ ] `.u-mark` / `.grade-circle` 색연필 SVG 드로잉 + `#pencil` 필터
- [ ] 가로 자동 슬라이드 캐러셀(복제 무한루프 + 드래그/터치 + 페이드 마스크)
- [ ] 히어로 영상 autoplay/loop/playsinline + 정지 방지 JS
- [ ] FAQ 아코디언(`max-height` transition)
- [ ] 모달 4종(차량/약관/후기/성공) + 토스트 등장 애니메이션
- [ ] 파란 체크 마커 리스트 / frame-key 다크 박스 / 형광펜 강조
- [ ] CTA 버튼 파란 글로우 + 호버 리프트
- [ ] 공통 이징 `cubic-bezier(.16,1,.3,1)` 통일
```
