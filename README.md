# 300 Days With You

시현 ♥ 강원, 뉴욕에서 시작된 날들을 기록하는 둘만의 다이어리 웹앱입니다.

## 구조 (전면 재구축)

이 앱은 더 이상 `index.html` 하나에 모든 걸 박아넣고 v24~v40 패치를 계속 덧씌우는
구조가 아닙니다. 하나의 라우터와 하나의 공용 데이터 계층으로 처음부터 다시 만들었습니다.

```
index.html              앱 셸 (마크업만 — 로직/스타일 없음)
css/main.css             디자인 시스템 전체
js/
  data.js                 실제 연애 기록 데이터 (EVENTS, FIRSTS, WORDS, 질문 등)
  kakaoparse.js            카카오톡 .txt export 파서 (브라우저에서만 동작, 집계만 저장)
  firebase.js              공용 데이터 계층 — 모든 화면이 이 모듈로만 Firestore에 접근
  store.js                  로컬 identity/PIN/설정 (localStorage)
  router.js                  단일 delegated click 라우터 (data-action 기반, inline onclick 없음)
  app.js                    부트스트랩 (잠금 화면 → identity → 앱 시작)
  views/
    home.js ourdays.js diary.js memory.js ourstory.js
    album.js special.js future.js notifications.js
sw.js                    PWA 서비스 워커
manifest.webmanifest      PWA 매니페스트
assets/
  fonts/griun-mongtori.ttf   커스텀 손글씨 폰트
  audio/bgm.mp3              배경음악
data/
  full-chat.js              카카오톡 원본 export (참고용, 앱에서 로드하지 않음)
```

모든 클릭 가능한 요소는 실제 `<button>` + `data-action` 속성이고, `js/router.js`의
문서 단위 delegated listener **하나**만 이벤트를 처리합니다. inline `onclick`,
중복 `pointerdown`/`pointerup`/`click` 레이어는 이 코드베이스에 없습니다.

## 실행 방법

정적 파일이라 별도 빌드가 필요 없습니다.

```bash
python3 -m http.server 8000
# http://localhost:8000 접속
```

## 잠금 화면 / 신원 확인

첫 화면 비밀번호는 `js/data.js`의 `PASSCODE` 상수입니다. 잠금 해제 후 시현/강원 중
한 명을 고르고 4자리 PIN을 설정합니다. PIN은 원문이 아니라 PBKDF2(SHA-256) 해시로
Firestore `pins` 컬렉션에 저장되어, 어느 기기에서 접속해도 같은 PIN으로 검증됩니다.

## 사진·메모를 시현/강원이 함께 보는 방법 (Firebase)

Firestore를 공용 저장소로 씁니다. `js/firebase.js` 상단의 `firebaseConfig`에 이미
실제 프로젝트 값(`days-with-you`)이 채워져 있습니다. Storage(Blaze 요금제)는 쓰지
않고, 사진은 클라이언트에서 리사이즈한 뒤 Firestore 문서에 base64로 저장합니다
(문서당 1MB 제한 — 원본 프레이밍/구도는 그대로 두고 용량만 줄입니다).

Firestore 보안 규칙은 두 사람 모두 읽기/쓰기가 가능하게 열려 있어야 합니다.

## 지금 구현된 범위 / 백로그

핵심 화면(잠금 → identity → Home / Our Days / Diary / Memory Detail / Photo Album /
Special 15개 하위 화면 / Our Future 3탭 / 알림)은 모두 이 새 아키텍처 위에서 동작합니다.

- **카카오톡 `.txt` import** (Special → KAKAO IMPORT): 카카오톡 채팅방 설정 →
  대화 내용 내보내기로 받은 `.txt`를 올리면 브라우저에서만 파싱합니다. 원문 메시지는
  어디에도 업로드하지 않고, 월별/화자별/단어별 집계 숫자만 Firestore `kakao_stats`
  문서에 저장해서 US BY THE NUMBERS와 RELATIONSHIP PULSE가 그 값을 씁니다. 업로드
  전에는 예전 사이트에서 이관한 기준값(`BASELINE_STATS`/`PULSE_BASELINE`)을 보여줍니다.
  두 가지 내보내기 형식(모바일 `[이름] [오후 3:45] 텍스트` + 날짜 헤더, 데스크톱
  `2025. 1. 1. 오후 3:45, 이름 : 텍스트`)을 인식합니다.
- **RELATIONSHIP PULSE**: 월별 애정 표현 / 긴장 표현(‰) SVG 라인 그래프. 긴장 지표는
  실제 다툰 횟수가 아니라 heuristic이라고 화면에 명시했습니다.
- **챕터별 매거진 테마**: Memory Detail이 뉴욕/센트럴파크/서부/한국/롱디 5개 챕터마다
  다른 배경 색조 + masthead 문구("NEW YORK FIELD NOTES" 등) + tagline을 보여줍니다.

아직 손대지 않은 것 (의도적으로 제외): 챗봇(토심이 & 깜자) — 원본 기획서에서도
"새 rebuild 기본 기능에서 제외, 나중에 검색 기반 Ask Our Archive로" 라고 명시돼 있습니다.

이후 예전 사이트(git 히스토리 `ed691a3`)와 다시 대조해서 실제로 있었지만 빠졌던 것들도
마저 옮겼습니다:

- **Global Memory Search** (헤더 ⌕ 버튼): 날짜/제목/스토리/카톡/사진 메타데이터/메모를
  가로질러 검색.
- **OUR NEW YORK 실제 지도**: 예전 사이트의 실제 위경도(NYC_PINS)를 그대로 옮겨 Leaflet
  지도로 렌더링. CDN을 못 불러오는 환경에서는 카드 목록으로 자동 대체됩니다.
- **HOME 인용구 로테이션**, **메모리 상세 안의 연관 기억 링크**(V7_STORY_LINKS),
  **MINI AWARDS** 실제 4개 카테고리 + "가장 뉴욕다웠던 날" 보너스 카드,
  **Before/Came True** 3쌍 전부, **Cities We Shared** 11개 전체(날짜 없는 곳 포함),
  **300 DAYS OF 고마워** 검색 가능한 감사 아카이브.

## 모바일

뷰포트 메타, 반응형 그리드/모달, 44px 이상 터치 영역, iOS 자동 확대 방지(입력창 16px),
노치 대응 safe-area 여백, 하단 고정 네비게이션을 적용했습니다.
