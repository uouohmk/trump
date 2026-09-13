# 별빛 상담실

고해성사실을 닮은 입구에서 시작해, 출생 정보를 저장한 뒤 원하는 이야기를 카드 한 장씩 읽는 무료 상담형 웹앱입니다.

## 이용 흐름

입구 → 입장 → ChatGPT 로그인 → 출생 정보와 안내자 선택 → 계정에 저장 → 별자리·흐름·일·사주·타로 중 선택 → 캐릭터의 안내에 따라 다음 카드.

입장 전에는 배경과 타이틀, 버튼만 보입니다. 입력 항목과 결과, 시계, 퀘스트를 미리 노출하지 않습니다. 계산 조건과 시간 정보는 ‘내 기록’의 접힌 설명에 있습니다. 한국 시간 자정에 오늘의 카드가 바뀌며, 화면을 다시 열거나 포커스가 돌아올 때도 날짜를 확인합니다.

## 계산과 문장

- `skills/astronomy-astrology`: 기존 스킬과 검증한 Python 계산 코드.
- `lib/engine.js`: 절기 기반 연주·월주, 한국 음양력, 현지 법정시 기준 일주·시주. 검증된 Python 결과 75개와 비교합니다.
- `lib/astronomy.mjs`: Astronomy Engine 2.1.19. 태양 별자리와 천문지도는 실제 황도 좌표로 계산합니다.
- `lib/consultation.js`: 필요한 결과를 주제별 카드 순서로 구성합니다. 태어난 시간을 모르면 시주를 만들지 않고, 경계에서는 후보를 남깁니다.
- `lib/readings.js`: 오행의 관계를 성찰 문장으로 풉니다. 운세 점수나 확률을 만들지 않습니다.
- 타로는 출생 기록과 날짜에 따라 정한 메이저 아르카나 한 장입니다. 무작위 추첨이 아니며 해당 조건을 카드에서 알립니다.

대운, 진태양시, 상승궁·하우스, 사건 예측은 구현 범위에 포함하지 않습니다. 천문 계산의 정확도와 전통 해석의 예측력은 구분합니다. 문장은 ai-slop-thresher 기준으로 중복·상투어·과잉 설명을 줄였습니다.

## 로그인과 온라인 저장

Sites의 ChatGPT 인증과 D1을 사용합니다. 브라우저가 전달한 사용자 ID를 신뢰하지 않고 서버의 인증 헤더로 소유자를 정합니다. `/api/record`의 읽기·쓰기·삭제에 인증을 적용하고 모든 SQL을 소유자 조건으로 제한합니다. 출생 입력은 서버에서 다시 검증·계산합니다. 응답은 캐시하지 않습니다.

프로필과 날짜별 결과를 온라인 DB에 저장하므로 같은 계정의 다른 기기에서 복원됩니다. 원본 출생 정보는 URL이나 브라우저 영구 저장소에 기록하지 않습니다. 수정하면 기존 결과를 재생성하고, ‘기록 지우기’에서 프로필과 결과를 함께 삭제합니다. 운영 DB 스키마 변경은 `drizzle/`의 생성된 마이그레이션으로만 적용합니다.

현재 Sites 공개 범위는 소유자 전용입니다. 플랫폼 로그인 화면이 앱 입구보다 먼저 나타날 수 있습니다. 누구나 입구를 볼 수 있게 하려면 검토 후 사이트 공개 범위를 별도로 변경해야 합니다. 계정별 데이터 제한은 공개 여부와 무관하게 유지됩니다.

## 실행

Node.js 22.13 이상이 필요합니다. Windows에서는 Node.js 24를 권장합니다.

```sh
npm ci
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_flawless_cassandra_nova.sql
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
- 안내자: 사용자가 제공한 두 캐릭터 원본. 원본에 체크무늬가 포함되어 있어 초상화 프레임으로 표시합니다. 투명 배경 처리 시도가 실패해 편집본을 쓰지 않았습니다.
- 폰트: Neo둥근모, SIL OFL. `public/assets/neodgm-LICENSE.txt`.
- [Astronomy Engine](https://github.com/cosinekitty/astronomy), MIT. `lib/astronomy-LICENSE.txt`.
- [Korean Lunar Calendar](https://github.com/usingsky/korean_lunar_calendar_js), MIT. `public/assets/korean-lunar-calendar-LICENSE.txt`.

라이선스가 필요한 배포에서는 사용자가 제공한 캐릭터의 이용 범위도 확인해야 합니다. 서버 저장 데이터와 로컬 테스트 DB, 인증 정보는 Git에 포함하지 않습니다.
