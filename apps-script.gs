/****************************************************************
 * 장기렌트 전환 상담 — 구글시트 수신 스크립트 (Apps Script)
 *
 * [설치 방법]
 * 1. 만들어둔 구글 스프레드시트 열기
 * 2. 상단 메뉴 [확장 프로그램] → [Apps Script]
 * 3. 기본 코드(function myFunction...) 전체 삭제 후 이 파일 내용을 통째로 붙여넣기 → 저장
 * 4. 우측 상단 [배포] → [새 배포] → 톱니바퀴 → 유형 "웹 앱"
 *      - 설명: 아무거나 (예: v1)
 *      - 다음 사용자로 실행: 나
 *      - 액세스 권한이 있는 사용자: "모든 사용자"   ← ★이거 꼭★
 *    → [배포] → 권한 승인(안전하지 않음 → 계속) → 나오는
 *      https://script.google.com/macros/s/.../exec 주소 복사
 * 5. index.html 의  var SHEET_WEBAPP_URL = '';  안에 그 주소 붙여넣기
 *
 * ※ 코드를 수정하면 반드시 [배포] → [배포 관리] → 연필 → 버전 "새 버전" → 배포
 *    (새로 배포 안 하면 반영 안 됩니다. 주소는 그대로 유지됩니다.)
 ****************************************************************/

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
  ['monthly_fee',  '월납입료'],
  ['want_new',     '신차변경희망'],
  ['message',      '문의내용'],
  ['agree',        '개인정보동의'],
  ['utm_source',   'utm_source'],     // 유입 매체 (naver, google, meta …)
  ['utm_medium',   'utm_medium'],     // 유입 방식 (blog, cpc, post …)
  ['utm_campaign', 'utm_campaign'],   // 캠페인명
  ['utm_term',     'utm_term'],       // 검색 키워드
  ['utm_content',  'utm_content'],    // 광고 소재 구분
  ['referrer',     '유입경로'],        // 직전 페이지
  ['landing_url',  '랜딩URL'],
  ['revisit',      '재방문신청']       // 광고로 들어왔다 나중에 재방문해 신청 = Y
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);   // 동시 제출 시 줄 밀림 방지
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
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

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 헤더 행을 확인해서, COLUMNS 에 있는데 시트에 없는 열은 오른쪽에 자동으로 추가합니다.
 * → 나중에 항목을 늘려도 시트를 손댈 필요가 없습니다.
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

// 브라우저로 /exec 주소를 열었을 때 배포 확인용
function doGet() {
  return ContentService.createTextOutput('OK - lead endpoint is live');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
