/****************************************************************
 * 위약금 랜딩(pbrent-new.vercel.app) 폼 수신 → '웹[위약금]' 탭 적재
 *
 *  ✅ 기존 Code.gs · KakaoAds_DB.gs 와 충돌 없음
 *     - doPost / doGet 을 정의하지 않는다 (프로젝트당 1개만 가능하므로)
 *     - 모든 전역 이름에 PB_ 접두어 → 이름 충돌 없음
 *     - 기존 웹DB2 / 포스팅 / 카카오 흐름은 전혀 건드리지 않는다
 *
 * ── 설치 (2단계) ────────────────────────────────────────────
 *  1) 이 프로젝트에 새 파일 추가:
 *     좌측 [파일] 옆 ＋ → [스크립트] → 이름 'penalty' → 이 코드 전체 붙여넣기 → 저장
 *
 *  2) Code.gs 의 doPost 안에 아래 2줄을 추가한다.
 *     위치: JSON.parse 로 data 를 읽은 직후, _validateOrigin 검사 "바로 위".
 *
 *       // ★ 위약금 랜딩 제출은 '웹[위약금]' 탭으로 분기 (penalty.gs)
 *       if (PB_isPenaltyLead(data)) return PB_handle(data);
 *
 *       if(!_validateOrigin(data)){ ... }   ← 원래 있던 줄 (이 줄 위에 넣는다)
 *
 *     ※ _validateOrigin 위에 두는 이유: 위약금 랜딩 도메인은 ALLOWED_ORIGINS 에
 *       없고 Turnstile 토큰도 안 보내므로, 기존 검사를 타면 전부 차단된다.
 *       대신 아래 PB_validate 에서 자체 검증을 한다.
 *
 *  3) [배포] → [배포 관리] → 연필 → 버전 '새 버전' → [배포]
 *     → 이 프로젝트의 /exec 주소를 랜딩페이지에 넣는다(개발자에게 전달).
 *
 * ── 되돌리기 ────────────────────────────────────────────────
 *  Code.gs 에 넣은 2줄만 지우면 원상복구된다. 이 파일은 그냥 두면 아무 일도 안 한다.
 ****************************************************************/

/* ---------- 설정 ---------- */

var PB_SPREADSHEET_ID = '1is7B3NOhof3w7vX8Uj47QzcXn3zV_9Kip5SD5daF924';  // 260204페이백 오토플랜
var PB_SHEET_NAME     = '웹[위약금]';
var PB_ALLOWED_HOSTS  = ['pbrent-new.vercel.app'];   // 이 도메인에서 온 것만 받는다

/**
 * 기록할 항목: [보내는 키, 시트에 보일 열 이름]
 * 열을 추가하고 싶으면 이 목록에만 추가하면 된다.
 * 시트에 없는 열은 자동으로 오른쪽에 만들어지고, 기존 열 순서는 건드리지 않는다.
 */
var PB_COLUMNS = [
  ['submitted_at',  '신청시각'],
  ['name',          '이름'],
  ['phone',         '연락처'],
  ['current_car',   '차량명'],
  ['use_period',    '이용기간'],
  ['want_new',      '신차변경희망'],
  ['message',       '문의내용'],
  ['agree',         '개인정보동의'],
  ['form_position', '폼위치'],        // 상단 폼 / 하단 폼 어디서 제출했는지
  ['utm_source',    'utm_source'],
  ['utm_medium',    'utm_medium'],
  ['utm_campaign',  'utm_campaign'],
  ['utm_term',      'utm_term'],
  ['utm_content',   'utm_content'],
  ['referrer',      '유입경로'],
  ['landing_url',   '랜딩URL'],
  ['revisit',       '재방문신청']      // 광고로 들어왔다 나중에 재방문해 신청 = Y
];

/* ---------- 분기 판정 ---------- */

/**
 * 이 제출이 위약금 랜딩에서 온 것인지 판정한다.
 * 랜딩이 lead_type:'penalty' 를 같이 보내며, 혹시 빠져도 landing_url 로 한 번 더 잡는다.
 * → 기존 웹DB2·포스팅 제출은 여기에 절대 걸리지 않는다.
 */
function PB_isPenaltyLead(data) {
  if (!data) return false;
  if (data.lead_type === 'penalty') return true;
  var url = String(data.landing_url || '');
  for (var i = 0; i < PB_ALLOWED_HOSTS.length; i++) {
    if (url.indexOf('//' + PB_ALLOWED_HOSTS[i]) !== -1) return true;
  }
  return false;
}

/* ---------- 처리 ---------- */

/** 위약금 랜딩 제출 1건을 검증 후 '웹[위약금]' 탭에 기록한다. */
function PB_handle(data) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (e) {}      // 동시 제출 시 줄 밀림 방지
  try {
    var v = PB_validate(data);
    if (!v.ok) return PB_json({ ok: false, reason: v.reason });

    var rowNum = PB_writeRow(data);
    return PB_json({ ok: true, sheet: PB_SHEET_NAME, row: rowNum });
  } catch (err) {
    return PB_json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/** 자체 검증 — 허니팟 / 이름 / 전화번호 / 도배 방지 */
function PB_validate(data) {
  if (data.ap_hp_website || data.ap_hp_url) return { ok: false, reason: 'honeypot' };

  var name = String(data.name || '').trim();
  if (name.length < 2 || name.length > 30) return { ok: false, reason: '이름 길이 이상' };

  var phone = String(data.phone || '').replace(/\s/g, '');
  if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone)) return { ok: false, reason: '전화번호 형식 이상' };

  var joined = JSON.stringify(data).toLowerCase();
  if (/<\s*script|onerror\s*=|onload\s*=|javascript:/.test(joined)) return { ok: false, reason: 'XSS' };

  // 같은 번호로 60초 내 3건 이상이면 차단
  try {
    var cache = CacheService.getScriptCache();
    var key = 'pb_rl_' + phone;
    var cur = parseInt(cache.get(key) || '0', 10);
    if (cur >= 3) return { ok: false, reason: 'rate_limit' };
    cache.put(key, String(cur + 1), 60);
  } catch (e) {}

  return { ok: true };
}

/** 대상 탭을 가져온다. 없으면 그 이름으로 새로 만든다. */
function PB_sheet() {
  var ss = SpreadsheetApp.openById(PB_SPREADSHEET_ID);
  var sh = ss.getSheetByName(PB_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(PB_SHEET_NAME);
  return sh;
}

/** 데이터 한 건을 맨 아래에 기록하고, 기록된 행 번호를 돌려준다. */
function PB_writeRow(data) {
  var sheet = PB_sheet();
  var header = PB_ensureHeader(sheet);

  // 열 이름 → 위치 로 찾아 넣으므로, 시트에서 열을 옮겨도 안 밀린다.
  var row = new Array(header.length);
  for (var i = 0; i < row.length; i++) row[i] = '';
  for (var j = 0; j < PB_COLUMNS.length; j++) {
    var idx = header.indexOf(PB_COLUMNS[j][1]);
    if (idx === -1) continue;
    row[idx] = PB_format(data[PB_COLUMNS[j][0]]);
  }

  // 셀 서식을 '텍스트'로 지정한 뒤 기록.
  // 이렇게 안 하면 캠페인명 '0720' → 720, 전화번호 앞자리 0 등이 잘린다.
  var rowNum = sheet.getLastRow() + 1;
  var range = sheet.getRange(rowNum, 1, 1, row.length);
  range.setNumberFormat('@');
  range.setValues([row]);
  return rowNum;
}

/** PB_COLUMNS 에 있는데 시트에 없는 열을 오른쪽에 자동으로 추가한다. */
function PB_ensureHeader(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var header = sheet.getLastRow() === 0
    ? []
    : sheet.getRange(1, 1, 1, width).getValues()[0].map(function (v) { return String(v).trim(); });

  while (header.length && header[header.length - 1] === '') header.pop();

  var missing = [];
  for (var i = 0; i < PB_COLUMNS.length; i++) {
    if (header.indexOf(PB_COLUMNS[i][1]) === -1) missing.push(PB_COLUMNS[i][1]);
  }

  if (missing.length) {
    var start = header.length + 1;
    var needed = header.length + missing.length;
    if (sheet.getMaxColumns() < needed) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), needed - sheet.getMaxColumns());
    }
    sheet.getRange(1, start, 1, missing.length).setValues([missing]).setFontWeight('bold');
    header = header.concat(missing);
    sheet.setFrozenRows(1);
  }
  return header;
}

function PB_format(v) {
  if (v === true || v === 'on') return 'Y';   // 체크박스는 'on' 으로 들어온다
  if (v === false) return 'N';
  return v == null ? '' : String(v);
}

function PB_json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- 점검용 (에디터에서 직접 실행) ---------- */

/** 실행하면 '웹[위약금]' 탭에 테스트 행이 1줄 들어간다. 확인 후 지울 것. */
function PB_testWrite() {
  var res = PB_handle({
    lead_type:     'penalty',
    submitted_at:  new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    name:          '테스트',
    phone:         '010-0000-0000',
    current_car:   '테스트차량',
    use_period:    '1년~2년',
    want_new:      '희망',
    message:       'PB_testWrite 실행 — 확인 후 삭제하세요',
    agree:         'Y',
    form_position: '테스트',
    landing_url:   'https://pbrent-new.vercel.app/'
  });
  Logger.log(res.getContent());
}

/** 대상 탭이 잘 열리는지, 지금 몇 줄 쌓였는지 로그로 확인한다. */
function PB_diagnose() {
  try {
    var sh = PB_sheet();
    Logger.log([
      '스프레드시트: ' + sh.getParent().getName(),
      '탭: ' + sh.getName(),
      '데이터 줄 수: ' + Math.max(sh.getLastRow() - 1, 0),
      '열 개수: ' + sh.getLastColumn()
    ].join('\n'));
  } catch (err) {
    Logger.log('실패: ' + err);
  }
}
