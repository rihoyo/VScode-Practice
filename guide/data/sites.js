/* 사이트(메인 페이지)와 그 안의 페이지 목록, 키워드 페이지 정보.
 * 새 메인 페이지는 sites에 한 항목을, 메인 페이지 안의 새 페이지는 해당 사이트의 pages에 한 줄을 추가한다.
 * site-nav.js(메뉴)와 keywords.js(키워드 페이지)가 이 값을 읽고, tools의 npm run check가 실제 파일과 맞는지 검사한다. */
window.SITE_CONFIG = {
  keywords: { href: 'keywords.html', name: '키워드' },
  sites: [
    { id: 'vscode', name: 'VS Code 공부', d: '개요 · Git · GitHub · VS Code 실습 기록', c: '#4ade80', pages: [
      { href: 'vscode-guide.html', name: '개요' },
      { href: 'git.html', name: 'Git' },
      { href: 'github.html', name: 'GitHub' },
      { href: 'vscode.html', name: 'VS Code' },
      { href: '3d-test.html', name: '3D 테스트' },
      { href: 'code-test.html', name: '코드 테스트' },
    ] },
    { id: 'linux', name: '리눅스', d: 'OS 이해하기 · 터미널로 보는 노트', c: '#e95420', pages: [
      { href: 'linux.html', name: '리눅스 홈' },
    ] },
    { id: 'network', name: '네트워크', d: '구조 설계와 자격 시험 · 도면으로 보는 노트', c: '#1d6fb8', pages: [
      { href: 'network.html', name: '네트워크 홈' },
    ] },
    { id: 'ai', name: 'AI', d: 'Claude Code · Codex 사용법, 컨텍스트와 하네스, 실습과 플랜 비교', c: '#e9855f', pages: [
      { href: 'ai.html', name: 'AI 홈' },
    ] },
  ],
};
