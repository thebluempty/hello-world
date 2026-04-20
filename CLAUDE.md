# Emoscape v1.0 - 감정 기록 앱

## 프로젝트 개요
감정과 신체 감각을 기록하고 시각화하는 단일 페이지 웹 앱입니다.

## 기술 스택
- **파일 구조**: 단일 파일 (`index.html`) — 빌드 도구 없음
- **UI**: React 18 (CDN), JSX (Babel Standalone으로 실시간 변환)
- **시각화**: D3.js v7
- **데이터 저장**: LocalStorage (서버 없음)
- **스타일**: Vanilla CSS (`<style>` 태그 내부)

## 파일 구조
```
index.html
├── <head>      라이브러리 CDN 로딩 (1~10줄)
├── <style>     CSS 전체 (11~430줄 내외)
├── <script>    React 컴포넌트 + 로직 (430줄~끝)
└── <div id=root> React 마운트 포인트
```

## 주요 기능
1. **감정 기록**: 감정 선택, 강도 슬라이더, 신체 감각 입력
2. **신체 부위 버튼**: 그리드 레이아웃으로 신체 부위 선택 (왼쪽/오른쪽 구분)
3. **기록 목록**: 저장된 감정 기록 조회 및 삭제
4. **시각화**: D3.js로 감정 사인파 차트 렌더링

## 핵심 React 상태 변수
- `selectedEmotions` - 선택된 감정 목록
- `emotionIntensities` - 감정별 강도 (1~10)
- `bodySensations` - 신체 감각 기록 목록
- `emotionRecords` - 전체 저장 기록 (LocalStorage 연동)
- `activeTab` - 현재 활성 탭 (record/list/visualize)

## 코드 수정 규칙
- **절대 새 파일 생성 금지** — index.html 하나만 수정
- CSS는 `<style>` 태그 안, JS/JSX는 `<script type="text/babel">` 안에 작성
- 변경 후 반드시 git commit & push (`claude/emotion-tracking-app-qigYm` 브랜치)
- 커밋 메시지는 한국어로 작성

## Git 정보
- 브랜치: `claude/emotion-tracking-app-qigYm`
- 원격: `origin`
- push 명령어: `git push -u origin claude/emotion-tracking-app-qigYm`

## 접속 링크
```
https://rawcdn.githack.com/thebluempty/hello-world/claude/emotion-tracking-app-qigYm/index.html
```
