# Emoscape - 감정 기록 앱

## 프로젝트 개요
감정과 신체 감각을 기록하고 시각화하는 React 웹 앱입니다. (PWA 지원)

## 기술 스택
- **빌드**: Vite 6 (`npm run dev` / `npm run build` / `npm run preview`)
- **UI**: React 18 (npm 패키지)
- **시각화**: D3.js v7 (npm 패키지)
- **PWA**: vite-plugin-pwa (Workbox, autoUpdate) — manifest·서비스 워커 자동 생성
- **데이터 저장**: LocalStorage (키: `emotionRecords`, `hiddenModeActive`, `customEmotions`, `themeMode`, `ghToken`, `ghGistId`, `ghUser`) + GitHub Gist 동기화(선택)
- **스타일**: Vanilla CSS (`src/styles.css`) — CSS 변수 기반 디자인 토큰, `[data-theme="dark"]`로 다크 모드
- **UI 패턴**: 모바일(≤768px)은 하단 탭 바, alert/confirm/prompt 금지 → `useDialog()` 훅 사용

## 파일 구조
```
index.html                  Vite 엔트리 (meta, root div)
vite.config.js              Vite + PWA 설정 (manifest 포함)
public/                     PWA 아이콘 (pwa-192/512, maskable, apple-touch-icon, favicon.svg)
src/
├── main.jsx                마운트 + 서비스 워커 등록
├── App.jsx                 메인 앱 (탭, 상태, Gist 동기화)
├── styles.css              전체 스타일
├── constants.js            감정/색상/감각/장소 상수
├── lib/
│   ├── storage.js          LocalStorage 래퍼 (save는 성공 여부 boolean 반환)
│   ├── gistSync.js         GitHub Gist 동기화
│   ├── hidden.js           숨은 키워드 시스템
│   ├── exportImport.js     JSON/CSV 내보내기·가져오기
│   ├── theme.js            테마 모드 (system/light/dark) 적용
│   ├── insights.js         스트릭/주간요약/감정×장소/시간대 통계
│   ├── reminder.js         기록 리마인더 (Notification API, 키: reminderTime/reminderLastFired)
│   └── datetime.js         datetime-local 헬퍼
└── components/
    ├── Dialog.jsx              DialogProvider + useDialog (confirm/prompt/alert 대체)
    ├── QuickRecord.jsx         원탭 빠른 기록 (강도 5 즉시 저장)
    ├── InsightsView.jsx        인사이트 탭 (통계 카드)
    ├── EmotionRecordForm.jsx   기록 폼 (감정·강도·신체 맵)
    ├── RecordsList.jsx         기록 목록 (필터·검색·스켈레톤)
    ├── VisualizationTabs.jsx   시각화 탭 컨테이너
    ├── SineWaveVisualization.jsx / LocationVisualization.jsx
    ├── BodyHeatmap.jsx / LightFlowBody.jsx / CalendarHeatmap.jsx
```

## 코드 수정 규칙
- 컴포넌트는 `src/components/`, 공용 로직은 `src/lib/`에 배치
- LocalStorage 키 이름은 기존 사용자 데이터 호환을 위해 변경 금지
- **색상은 하드코딩 금지** — `src/styles.css`의 CSS 변수(`var(--text)` 등) 사용, 다크 모드 항상 고려
- D3 차트에서 테마 색이 필요하면 `.attr()` 대신 `.style('fill', 'var(--...)')` 사용 (attr은 CSS 변수 미지원)
- `alert/confirm/prompt` 사용 금지 — `useDialog()`의 `confirmDialog/promptDialog/alertDialog` 사용
- 변경 후 `npm run build`로 빌드 확인
- 커밋 메시지는 한국어로 작성

## Git 정보
- 작업 브랜치: `claude/emotion-tracking-app-v05xgb`
- push 명령어: `git push -u origin claude/emotion-tracking-app-v05xgb`
