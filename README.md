# 별빛 상담실

고해성사실을 닮은 입구에서 시작해, 출생 정보를 저장한 뒤 원하는 이야기를 카드 한 장씩 읽는 무료 상담형 웹앱입니다.

## 이용 흐름

입구 → 상담 준비 → ChatGPT 로그인 → 출생 정보와 마녀 선택 → 저장하고 입장 → 커튼 뒤 마녀 등장 → 직접 질문 또는 별자리·오늘의 운세·일·사주·타로·궁합 선택 → 마녀의 표정과 답변에 따라 다음 카드.

입장 전에는 배경과 타이틀, 버튼만 보입니다. 입력 항목과 결과, 시계, 퀘스트를 미리 노출하지 않습니다. 계산 조건과 시간 정보는 ‘내 기록’의 접힌 설명에 있습니다. 한국 시간 자정에 오늘의 카드가 바뀌며, 화면을 다시 열거나 포커스가 돌아올 때도 날짜를 확인합니다.

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
- 타로는 세 장의 카드 뒷면 중 하나를 고르는 상호작용 뒤 서버에서 무작위로 선택한 메이저 아르카나를 보여줍니다. 정방향만 사용하며 뽑은 결과를 저장합니다.

대운, 진태양시, 상승궁·하우스, 사건 예측은 구현 범위에 포함하지 않습니다. 천문 계산의 정확도와 전통 해석의 예측력은 구분합니다. 문장은 ai-slop-thresher 기준으로 중복·상투어·과잉 설명을 줄였습니다.

## 로그인과 온라인 저장

Sites의 ChatGPT 인증과 D1을 사용합니다. 브라우저가 전달한 사용자 ID를 신뢰하지 않고 서버의 인증 헤더로 소유자를 정합니다. `/api/record`의 읽기·쓰기·삭제에 인증을 적용하고 모든 SQL을 소유자 조건으로 제한합니다. 출생 입력은 서버에서 다시 검증·계산합니다. 응답은 캐시하지 않습니다.

프로필과 날짜별 결과를 온라인 DB에 저장하므로 같은 계정의 다른 기기에서 복원됩니다. 원본 출생 정보는 URL이나 브라우저 영구 저장소에 기록하지 않습니다. 수정하면 오늘의 결과를 재생성합니다. 이전 질문·궁합·타로는 당시 결과로 보관하며 최근 8개를 다시 열 수 있습니다. ‘기록 지우기’에서 프로필·날짜별 카드·질문·궁합·타로를 함께 삭제합니다. 운영 DB 스키마 변경은 `drizzle/`의 생성된 마이그레이션으로만 적용합니다.

현재 Sites 공개 범위는 소유자 전용입니다. 플랫폼 로그인 화면이 앱 입구보다 먼저 나타날 수 있습니다. 누구나 입구를 볼 수 있게 하려면 검토 후 사이트 공개 범위를 별도로 변경해야 합니다. 계정별 데이터 제한은 공개 여부와 무관하게 유지됩니다.

자세한 계산 범위, 참고 문헌과 연출 순서는 [풀이 기준](docs/reading-method.md)에 정리했습니다.

## 실행

Node.js 22.13 이상이 필요합니다. Windows에서는 Node.js 24를 권장합니다.

```sh
npm ci
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_flawless_cassandra_nova.sql
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_groovy_miss_america.sql
npm run dev
```

로컬 접속은 `http://localhost:5173/`입니다. 개발용 로그인은 starter의 localhost 전용 모의 인증입니다. 운영 빌드에는 모의 인증을 넣지 않습니다. 실제 운영 로그인·DB는 Sites가 제공합니다. 데이터 생성 스크립트를 다시 실행하려면 `skills/astronomy-astrology/scripts/requirements.txt`의 Python 의존성이 필요합니다.

```sh
npm test
npm run typecheck
```

계정 간 데이터 격리, 익명 요청 거부, 출처가 다른 쓰기 요청 거부, 잘못된 입력 뒤 원래 기록 유지, 재조회, 삭제 범위, 날짜별 결과와 계산 경계를 검사합니다. 테스트의 가짜 인증과 메모리 DB는 `.qa/`에만 생성하며 운영 산출물에 포함하지 않습니다.

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
