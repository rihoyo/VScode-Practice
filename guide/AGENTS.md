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
│  ├─ shared/             모든 페이지 공용: site-ui.css(메뉴·검색 패널), glossary.css/js(설명창), cursor.css/js(마우스 포인터), site-nav.js, keywords.js
│  ├─ vscode/             VS Code 공부 세트: guide.css, guide-ui.css, guide.js, guide-map.js(기술 연결 지도)
│  ├─ linux/              리눅스: linux.css, linux.js, linux-viz.js(스캔 뷰포트), linux-mode.js(계열 전환 연출), lab-shell.js(가상 셸 엔진), lab-theatre.js(느린 명령의 연출 계획), lab.js(따라하기 화면·재생)
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
- **리눅스 따라하기 실습**: 실습 내용은 `data/linux-lab.js`에서 고쳐. 단계마다 `cmd`(입력할 명령, 계열별이면 `{ deb, rh }`), `say`(설명), `ok`(해설)를 쓰고, 실패해야 정상인 단계는 `fails: true`를 달아. `npm run check`가 모든 단계를 두 계열 모두에서 시뮬레이터로 실행해 성공 여부를 확인해. 새 명령어가 필요하면 `assets/linux/lab-shell.js`에 추가해. 오래 걸리는 명령(apt·dnf·ping)은 `assets/linux/lab-theatre.js`가 "연결 중 → 한 줄씩 → 진행 막대·점 도는 대기" 연출 계획을 만들고 `lab.js`가 재생해(재생 중 Enter·Ctrl+C·Esc는 건너뛰기, 일반 명령은 즉시 출력). 연출은 글자를 바꾸지 않고 시간만 더하며, 새 느린 명령은 theatre의 `SLOW`와 규칙에 추가해. 실습 상태는 메모리에만 있어서 새로고침하면 사라지고, 이 사실은 페이지에 항상 적어 둬. 시뮬레이터에서 성공한 것은 실제 환경에서 마스터가 확인하기 전에는 완료로 표시하지 않아.
- **메인 페이지(루트 `index.html`)**: 맨 처음 열리는 진짜 메인이야. 코드 비가 쏟아지고 마우스 자리에 ASCII 아트 블랙홀(그림자, 광자 고리, 휘어진 빛, 강착 원반)이 떠. 블랙홀 글자는 안정적으로 유지하고, 바탕에 깔린 실제 글자 칸은 세계 좌표에 고정돼 있다가 블랙홀이 가까워지면 칸마다 다른 시점에 하나씩 떨어져 나와 중력과 소용돌이로 서서히 끌려가(삼켜진 자리는 몇 초 뒤 다시 생겨나고, 포인터가 멀어지면 제자리로 돌아가). 코드 비는 그대로 두고 블랙홀 쪽으로 살짝 휘어지기만 해. 이 물리는 `home.js`의 `physics()`에 있어. 클릭·드래그하면 그 지점으로 모든 글자가 처음엔 천천히 갈수록 기하급수로 빨려 들고(약 2.6초), 글자가 빠르게 뒤바뀌다가 제목과 선택 카드가 블랙홀에서 변형되며 튀어나와(화면이 끊기지 않게 겹쳐). 선택 카드는 `data/sites.js`로 자동 생성돼. 같은 탭에서 한 번 본 뒤에는 바로 선택 화면으로 가고(`?intro=1`로 다시 봐), 모션 줄이기 설정이면 연출 없이 선택 화면이야. 연출 시간은 `home.js` 맨 위의 `COLLAPSE`, `EMERGE`로 조절해. 개발 중에는 콘솔에서 `__homePreview(0.5)`(0~1 빨려드는 구간), `__homePreview(1.3)`(1~2 튀어나오는 구간)로 원하는 순간을 멈춰 볼 수 있어. 마우스 포인터는 모든 페이지 공용이야(아래 항목). 각 페이지의 드롭다운 맨 위 `메인` 항목이 여기로 돌아와.
- **마우스 포인터**: `assets/shared/cursor.js`·`cursor.css`가 맡아. 화살표는 마스터가 고른 이미지(assets/home/cursor@2x.png를 cursor.css에 base64로 넣어 마스크로 쓰고 테마 색으로 칠함, 끝점이 클릭 지점)고, 마름모 고리와 함께 포인터에 지연 없이 붙어. 이미지를 바꾸면 tools의 make-cursor.js로 PNG를 만든 뒤 cursor.css의 --arrow 값을 새 base64로 바꿔. 색은 페이지의 `--accent`(메인 페이지는 먹색+붉은 고리)를 읽어 테마와 리눅스 계열 전환에 맞춰 바뀌어. 동작: 링크·버튼 확장, 용어 위 `?`, 지도 위 잡기, 누름 수축+파문, 드래그하면 범위 지정 상자로 변신(크기 표시), 로딩과 페이지 이동 중에는 정렬 막대와 알고리즘 이름이 떠올라. 코드에서는 `Cursor.busy(true, '이유')`로 로딩 연출을 켜고 `false`로 꺼. 입력칸 위에서는 기본 글자 커서를 쓰고, 터치 기기에서는 동작하지 않아. 모서리는 각지게 하고 transform·opacity만 움직여. site-nav.js가 자동으로 불러오고 메인 페이지는 index.html이 직접 불러와.
- **페이지 전환 연출**: 다른 메인 페이지(메인·VS Code 공부·리눅스·네트워크·키워드)로 가는 링크를 누르면 `assets/shared/transition.js`가 화면 전체에 코드 글자를 한꺼번에 띄워 난수로 계속 뒤바꾸고, 도착 페이지 색이 서서히 번져(디졸브) 덮어(약 0.31초). 새 페이지는 같은 장막으로 시작해 글자가 무작위로 꺼지고 색이 걷히며 드러나(약 0.38초). 색 번짐은 WAAPI(합성 스레드)라 로딩 중에도 멈추지 않고, 글자는 글자 판에서 찍어 초당 약 24번만 그려. 첫 화면이 그려지기 전에 장막을 올려야 해서 이 파일은 모든 페이지 <head>에서 defer 없이 불러와(`npm run check`가 순서를 검사해). 같은 사이트 안 탭, 새 탭, 해시 이동, 모션 줄이기에서는 쓰지 않아. 시간은 `OUT`, `IN`, `TICK`, 색과 명령 문구는 `THEMES`.
