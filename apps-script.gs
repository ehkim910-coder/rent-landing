/****************************************************************
 * 장기렌트 전환 상담 — 구글시트 수신 스크립트 (Apps Script)
 *
 * 저장 위치 : 아래 TARGETS 에 적힌 "두 곳 모두" 에 같은 내용을 기록합니다.
 *   1) 260204페이백 오토플랜  →  [웹[위약금]] 탭
 *   2) 페이백 오토플랜 위약금 랜딩 DB  →  첫 번째 탭 (기존에 쌓이던 곳)
 *   ※ 한 곳이 실패해도 나머지 한 곳에는 반드시 기록되도록 분리 처리합니다.
 *
 * [설치 방법]
 * 1. "페이백 오토플랜 위약금 랜딩 DB" 스프레드시트 열기
 *      https://docs.google.com/spreadsheets/d/1JPzTBRzx94-UcOJDdQB5Enc5cm0MnV-_Iyt-2xrPB_Y/edit
 * 2. 상단 메뉴 [확장 프로그램] → [Apps Script]
 *    (기존 코드에 'OK - lead endpoint is live' 문구가 있으면 맞는 프로젝트입니다)
 * 3. 기존 코드 전체 삭제 후 이 파일 내용을 통째로 붙여넣기 → 저장
 * 4. 우측 상단 [배포] → [배포 관리] → 연필(수정) → 버전 "새 버전" → [배포]
 *      - 다음 사용자로 실행: 나
 *      - 액세스 권한이 있는 사용자: "모든 사용자"   ← ★이거 꼭★
 *    → 권한 승인 화면이 다시 뜨면 승인(안전하지 않음 → 계속)
 *      ※ openById 로 다른 스프레드시트까지 열게 되어 재승인이 한 번 필요합니다.
 *    → 웹앱 주소(/exec)는 그대로 유지됩니다. 랜딩페이지는 손댈 필요 없습니다.
 *
 * ⚠️ 절대 'CustomerAlimtalk' 프로젝트에는 붙여넣지 마세요.
 *    그건 웹DB2 랜딩·포스팅 CRM 을 담당하는 다른 프로젝트입니다.
 *
 * [확인 방법]
 * - 브라우저로 /exec 주소를 열면 두 곳 각각에 몇 줄 쌓였는지 JSON 으로 보여줍니다.
 * - 에디터에서 함수 testWrite 를 실행하면 두 곳에 테스트 행이 1줄씩 들어갑니다.
 ****************************************************************/

/** 기록 대상 — 위에서부터 순서대로 모두 기록합니다. */
var TARGETS = [
  {
    key: 'main',
    label: '웹[위약금]',
    spreadsheetId: '1is7B3NOhof3w7vX8Uj47QzcXn3zV_9Kip5SD5daF924',
    sheetName: '웹[위약금]'          // 이름으로 탭을 찾습니다. 없으면 새로 만듭니다.
  },
  {
    key: 'legacy',
    label: '위약금 랜딩 DB',
    spreadsheetId: '1JPzTBRzx94-UcOJDdQB5Enc5cm0MnV-_Iyt-2xrPB_Y',
    sheetName: null                  // null = 첫 번째 탭 (기존에 쌓이던 그 탭)
  }
];

/**
 * 기록할 항목: [보내는 키, 시트에 보일 열 이름]
 * 열을 추가하고 싶으면 이 목록에만 추가하면 됩니다.
 * 시트에 없는 열은 자동으로 오른쪽에 만들어지고, 기존 열 순서는 건드리지 않습니다.
 * (사용자가 시트에서 열 순서를 바꿔도 이름으로 찾아 넣기 때문에 안 밀립니다.)
 */
var COLUMNS = [
  ['submitted_at', '신청시각'],
  ['name',         '이름'],
  ['phone',        '연락처'],
  ['current_car',  '차량명'],
  ['use_period',   '이용기간'],
  ['want_new',     '신차변경희망'],
  ['message',      '문의내용'],
  ['agree',        '개인정보동의'],
  ['form_position','폼위치'],        // 상단 폼 / 하단 폼 어디서 제출했는지
  ['utm_source',   'utm_source'],     // 유입 매체 (naver, google, meta …)
  ['utm_medium',   'utm_medium'],     // 유입 방식 (blog, cpc, post …)
  ['utm_campaign', 'utm_campaign'],   // 캠페인명
  ['utm_term',     'utm_term'],       // 검색 키워드
  ['utm_content',  'utm_content'],    // 광고 소재 구분
  ['referrer',     '유입경로'],        // 직전 페이지
  ['landing_url',  '랜딩URL'],
  ['revisit',      '재방문신청']       // 광고로 들어왔다 나중에 재방문해 신청 = Y
];

/* ---------- 시트 열기 ---------- */

/** TARGETS 항목 하나에 해당하는 시트를 가져옵니다. */
function resolveSheet(target) {
  var ss = SpreadsheetApp.openById(target.spreadsheetId);
  if (!target.sheetName) {
    var sheets = ss.getSheets();
    if (!sheets.length) throw new Error('탭이 하나도 없습니다: ' + target.label);
    return sheets[0];
  }
  var sheet = ss.getSheetByName(target.sheetName);
  if (!sheet) sheet = ss.insertSheet(target.sheetName);
  return sheet;
}

/* ---------- 엔트리포인트 ---------- */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);   // 동시 제출 시 줄 밀림 방지
  try {
    var data = JSON.parse(e.postData.contents);
    var results = writeAll(data);

    // 한 곳이라도 성공했으면 ok. 두 곳 다 실패해야 ok:false.
    var okCount = 0;
    for (var i = 0; i < results.length; i++) if (results[i].ok) okCount++;
    return json({ ok: okCount > 0, saved: okCount, total: results.length, results: results });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 데이터 한 건을 TARGETS 의 모든 시트에 기록합니다.
 * 한 곳이 실패해도 나머지는 계속 진행합니다(리드 유실 방지).
 */
function writeAll(data) {
  var results = [];
  for (var i = 0; i < TARGETS.length; i++) {
    var t = TARGETS[i];
    try {
      var rowNum = writeRow(resolveSheet(t), data);
      results.push({ target: t.label, ok: true, row: rowNum });
    } catch (err) {
      results.push({ target: t.label, ok: false, error: String(err) });
    }
  }
  return results;
}

/** 데이터 한 건을 지정한 시트 맨 아래에 기록하고, 기록된 행 번호를 돌려줍니다. */
function writeRow(sheet, data) {
  var header = ensureHeader(sheet);

  // 열 이름 → 위치 로 찾아 넣으므로, 시트에서 열을 옮겨도 안 밀립니다.
  var row = new Array(header.length).fill('');
  COLUMNS.forEach(function (col) {
    var idx = header.indexOf(col[1]);
    if (idx === -1) return;
    row[idx] = format(data[col[0]]);
  });

  // 셀 서식을 '텍스트'로 지정한 뒤 기록.
  // 이렇게 안 하면 캠페인명 '0720' → 720, 전화번호 '010-...' 등이
  // 숫자/날짜로 자동 변환되며 앞자리 0이 잘립니다.
  var rowNum = sheet.getLastRow() + 1;
  var range = sheet.getRange(rowNum, 1, 1, row.length);
  range.setNumberFormat('@');
  range.setValues([row]);
  return rowNum;
}

/**
 * 헤더 행을 확인해서, COLUMNS 에 있는데 시트에 없는 열은 오른쪽에 자동으로 추가합니다.
 * → 나중에 항목을 늘려도 시트를 손댈 필요가 없습니다.
 * ※ 기존 '위약금 랜딩 DB' 시트에는 '월납입료' 열이 남아 있는데, 건드리지 않고
 *   '이용기간'·'폼위치' 열만 오른쪽에 새로 붙습니다(과거 데이터 보존).
 */
function ensureHeader(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var header = sheet.getLastRow() === 0
    ? []
    : sheet.getRange(1, 1, 1, width).getValues()[0].map(function (v) { return String(v).trim(); });

  // 뒤쪽 빈 칸 제거
  while (header.length && header[header.length - 1] === '') header.pop();

  var missing = COLUMNS.map(function (c) { return c[1]; })
                       .filter(function (title) { return header.indexOf(title) === -1; });

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

function format(v) {
  if (v === true || v === 'on') return 'Y';   // 체크박스는 'on' 으로 들어옴
  if (v === false) return 'N';
  return v == null ? '' : String(v);
}

/**
 * 브라우저로 /exec 주소를 열었을 때 배포 확인용.
 * 두 저장 위치가 각각 정상인지, 몇 줄 쌓였는지 보여줍니다.
 * (리드 내용은 노출하지 않고 개수만 알려줍니다.)
 */
function doGet() {
  var out = [];
  for (var i = 0; i < TARGETS.length; i++) {
    var t = TARGETS[i];
    try {
      var sheet = resolveSheet(t);
      out.push({
        target: t.label,
        ok: true,
        spreadsheet: sheet.getParent().getName(),
        sheet: sheet.getName(),
        rows: Math.max(sheet.getLastRow() - 1, 0),   // 헤더 제외한 데이터 줄 수
        columns: sheet.getLastColumn()
      });
    } catch (err) {
      out.push({ target: t.label, ok: false, error: String(err) });
    }
  }
  return json({ ok: true, targets: out });
}

/**
 * 에디터에서 직접 실행하는 테스트용 함수.
 * 실행하면 두 저장 위치에 '테스트' 라고 표시된 행이 1줄씩 들어갑니다. 확인 후 지우세요.
 */
function testWrite() {
  var results = writeAll({
    submitted_at:  new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    name:          '테스트',
    phone:         '010-0000-0000',
    current_car:   '테스트차량',
    use_period:    '1년~2년',
    want_new:      '희망',
    message:       '에디터 testWrite 실행 — 확인 후 삭제하세요',
    agree:         'Y',
    form_position: '테스트',
    landing_url:   'https://pbrent-new.vercel.app/'
  });
  Logger.log(JSON.stringify(results, null, 2));
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
