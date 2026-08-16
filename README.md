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
Special 12개 하위 화면 / Our Future 3탭 / 알림)은 모두 이 새 아키텍처 위에서 동작합니다.
아직 손대지 않은 것들 (다음 세션에서 같은 아키텍처로 이어서 만들면 됩니다):

- 실제 카카오톡 `.txt` export 업로드 → 파싱 → 월별/키워드 통계 (`data/full-chat.js`는
  원본 export가 보관돼 있을 뿐, 아직 파서가 없습니다)
- Relationship Pulse 그래프, 챕터별로 완전히 다른 매거진 비주얼 테마
- 채팅봇(토심이 & 깜자) — 원래도 비활성화 상태였습니다

## 모바일

뷰포트 메타, 반응형 그리드/모달, 44px 이상 터치 영역, iOS 자동 확대 방지(입력창 16px),
노치 대응 safe-area 여백, 하단 고정 네비게이션을 적용했습니다.
