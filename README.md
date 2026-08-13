# 300 Days With You

시현 ♥ 강원, 뉴욕에서 시작된 날들을 기록하는 둘만의 다이어리 웹앱입니다.

## 구조

```
index.html              앱 전체 (마크업 + 스타일 + 로직)
assets/
  fonts/griun-mongtori.ttf   커스텀 손글씨 폰트
  audio/bgm.mp3              배경음악
data/
  curated-chat.js            타임라인에 쓰이는 큐레이션 대화 기록 (window.CURATED_CHAT_DATA)
```

원래 파일 하나에 폰트·음악·대화 데이터가 base64로 통째로 박혀있어 22MB가 넘었습니다.
git에 올리기 무겁고 diff도 못 보게 되므로, 바이너리/데이터는 `assets/`, `data/`로 빼고
`index.html`은 그걸 참조만 하도록 정리했습니다. 이제 `index.html`은 약 300KB입니다.

## 실행 방법

정적 파일이라 별도 빌드가 필요 없습니다. 루트에서 아무 정적 서버로 열면 됩니다.

```bash
python3 -m http.server 8000
# http://localhost:8000 접속
```

`file://`로 직접 열어도 대부분 동작하지만, Firebase 사진 업로드는 브라우저 보안 정책상
`http://` 또는 `https://`로 서빙해야 안정적으로 동작합니다. 실제 배포는 GitHub Pages를
추천합니다 (Settings → Pages → Deploy from branch → `main` / `root`).

## 잠금 화면

첫 화면 비밀번호는 `index.html` 안 `PASSCODE` 상수로 설정되어 있습니다
(클라이언트 코드에 그대로 노출되므로 진짜 보안이 아니라 "가볍게 가리는" 용도입니다).

## 사진·메모를 시현/강원이 함께 보는 방법 (Firebase)

이 앱은 로컬 저장(localStorage)이 아니라 Firebase(Firestore + Storage)를 공용 저장소로
씁니다. 즉 시현과 강원이 각자 폰/PC에서 같은 배포 URL로 접속해서 같은 Firebase 프로젝트를
바라보면, 한쪽이 올린 사진·메모·즐겨찾기가 다른 쪽에도 실시간으로 보입니다.

`index.html` 상단의 `firebaseConfig`에 이미 실제 프로젝트 값(`days-with-you`)이 채워져
있어 그대로 쓸 수 있습니다. 만약 사진이 한쪽에만 보이고 다른 쪽엔 안 보인다면 대부분
아래 두 가지 중 하나입니다.

1. **Firestore / Storage 보안 규칙**: Firebase 콘솔 → Firestore Database / Storage →
   Rules 에서 두 사람 모두 읽기/쓰기가 가능하게 열려 있는지 확인하세요. (예: 비공개 URL이라
   접근 통제를 앱의 잠금화면에만 맡기는 구조라면 규칙 자체는 `allow read, write: if true;`
   처럼 열어두고, 대신 URL/비밀번호를 외부에 공유하지 않는 방식.)
2. **같은 배포를 보고 있는지**: 두 사람이 서로 다른 버전의 `index.html`(예: 로컬 파일 vs
   배포된 사이트)을 열고 있으면 저장 위치가 갈릴 수 있습니다. 반드시 같은 배포 URL을
   북마크해서 쓰세요.

## 모바일

뷰포트 메타, 반응형 그리드/모달, 44px 이상 터치 영역, iOS 자동 확대 방지(입력창 16px),
노치 대응 safe-area 여백을 적용했습니다. iPhone/Android 브라우저에서 바로 열어 확인할 수
있습니다.
