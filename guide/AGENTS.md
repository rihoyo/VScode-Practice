# guide 에이전트

「나의 개발 스텝」 홈페이지(`guide/`)와 Node.js 도구(`tools/`)를 맡아. 이 두 폴더 밖은 고치지 마.

- `guide/vscode-guide.html`에서 진행 상태를 확인해. 개념과 실습은 `git.html`, `github.html`, `vscode.html`에 기록하고, 다른 도구의 개념을 참조할 때는 해당 항목으로 링크해. 드롭다운(머리말 왼쪽 위, 스크롤하면 위쪽 고정 메뉴바 왼쪽)은 서로 다른 메인 페이지(VS Code 공부·리눅스·네트워크)로 이동하는 용도고, 개요·Git·GitHub·VS Code 같은 사이트 안 메뉴는 머리말 탭과 고정 메뉴바 탭에 둬. 현재 페이지 목차는 오른쪽에 둬.
- **설명문은 `~다.` 문체로 써.** 대화는 평소 말투를 유지하되 이 폴더 안의 문장과 지도 데이터는 `~다.`로 끝내. 같은 제목을 반복하지 말고 연속 항목은 `1.`, `2.` 번호로 구분해. 섹션에는 항상 `id`를 달아.
- 새 기술이나 연결을 배우면 `data/map-data.js`의 `NODES`와 `EDGES`에 추가해 개요의 기술 연결 지도에 반영해. 마스터가 확인한 연결만 `status: 'done'`으로 표시해.
- 고친 뒤에는 `tools` 폴더에서 `npm run check`를 실행해. 링크, 문체, 폰트, 지도 데이터, 에이전트 목록의 경로를 검사해 줘.
- VS Code 공부 세트의 디자인은 다크 모드 개발자 느낌이고, 모서리는 모든 페이지에서 각지게 해. 폰트는 고딕만 써. 바탕·명조 계열은 금지고, 모노스페이스 스택에도 한글 고딕 폴백을 넣어.
- 홈페이지는 서버 없이 브라우저에서 로컬 HTML로 열려야 해. 외부 라이브러리는 완성 파일을 `vendor/`에 커밋해 둬.
- **메인 페이지(사이트)는 색만이 아니라 레이아웃까지 새로 디자인해.** VS Code 공부 세트는 `assets/vscode/guide.css`, 리눅스는 `assets/linux/linux.css`·`linux-viz.js`(근흑 바탕·인광 초록·모서리 괄호 패널·스캔 뷰포트), 네트워크는 `assets/network/network.css`·`network-field.js`(전면 실시간 관계 그래프 위의 밝은 기술 문서)를 쓰고, 새 메인 페이지는 자기 CSS를 따로 만들어. 공용 메뉴 스타일은 `assets/shared/site-ui.css`가 맡고 색은 각 CSS의 변수로 정해.
- **등록**: 새 메인 페이지는 `data/sites.js`의 `sites`에, 메인 페이지 안의 새 페이지는 해당 사이트의 `pages`에 추가해. 머리말에 `<div class="sitenav">`를 두고 목차에 `data-toc`와 링크별 `data-tags`를 달아. 그다음 `tools`에서 `npm run build`로 키워드 색인을 다시 만들어. 낡으면 `npm run check`가 알려 줘.
- 키워드 검색은 머리말 오른쪽의 `키워드 검색` 버튼(누르면 입력칸 + 이 페이지 태그·전체 태그, 입력하면 관련 키워드·섹션을 바로 표시)과 고정 메뉴바 검색칸이 같은 패널을 쓰고, 옆에 `전체 키워드` 버튼을 둬. 목차 칸에는 입력칸 없이 그 페이지의 태그 토글만 둬. 고정 메뉴바 표시는 `site-nav.js`가 모든 페이지에서 맡아.
- **리눅스 계열 모드**: `linux.html`은 `<html data-mode>`(mix·deb·rh)로 색과 내용을 바꿔. 내용은 `data-m="deb mix"`처럼 보일 모드를 적어 두고, 색은 `linux.css`의 `:root[data-mode]` 변수가 정해. 전환 스위치는 `assets/shared/site-nav.js`가 머리말과 고정 메뉴바에 넣고, 연출은 `assets/linux/linux-mode.js`(0.45초 안)가 맡아. 새 리눅스 내용은 두 계열 모두 `data-m`으로 나눠 써.
- **용어 설명창**: 용어는 `data/glossary/*.json`에 항목(`match`, `name`, `say`, `full`, `literal`, `desc`)으로 등록해. `match`는 찾을 글자, `say`는 한글 발음, 줄임말이면 `full`(풀네임)과 `literal`(직역)가 꼭 필요하고, `desc`는 `~다.` 한 줄 뜻이야. 고친 뒤 `npm run build`로 `data/generated/glossary-data.js`를 다시 만들어. 칸이 비거나 겹치면 `npm run check`가 알려 줘. 엔진은 `assets/shared/glossary.js`고 데이터는 거기 두지 마. 본문에서는 용어를 길게 풀어 쓰지 말고 용어 중심으로 짧게 써.

## 폴더 구조 (어디를 고치면 되나)

```
guide/
├─ *.html                 글 내용 층. 페이지마다 한 파일. 목차(data-toc, data-tags)와 본문
├─ assets/                화면을 만드는 코드 층
│  ├─ shared/             모든 페이지 공용: site-ui.css(메뉴·검색 패널), glossary.css/js(설명창), site-nav.js, keywords.js
│  ├─ vscode/             VS Code 공부 세트: guide.css, guide-ui.css, guide.js, guide-map.js(기술 연결 지도)
│  ├─ linux/              리눅스: linux.css, linux.js, linux-viz.js(스캔 뷰포트), linux-mode.js(계열 전환 연출), lab-shell.js(가상 셸 엔진), lab.js(따라하기 화면)
│  └─ network/            네트워크: network.css, network.js(서브넷 계산기), network-field.js(배경 그래프)
├─ data/                  사람이 고치는 데이터 층
│  ├─ sites.js            메인 페이지와 하위 페이지 목록(드롭다운·탭·키워드 페이지가 읽는다)
│  ├─ map-data.js         기술 연결 지도의 노드와 연결
│  ├─ linux-lab.js        리눅스 따라하기 실습(가상 파일, 단계별 명령과 해설)
│  ├─ glossary/*.json     용어 사전(network, linux, dev). 용어 추가·수정은 여기
│  └─ generated/          npm run build가 만드는 파일. 직접 고치지 않는다(search-index.js, glossary-data.js)
└─ vendor/                받아 둔 외부 라이브러리(d3)
```

- 무엇을 바꾸는지에 따라 층이 나뉜다. 글 수정은 html, 모양 수정은 `assets/`, 목록·용어·지도 수정은 `data/`다.
- 모든 페이지는 `<head>`에서 공용 묶음을 같은 순서로 불러온다(site-ui.css, glossary.css, search-index.js, glossary-data.js, sites.js, site-nav.js, glossary.js). 새 페이지는 기존 페이지의 머리말을 복사해 만들고, 빠지거나 순서가 틀리면 `npm run check`가 알려 준다.
- 사이트 전용 코드는 그 사이트 폴더 안에서만 고치고, 두 사이트 이상이 쓰면 `assets/shared/`로 옮긴다.
- **리눅스 따라하기 실습**: 실습 내용은 `data/linux-lab.js`에서 고쳐. 단계마다 `cmd`(입력할 명령, 계열별이면 `{ deb, rh }`), `say`(설명), `ok`(해설)를 쓰고, 실패해야 정상인 단계는 `fails: true`를 달아. `npm run check`가 모든 단계를 두 계열 모두에서 시뮬레이터로 실행해 성공 여부를 확인해. 새 명령어가 필요하면 `assets/linux/lab-shell.js`에 추가해. 실습 상태는 메모리에만 있어서 새로고침하면 사라지고, 이 사실은 페이지에 항상 적어 둬. 시뮬레이터에서 성공한 것은 실제 환경에서 마스터가 확인하기 전에는 완료로 표시하지 않아.
