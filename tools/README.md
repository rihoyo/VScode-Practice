# tools

가이드 홈페이지를 관리하는 Node.js 도구 모음이다. 홈페이지 자체는 서버 없이 열리므로, 이 폴더는 **수정하고 검사할 때만** 쓴다.

## 폴더에 있는 것

| 파일 | 역할 |
| --- | --- |
| `package.json` | 명령어와 의존성(d3 7.9.0)을 적은 파일. 사람이 직접 고치는 파일이다 |
| `package-lock.json` | 설치된 정확한 버전 기록. 자동 생성되며 수정하지 않는다. 커밋한다 |
| `check.js` | 가이드 검사. 지도 데이터, 문법, 링크와 앵커, 공용 파일 연결, 용어 사전, 리눅스 실습 단계(시뮬레이터 실행), `~다.` 문체, 고딕 폰트를 확인한다 |
| `build-index.js` | 각 페이지의 목차 태그와 본문으로 `guide/data/generated/search-index.js`(키워드 색인)를 만든다. `npm run build`가 함께 실행한다 |
| `build-glossary.js` | `guide/data/glossary/*.json`(용어 사전)을 검사하고 `guide/data/generated/glossary-data.js`로 만든다. 필수 칸 누락, 오타 칸, 중복 용어, 줄임말의 풀네임 누락을 잡는다 |
| `sync-vendor.js` | 받아 둔 d3를 `guide/vendor/`에 복사한다 |
| `node_modules/` | 내려받은 패키지. 용량이 크고 재생성할 수 있어 Git에서 제외한다 |

## 명령어

VS Code 터미널(`` Ctrl+` ``)에서 `tools` 폴더로 이동한 뒤 실행한다.

```bash
cd tools
npm install        # 처음 한 번, 또는 package.json을 고쳤을 때
npm run check      # 가이드를 고친 뒤 커밋하기 전에
npm run build      # 용어 사전·페이지 목차를 고친 뒤, d3 버전을 바꿨을 때
```

저장소 루트에서 바로 실행하려면 `npm --prefix tools run check` 를 쓴다.

## 왜 이렇게 나눴나

- **루트를 깨끗하게 둔다.** 루트에는 문서(md)와 홈페이지 진입 파일(`index.html`)만 둔다.
- **도구와 결과물을 분리한다.** 홈페이지는 `guide/`, 도구는 `tools/`에 있어서 코드 리뷰에서 변경이 어느 쪽인지 바로 보인다.
- **외부 라이브러리는 완성 파일을 커밋한다.** `guide/vendor/d3.min.js`가 저장소에 있으므로, 집 PC에서는 Pull만 하면 `npm`을 몰라도 지도가 움직인다.
- **검사를 자동화한다.** 오타나 깨진 링크는 사람이 눈으로 찾기 어려워서, 리뷰 전에 `npm run check`로 먼저 거른다.
