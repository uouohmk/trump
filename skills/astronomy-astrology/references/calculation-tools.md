# 계산 도구와 실행 방법

확인일: 2026-09-13. 이 스킬은 이제 [Python 계산 어댑터](../scripts/calculate.py)를 포함한다. 아래 지원 범위 안에서 실행 결과를 얻은 뒤 기존 해석 절차를 적용한다. 설치한 패키지가 실제로 실행되지 않으면 계산 완료라고 기록하지 않는다.

## 도구 선택과 온라인 조사

| 도구 | 역할·선정 이유 | 적용 상태 |
|---|---|---|
| [korean-lunar-calendar](https://github.com/usingsky/korean_lunar_calendar_py) | 한국식 양음력·윤달 변환; MIT | 0.4.0 연결·실행 확인 |
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | 오프라인 천체 위치·태양 황경 탐색; MIT | 2.1.19 연결·실행 확인 |
| [NASA/JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | 온라인 역서 대조 | 태양 표본 실제 조회 확인 |
| [KASI 생활천문관 API 안내](https://astro.kasi.re.kr/life/pageView/31) | 한국 공식 역법 자료의 대조 경로 | 참고 링크; API 인증·연동은 미구현 |
| [Swiss Ephemeris](https://www.astro.com/swisseph/) | 하우스·상승궁 등 추가 차트 기능 후보 | 이번 구현에 포함하지 않음 |
| [Python sqlite3](https://docs.python.org/3/library/sqlite3.html) | 별도 서버 없는 로컬 계산 스냅샷 저장 | 선택 옵션으로 구현 |

Astronomy Engine의 공개 목표 정확도는 약 1각분이다. 절입을 초 단위로 출력해도 초 단위의 천문 정확도 보증은 아니다. [Python 공식 API](https://github.com/cosinekitty/astronomy/tree/master/source/python)에서 `SearchSunLongitude`, `GeoVector`, `Ecliptic`의 좌표 기준을 확인했다.

Swiss Ephemeris의 배포·공개 서비스에는 AGPL 또는 별도 Professional License 선택이 관련된다. 확장할 때 [제작사 프로그래밍 안내](https://www.astro.com/swisseph-download/doc/swephprg.pdf)의 해당 조건을 확인한다. 현재 기본 의존성에 넣지 않았다.

외부 라이브러리 소스는 이 폴더에 복사하지 않는다. [requirements.txt](../scripts/requirements.txt)로 설치하며 패키지 자체의 라이선스 고지를 유지한다.

## 지원 범위

| 명령 | 계산 결과 | 범위·제약 |
|---|---|---|
| `calendar` | 양력↔한국 음력·윤달·달력 간지 | 라이브러리 범위: 양력 1000-02-13~2050-12-31, 음력 1000-01-01~2050-11-18; 1582년 개력 공백 거부 |
| `terms` | 24절기 UTC·지정 시간대 시각·월 경계 여부 | 연도 1899~2051; 입력 연도는 UTC 연도 기준 탐색 |
| `saju` | 연주·월주·일주·시주 | 현지 양력 1900~2049; 법정시, 입춘·12절 경계; 일 경계 명시 필수 |
| `planets` | 태양·달·수성~명왕성 황경·황위·거리·회귀 황도궁·역행 | UTC 1900~2050; 지심, 날짜의 진황도 기준 |
| `horizons` | NASA/JPL 지심 겉보기 황경·황위 원문 | 온라인 요청; 원문 헤더·API 버전 보존 |

`saju`는 기본 4주 산출 어댑터다. 대운 기산, 진태양시, 다양한 야자시 규칙, 격국·용신 자동 판단은 구현하지 않았다. `planets`는 상승궁·하우스·항성 황도대·측심 차트를 산출하지 않는다. 필요한 경우 다른 엔진의 검증된 기능을 연결한 뒤 지원 범위를 갱신한다.

음력 출생은 `calendar --input lunar`로 먼저 변환하고 원입력·윤달 여부·양력 변환값을 기록한다. 중국 음력 변환기를 한국 음력의 대체로 사용하지 않는다. 시간 미상이면 `saju`에 정오를 넣지 말고 가능한 역법 정보만 계산한다.

## 실행 환경

Python 3.10 이상을 사용한다. 아래 명령은 스킬 폴더를 작업 디렉터리로 하고, `python`이 실제로 실행되는 Python 경로를 가리킨다는 전제다. Windows의 실행되지 않는 Microsoft Store 별칭은 사용할 수 없다.

```powershell
python -m venv .venv
& .\.venv\Scripts\python.exe -m pip install -r .\scripts\requirements.txt
& .\.venv\Scripts\python.exe .\scripts\calculate.py --help
```

이번 검증에 사용한 환경은 `C:\Users\searc\OneDrive\문서\ChatGPT\점성술\.calc-env\Scripts\python.exe`다. 이 환경으로도 계산 스크립트의 절대 경로를 지정해 바로 실행할 수 있다. 다른 컴퓨터에서는 자체 환경을 설치한다.

## 실행 예시

예시 날짜는 소프트웨어 검증용이며 실제 인물 자료가 아니다. 아래 `python`을 준비된 인터프리터로 바꿔 실행한다.

```powershell
python scripts/calculate.py calendar --date 2017-05-01 --input lunar --leap
python scripts/calculate.py terms --year 2026 --timezone Asia/Seoul
python scripts/calculate.py saju --local 2026-09-13T12:00:00 --timezone Asia/Seoul --day-boundary zi23
python scripts/calculate.py planets --datetime 2026-09-13T12:00:00+09:00
python scripts/calculate.py horizons --datetime 2026-09-13T03:00:00Z --body Sun
```

`planets --bodies Sun Moon Mars`로 대상 천체를 제한할 수 있다. `--output result-001.json`은 새 파일을 생성하며 기존 파일은 덮어쓰지 않는다. 기본 출력은 JSON이고, 해석 문서는 이 JSON을 근거로 작성한다.

## 사주 계산 규칙

- 연주: 해당 현지 연도의 입춘 절입 순간을 UTC로 비교한다.
- 월주: 태양 겉보기 황경 315°부터 30° 간격인 12절을 사용한다. [홍콩천문대 절기 설명](https://www.hko.gov.hk/en/gts/time/24solarterms.htm)을 참고한다.
- 월간: 선택된 연간을 기준으로 인월부터 순환한다. 일간·시간의 10간/12지 순환과 함께 [lunar-python 제작자 구현](https://github.com/6tail/lunar-python/blob/master/lunar_python/Lunar.py)의 규칙을 참고하되 별도의 어댑터로 작성했다.
- 일주: 한국 양음력 라이브러리의 일진을 사용한다. 라이브러리의 연·월 간지는 사주 연·월주로 사용하지 않는다.
- `zi23`: 23:00부터 다음 일진을 적용하고 그 일간으로 시간도 구한다.
- `midnight`: 00:00부터 일진을 바꾸며 23시의 시간도 아직 바뀌지 않은 당일 일간으로 구한다. 이는 이 어댑터의 명시적 규칙이며, 다른 라이브러리의 “유파 2” 또는 모든 야자시법과 같다고 가정하지 않는다.
- `--timezone`은 IANA 지역명이다. [zoneinfo](https://docs.python.org/3/library/zoneinfo.html)로 당시 법정 시각의 UTC 오프셋을 얻는다. 서머타임 등으로 존재하지 않는 시각은 거부하고, 중복 시각은 `--fold 0`(먼저 발생) 또는 `1`(나중 발생)을 요구한다. 역사 자료 자체의 정확성까지 자동 검증한 것은 아니다.
- 경도 보정·균시차는 적용하지 않는다. 그 규칙이 필요한 명식을 법정시 계산과 혼동하지 않는다.

절입 전후 30분은 `boundary_review_required`로 표시하고 경계 양쪽의 연·월주 후보를 함께 반환한다. 30분은 별도 대조를 요청하는 보수적 작업 기준이며 통계적 오차 범위가 아니다. 출생시각 불확실성이 더 크면 그 전체 구간을 검토한다. 경계 후보는 정밀 역서와 대조하기 전 확정 원국으로 저장하지 않는다.

## 천체 위치와 NASA 대조

`planets`는 광행시간·광행차를 반영한 지심 벡터를 날짜의 진황도 좌표로 변환한다. 황경 속도는 앞뒤 1시간의 각도 차이로 근사하고 360° 경계를 처리한다. 속도 절댓값이 0.001°/일 미만이면 `stationary_review`로 표시한다. 이 기준은 엔진 오차 보증이 아니므로 실제 역행 정지 시각에는 별도 탐색이 필요하다.

`horizons`는 지정 시각과 천체 ID를 NASA로 전송한다. 인물 ID와 DB 내용은 전송하지 않는다. 기본 네 명령은 의존성 설치 후 오프라인으로 작동한다.

2026-09-13에 공식 API 문서는 1.3, 실제 응답은 1.2였다. 원문은 보존하되 `api_version_review_required: true`를 표시한다. 이 표시는 무시하지 않는다. 이번 태양 표본의 헤더·열·시각을 직접 확인했으며, 향후 다른 형식의 자동 파싱을 보증하지 않는다. HTTP 200이어도 오류 또는 데이터 구간 누락이면 실패 처리한다.

Horizons의 `QUANTITIES=31`은 IAU76/80 날짜의 황도에 대한 겉보기 좌표다. 엔진의 날짜의 진황도 좌표와 모델·보정 차이가 있으므로 초각 차이를 모두 계산 버그로 해석하지 않는다. Horizons UT는 1962년 전에는 UT1이므로, 그 이전의 UTC 표기 입력은 역사적 시간 변환을 따로 검토해야 한다.

## 선택적 로컬 DB 저장

사용자가 저장을 요청한 경우에만 `--db`를 지정한다. 지정하지 않으면 DB를 생성하지 않는다.

```powershell
python scripts/calculate.py saju --local 2026-09-13T12:00:00 --timezone Asia/Seoul --day-boundary zi23 --db calculations.sqlite3 --person-id TEST-001
```

`calculation_snapshots` 테이블에 계산 UUID, 인물 ID, 생성 UTC, 계산 종류, 원입력·규칙·버전·결과 JSON을 행 단위로 추가한다. 이전 계산을 갱신하거나 지우지 않는다. 동일 UUID는 중복 저장하지 않는다. SQLite 자체가 외부 수정을 금지하는 불변 저장소는 아니다.

이 기능은 계산 스냅샷의 저장 인터페이스다. 전체 인물·관계·사건 DB, 클라우드 동기화, 웹 API는 구현하지 않았다. 기존 Markdown 기록의 계산 버전 항목에 반환 UUID를 적으면 두 기록을 연결할 수 있다. JSON DB 파일은 암호화되지 않으므로 사용자가 선택한 보관 위치를 따른다.

## 검증

[검사 스크립트](../scripts/test_calculate.py):

```powershell
python -m unittest discover -s scripts -p test_calculate.py -v
```

2026-09-13 실행 결과: 9개 검사 통과. 공개 양음력 예제·윤달 왕복·잘못된 날짜 거부, 절입에 따른 연월 변경, 23시/자정 규칙, DST 누락·중복 시각, 동일 순간의 좌표 일치, DB 이전 버전 보존을 검사했다.

- 독립 구현 `lunar-python 1.4.8`의 sect 1과 1,080개 4주 표본이 일치했다. 표본은 1900~2045년 5년 간격, 각 월 15일, 00:30·12:30·23:30, Asia/Shanghai 법정시 조건이다. 경계 시각 전체나 한국·해외의 모든 시각 관례를 검증한 것은 아니다. 이 라이브러리는 개발 대조에만 사용하며 실행 의존성에는 포함하지 않는다.
- [홍콩천문대 2026 연감](https://www.hko.gov.hk/en/gts/astron2026/files/HKO_almanac_2026.pdf)의 입춘은 홍콩시간 2월 4일 04:02. 엔진 결과는 UTC 2월 3일 20:01:54.541, 서울시간 2월 4일 05:01:54.541. 연감의 분 단위 표기와 약 5.5초 차이다.
- 2026-09-13 03:00 UTC 태양 황경: 엔진 170.359291°, NASA/JPL 170.3596855°. 차이 약 1.42초각. 이는 한 시점·한 천체의 표본 대조이며 모든 천체·시대의 정확도 검증은 아니다.

실제 사람의 개별 계산은 검사 통과만으로 `대조 확인`으로 승격하지 않는다. 그 사람의 입력과 계산 결과를 별도로 대조한 경우에만 검증 상태를 바꾼다.
