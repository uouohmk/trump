# 학습 자료와 GitHub 활용

사용자의 두 번째 첨부는 천문학·천체물리학 학습 목록이며 완성된 에이전트 스킬 파일은 아니다. 링크 목록과 GitHub 예제를 학습 흐름에 연결했다. 확인일: 2026-09-12. 아래에서 별도로 확인했다고 밝힌 자료 외에는 사용자 목록에서 선별한 링크이며 전체를 검증했다는 뜻은 아니다.

## 분야별 경로

| 단계 | 개념·실습 | 자료 | 통합 해설 질문 |
|---|---|---|---|
| 하늘 좌표 | 천구·지평·적도·황도 | [KASI](https://astro.kasi.re.kr/), [NASA](https://science.nasa.gov/learn/basics-of-space-flight/chapter2-1/), [Stellarium](https://stellarium.org/) | 같은 위치를 전통마다 어떻게 표시하는가? |
| 행성 운동 | 케플러 법칙·역행·합·충 | [PhET](https://phet.colorado.edu/ko/simulations/keplers-laws), [NAAP](https://astro.unl.edu/naap/), 아래 GitHub 예제 | 겉보기 역행과 상징 해석은 어떻게 다른가? |
| 중력 | 라그랑주점·탈출속도 | [NASA](https://science.nasa.gov/resource/what-is-a-lagrange-point/), [Falstad](https://www.falstad.com/lagrange/) | 물리적 영향 주장에는 어떤 계산이 필요한가? |
| 별의 관측 | 빈의 법칙·시차·등급 | [흑체 스펙트럼](https://phet.colorado.edu/en/simulations/blackbody-spectrum), [ESA 거리 교육](https://sci.esa.int/web/education/-/35616-stellar-distances) | 관측되는 색·밝기와 부여된 의미를 어떻게 구분하는가? |
| 항성 진화 | H-R도·주계열·거성·잔해 | [Chandra](https://chandra.harvard.edu/edu/formal/stellar_ev/) | 신화 속 이름의 별은 실제로 어떤 천체인가? |
| 은하·고에너지 | 은하·블랙홀·퀘이사·초신성 | [NASA 은하](https://science.nasa.gov/universe/galaxies/types/), [Chandra 블랙홀](https://chandra.harvard.edu/blackhole/) | 관련 사료가 있을 때 문화적 맥락을 덧붙인다. |
| 우주론 | 배경복사·암흑물질·암흑에너지 | [NASA LAMBDA](https://lambda.gsfc.nasa.gov/education/), [KIAS HORIZON](https://horizon.kias.re.kr/) | 현대 우주론을 고대 운세의 입증으로 사용하지 않는다. |
| 중력파 | 간섭계·파형·검출 | [LIGO 활동](https://www.ligo.caltech.edu/page/classroom-activities) | 직접 연결이 없다면 천문학 학습으로 완결한다. |

종합 교재는 [OpenStax Astronomy 2e](https://openstax.org/books/astronomy-2e/pages/1-introduction), [MIT 입문 강의](https://ocw.mit.edu/courses/8-282j-introduction-to-astronomy-spring-2006/)를 참고한다. 지원 언어·현재 이용 조건은 사용할 때 확인한다. 블로그·위키·영상은 보조 설명을 찾는 데 활용하고 정밀 수치·최신 발견은 원출처로 확인한다.

## GitHub: 행성 공전 궤도 계산기

[currenjin/alexandria-playground — poc-planetary-orbital-calculator](https://github.com/currenjin/alexandria-playground/tree/main/poc-planetary-orbital-calculator)

GitHub API에서 Java 소스·테스트 경로를 확인했고 PlanetaryPositionCalculator.java와 JulianClock.java를 읽었다. 설치·실행하지 않았으며 테스트 통과나 정밀 위치 정확도를 보증하지 않는다.

구성에는 궤도 요소, 편심이각, 시각별 궤도, 평면 좌표·거리·각 계산, J2000 기준 경과시간과 관련 테스트가 있다.

- PlanetaryPositionCalculator는 편심이각으로 평면 x·y를 만들고 atan2(y,x) 및 거리를 구한다. 반환 각도를 관측자 기준 황경으로 곧바로 사용하지 않는다. 궤도면 회전·관측 중심 변환 등 필요한 단계를 확인한다.
- JulianClock.elapsedDate()는 정수형 일수 계산을 사용한다. 하루 미만 시간 처리가 필요한 차트·관측 계산에는 시간 정밀도를 검토해야 한다.
- 변수명만으로 좌표 기준·길이 단위를 추정하지 않는다. 변환 상수와 입력 정의를 함께 확인한다.

권장 실습: 궤도 요소 → 편심이각 → 궤도면 위치 → 기준 좌표 변환 → 지심 시선 방향 → 황경 순으로 설명한다. 구현이 없는 단계는 추가 과제로 명시한다. 같은 시각·기준의 [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html)와 비교하고 오차 원인을 논한다.

## GitHub: 케플러 법칙

[currenjin/alexandria-playground — poc-kepler-laws](https://github.com/currenjin/alexandria-playground/tree/main/poc-kepler-laws)

KeplerThirdLaw.java와 KeplerThirdLawTest.java를 읽었다. 확인한 구현은 **제3법칙의 공전주기 계산**이다. 프로젝트명만으로 제1·2법칙도 구현되었다고 설명하지 않는다.

- 입력: 긴반지름 AU, 중심질량 태양질량 단위.
- 출력: 365.25일을 1년으로 둔 공전주기.
- 근사: T² = 4π²a³/(GM), 동반천체 질량 무시.
- 테스트 파일: 수성~토성 근삿값 비교, 0·음수 입력 예외. 실행 결과는 미확인.

권장 실습: 긴반지름·중심질량을 하나씩 바꾸어 T ∝ a^(3/2), T ∝ M^(−1/2)를 확인한다. 계산 대상은 궤도 주기이며 인간 성격·사건의 예측과 구분한다.

실제 코드 재사용 시 해당 커밋·의존성·라이선스를 확인한다. 이 패키지에는 외부 소스 코드를 복사하지 않았으며 링크와 학습용 설명만 포함했다.

## 적용 예

- “수성 역행이 왜 생기고 점성술에서는 어떻게 읽는가?”: 상대궤도로 겉보기 운동을 설명한 뒤 전통적 해석을 별도로 제시한다. 실제 기간을 묻지 않았다면 최신 날짜 계산은 생략한다.
- “생일 별자리와 실제 하늘이 왜 다른가?”: 회귀 황도궁·항성 황도궁·IAU 영역을 구분하고 입력 조건이 확보된 경우 위치를 계산한다.
- “천문학만 남겨 달라.”: 관측·물리·좌표·천체 자료를 남기고 상징 연결을 다시 넣지 않는다.
- “시리우스의 물리와 이집트 문화를 설명해 달라.”: 쌍성·밝기·거리와 역법·사료의 층위를 나누어 연결한다.

## 확인한 외부 근거

- [KASI](https://astro.kasi.re.kr/): 포털 접근 확인.
- [NASA Reference Systems](https://science.nasa.gov/learn/basics-of-space-flight/chapter2-1/): 세차·기준시각 설명 확인.
- [IAU The Constellations](https://iauarchive.eso.org/public/themes/constellations/): 88개 목록, 1928년 경계 승인·1930년 출판 확인.
- [JPL Horizons Manual](https://ssd.jpl.nasa.gov/horizons/manual.html): 문서 접근 확인; 계산 실행은 하지 않음.
- [ESO 2026-07-28](https://www.eso.org/public/news/eso2611/), [2026-08-19 데이터](https://www.eso.org/sci/publications/announcements/sciann17796.html): 베텔게우스 서술 보정.
- [Carlson, 1985, Nature 318, 419–425](https://doi.org/10.1038/318419a0): 출생 차트와 성격의 연결 주장을 시험한 이중맹검 연구의 서지·초록 확인. 상세 설계와 재분석 평가는 본문·후속 논문을 읽고 논한다.
