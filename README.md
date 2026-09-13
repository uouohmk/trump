# 별빛 상담실

고해성사실을 닮은 입구에서 시작해, 출생 정보를 입력한 뒤 원하는 이야기를 카드 한 장씩 읽는 무료 상담형 웹앱입니다.

## 이용 흐름

입구 → 출생 정보와 마녀 선택 → 입장 → 커튼 뒤 마녀 등장 → 원하는 운세·질문·궁합·타로 → 상담 끝내기.

로그인과 계정 수집이 없습니다. 입력한 출생 정보·질문·상대 정보·상담 결과는 브라우저 메모리에서만 처리합니다. 서버 전송, 쿠키, localStorage, sessionStorage, IndexedDB 저장은 사용하지 않습니다. 상담 종료, 새로고침, 페이지 이탈 시 입력을 초기화합니다. 과거 기록 조회와 기기 간 동기화는 제공하지 않습니다.

GitHub Pages는 `.github/workflows/pages.yml`로 `codex/consultation-room`의 검증된 정적 빌드를 배포합니다. `npm run build:pages`로 같은 파일을 만들 수 있습니다. 이 빌드에는 서버 API와 DB가 없습니다. `connect-src 'none'`과 `form-action 'none'`으로 입력 전송도 차단합니다. 호스팅 사업자의 일반 접속 로그까지 없어진다는 뜻은 아닙니다.

## 계산과 문장

- `skills/astronomy-astrology`: 기존 스킬과 검증한 Python 계산 코드.
- `lib/engine.js`: 절기 기반 연주·월주, 한국 음양력, 현지 법정시 기준 일주·시주. 검증된 Python 결과 75개와 비교합니다.
- `lib/astronomy.mjs`: Astronomy Engine 2.1.19. 태양 별자리와 천문지도는 실제 황도 좌표로 계산합니다.
- `lib/consultation.js`: 필요한 결과를 주제별 카드 순서로 구성합니다. 태어난 시간을 모르면 시주를 만들지 않고, 경계에서는 후보를 남깁니다.
- `lib/readings.js`: 오행의 관계를 성찰 문장으로 풉니다. 운세 점수나 확률을 만들지 않습니다.
- `lib/fortune.js`: 질문을 연애·일·돈·사람·선택으로 분류하고 오늘 천체와 출생 태양의 주요 각(허용 범위 6도), 사주 일진에 따라 짧은 운세·기대할 일·주의점·행운 아이템을 제공합니다. 정해진 해석 규칙과 문장을 사용하며 자유 생성 AI 답변은 아닙니다.
- `lib/celestial-reading.js`: 천체별 분야·주요 각·출생 시간 불확실성을 구분해 지도 선택과 운세를 연결합니다.
- `lib/saju-guidance.js`: 출생 일간과 당일 천간의 십성으로 일·관계·주의점의 생활 조언을 제공합니다.
- 사주는 천간과 지지 대표 오행의 분포와 일간에서 활용할 점도 풉니다. 오행 개수만으로 용신이나 적성을 단정하지 않습니다.
- 궁합은 나를 포함해 2~6명을 비교합니다. 각 쌍의 일간 오행과 일지 육합·충 관계를 해석하며 상대의 마음·관계의 결말·성공 확률을 단정하지 않습니다.
- 타로는 세 장의 카드 뒷면 중 하나를 고르는 상호작용 뒤 브라우저에서 무작위로 선택한 메이저 아르카나를 보여줍니다. 정방향만 사용하며 결과는 현재 창에서만 보여줍니다.

대운, 진태양시, 상승궁·하우스, 사건 예측은 구현 범위에 포함하지 않습니다. 천문 계산의 정확도와 전통 해석의 예측력은 구분합니다. 문장은 ai-slop-thresher 기준으로 중복·상투어·과잉 설명을 줄였습니다.

## 기존 기록

사용자 요청에 따라 기존 D1 기록은 삭제하지 않았습니다. 기존 Sites의 조회·쓰기 API는 모두 410으로 종료했고 새 UI와 연결하지 않습니다. 기존 DB 바인딩과 마이그레이션은 보존합니다. 신규 상담은 DB에 기록되지 않습니다.

자세한 풀이 범위와 참고 문헌은 [풀이 기준](docs/reading-method.md)에 있습니다.

## 실행

Node.js 24를 권장합니다.

```sh
npm ci
npm test
npm run typecheck
npm run build:pages
npx vite preview --config vite.pages.config.ts --port 5174
```

정적 미리보기는 `http://localhost:5174/trump/`입니다. 서버나 로그인 설정이 필요하지 않습니다. 기존 Sites 주소도 함께 유지하려면 `npm run build`로 서버 껍데기를 빌드합니다. 기존 API는 입력을 읽지 않고 410을 반환합니다. 운영 DB에 추가 마이그레이션이나 삭제를 적용하지 않습니다.

테스트는 계산 경계, 질문·궁합·타로, 네트워크·영구 저장소 없는 계산, 종료된 API의 읽기·쓰기 차단을 검사합니다. 임시 테스트 파일은 `.qa/`에만 만듭니다.

## 자산과 출처

- 상담실 배경: 사용자가 제공한 고해성사실 사진을 참고해 생성한 픽셀 배경.
- 마녀: 사용자 캐릭터를 참고한 얼굴·상반신 표정 시트. 웃음·생각·안심 표정을 카드 내용에 따라 바꿉니다. 원본도 보존합니다.
- [d3-celestial 별자리 좌표와 연결선](https://github.com/ofrohn/d3-celestial): BSD-3-Clause, `public/assets/d3-celestial-LICENSE.txt`. 실제 별자리 모양을 J2000 좌표로 그립니다. 같은 이름의 열대황도궁과 IAU 별자리 경계는 동일하지 않습니다.
- 라이더 웨이트 스미스 타로: Pamela Colman Smith의 공개 영역 원본 22장. 각 원본 링크는 `public/assets/tarot/sources.json`에 보존했습니다.
- [오하아사](https://www.asahi.co.jp/ohaasa/week/horoscope/index.html)는 짧은 일일 운세 형식만 참고했습니다. 방송의 운세 문장·순위·로고를 복제하지 않았습니다.
- 폰트: Neo둥근모, SIL OFL. `public/assets/neodgm-LICENSE.txt`.
- [Astronomy Engine](https://github.com/cosinekitty/astronomy), MIT. `lib/astronomy-LICENSE.txt`.
- [Korean Lunar Calendar](https://github.com/usingsky/korean_lunar_calendar_js), MIT. `public/assets/korean-lunar-calendar-LICENSE.txt`.

서버 저장 데이터와 로컬 테스트 DB, 인증 정보는 Git에 포함하지 않습니다.
