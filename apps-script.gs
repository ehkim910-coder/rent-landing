/****************************************************************
 * 장기렌트 전환 상담 — 구글시트 수신 스크립트 (Apps Script)
 *
 * [설치 방법]
 * 1. 구글 드라이브에서 새 스프레드시트 생성 (예: "장기렌트 전환 신청 DB")
 * 2. 상단 메뉴 [확장 프로그램] → [Apps Script] 클릭
 * 3. 기본 코드 전체 삭제 후, 이 파일 내용을 통째로 붙여넣기
 * 4. 상단 [배포] → [새 배포] → 유형 "웹 앱"
 *      - 실행 계정: 나
 *      - 액세스 권한: "모든 사용자"
 *    → 배포 후 나오는 https://script.google.com/macros/s/.../exec 주소 복사
 * 5. index.html 의 LEAD_CONFIG.SHEET_WEBAPP_URL 에 그 주소를 붙여넣기
 ****************************************************************/

// 시트에 기록할 열 순서 (원하는 대로 추가/삭제 가능)
var FIELDS = [
  'submitted_at',      // 신청 시각
  'name',              // 이름
  'phone',             // 연락처
  'car',               // 현재 차량명
  'monthly_fee',       // 월 납입료
  'remaining',         // 남은 계약기간
  'switch_intent',     // 신차 전환 희망 여부
  'expected_penalty',  // 예상 위약금(선택)
  'rent_company',      // 렌트사명(선택)
  'hope_car',          // 희망 차량(선택)
  'contact_time',      // 상담 가능 시간(선택)
  'privacy',           // 개인정보 동의
  'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
  'referrer','landing_url','user_agent'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // 첫 실행 시 헤더 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(FIELDS);
    }

    var row = FIELDS.map(function (key) {
      var v = data[key];
      if (v === true) return 'Y';
      if (v === false) return 'N';
      return v == null ? '' : v;
    });
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// (선택) 브라우저로 /exec 주소 열었을 때 동작 확인용
function doGet() {
  return ContentService.createTextOutput('OK - lead endpoint is live');
}
