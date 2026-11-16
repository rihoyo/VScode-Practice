# VScode-Practice
vscode가 익숙해지기까지 필요한 과정 공유<br>
회사에서 처음 구축하고 이후 환경과 상관없이 작업을 이어갈 예정  
참고로 줄바꿈은 `<br>` or `</br>`를 쓰거나 공백 2회를 하고 enter 하면 됨

## 열기

저장소 최상단의 `index.html`을 더블클릭하면 브라우저에서 「나의 개발 스텝」이 열린다. 서버나 설치는 필요 없다.

## 폴더 구성

```text
VScode-Practice/
├─ README.md        프로젝트 소개 (이 문서)
├─ AGENTS.md        AI 공통 작업 규칙 (Claude, Codex가 함께 읽는다)
├─ CLAUDE.md        AGENTS.md를 불러오는 한 줄
├─ index.html       홈페이지 진입점
├─ projects/        에이전트 목록(README.md)과 새 에이전트 템플릿
├─ guide/           홈페이지 원문 + guide 에이전트 규칙(AGENTS.md, STATUS.md, TASKS.md)
├─ docs/blog/       티스토리용 마크다운과 변환 규칙 (blog 에이전트)
└─ tools/           Node.js 도구 (검사, 라이브러리 복사)
```

## 에이전트 구조

이 저장소 하나가 메인(허브)이고, 폴더 하나가 에이전트 하나다. 마스터가 AI에게 `guide: 지도에 노드 추가해줘`처럼 `이름: 지시` 형식으로 말하면, AI는 [projects/README.md](projects/README.md)에서 해당 폴더를 찾아 그 폴더의 규칙, 현황, 지시 대기열만 읽고 작업한다.

## 가이드를 고친 뒤

VS Code 터미널에서 `cd tools` 후 `npm run check`를 실행해 링크, 문체, 폰트, 지도 데이터를 검사한다. 자세한 설명은 [tools/README.md](tools/README.md)에 있다.
