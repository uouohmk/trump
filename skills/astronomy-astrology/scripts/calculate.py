"""Local calendar/ephemeris adapter. Conventions and sources: references/calculation-tools.md."""
import argparse
from contextlib import closing
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache
from importlib.metadata import version
import json
from pathlib import Path
import re
import sqlite3
import sys
from urllib.parse import urlencode
from urllib.request import urlopen
import uuid
from zoneinfo import ZoneInfo

import astronomy as astro
from korean_lunar_calendar import KoreanLunarCalendar

VERSION = "1.0.0"
UTC = timezone.utc
STEMS = "甲乙丙丁戊己庚辛壬癸"
BRANCHES = "子丑寅卯辰巳午未申酉戌亥"
SIGNS = "양자리 황소자리 쌍둥이자리 게자리 사자자리 처녀자리 천칭자리 전갈자리 사수자리 염소자리 물병자리 물고기자리".split()
TERMS = "소한 대한 입춘 우수 경칩 춘분 청명 곡우 입하 소만 망종 하지 소서 대서 입추 처서 백로 추분 한로 상강 입동 소설 대설 동지".split()
BODY_IDS = dict(Sun=10, Moon=301, Mercury=199, Venus=299, Mars=499,
                Jupiter=599, Saturn=699, Uranus=799, Neptune=899, Pluto=999)


def aware_iso(value):
    if "T" not in value and " " not in value:
        raise ValueError("시각이 필요합니다. 날짜만으로 출생시각을 만들지 않습니다.")
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        raise ValueError("UTC offset을 포함하세요. 예: 2026-09-13T12:00:00+09:00")
    return dt.astimezone(UTC)


def local_time(value, zone, fold=None):
    if "T" not in value and " " not in value:
        raise ValueError("출생시각이 미상이면 saju 대신 calendar 명령을 사용하세요.")
    wall = datetime.fromisoformat(value)
    if wall.tzinfo is not None:
        raise ValueError("--local에는 offset 없는 현지시각, --timezone에는 IANA 지역을 입력하세요.")
    tz = ZoneInfo(zone)
    candidates = {}
    for f in (0, 1):
        candidate = wall.replace(tzinfo=tz, fold=f)
        back = candidate.astimezone(UTC).astimezone(tz)
        if back.replace(tzinfo=None) == wall:
            candidates[f] = candidate
    if not candidates:
        raise ValueError("시간대 전환으로 존재하지 않는 현지시각입니다.")
    ambiguous = len({c.utcoffset() for c in candidates.values()}) > 1
    if ambiguous and fold is None:
        raise ValueError("중복되는 현지시각입니다. --fold 0 또는 1로 발생 순서를 지정하세요.")
    return candidates[fold if ambiguous else min(candidates)]


def atime(dt):
    u = dt.astimezone(UTC)
    return astro.Time.Make(u.year, u.month, u.day, u.hour, u.minute,
                           u.second + u.microsecond / 1e6)


def utc_datetime(t):
    return t.Utc().replace(tzinfo=UTC)


def calendar_convert(value, kind="solar", leap=False):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("날짜는 YYYY-MM-DD 형식이어야 합니다.")
    y, m, d = map(int, value.split("-"))
    cal = KoreanLunarCalendar()
    if kind == "solar" and leap:
        raise ValueError("--leap은 음력 입력에만 사용합니다.")
    ok = cal.setSolarDate(y, m, d) if kind == "solar" else cal.setLunarDate(y, m, d, leap)
    if not ok:
        raise ValueError("지원 범위 밖이거나 존재하지 않는 날짜/윤달입니다.")
    return dict(solar=cal.SolarIsoFormat(), lunar=cal.LunarIsoFormat(),
                leap_month=cal.isIntercalation,
                calendar_gapja=cal.getChineseGapJaString(),
                note="달력의 연·월 간지는 절입 기준 사주 연주·월주가 아닙니다.")


@lru_cache(maxsize=16)
def term_times(year):
    if not 1899 <= year <= 2051:
        raise ValueError("이 어댑터의 절기 계산 범위는 1899~2051년입니다.")
    start = astro.Time.Make(year, 1, 1, 0, 0, 0)
    found = []
    for i, name in enumerate(TERMS):
        longitude = (285 + 15 * i) % 360
        t = astro.SearchSunLongitude(longitude, start, 366)
        if t is None:
            raise RuntimeError("절기 탐색 실패: " + name)
        found.append((name, longitude, utc_datetime(t)))
    return tuple(found)


def solar_terms(year, zone):
    tz = ZoneInfo(zone)
    return dict(year=year, timezone=zone, frame="geocentric apparent true ecliptic of date",
                terms=[dict(name=n, longitude_deg=l, utc=t.isoformat(),
                            local=t.astimezone(tz).isoformat(), month_boundary=(i % 2 == 0))
                       for i, (n, l, t) in enumerate(term_times(year))])


def year_month(dt):
    u = dt.astimezone(UTC)
    lichun = term_times(dt.year)[2][2]
    sy = dt.year if u >= lichun else dt.year - 1
    yg = (sy - 4) % 10
    longitude = astro.SunPosition(atime(dt)).elon
    month = int(((longitude - 315) % 360) // 30)
    return {"year": STEMS[yg] + BRANCHES[(sy - 4) % 12],
            "month": STEMS[((yg % 5) * 2 + 2 + month) % 10] + BRANCHES[(month + 2) % 12]}


def saju(local, zone, day_boundary, fold=None):
    dt = local_time(local, zone, fold)
    if not 1900 <= dt.year <= 2049:
        raise ValueError("사주 어댑터 지원 범위는 현지 양력 1900~2049년입니다.")
    effective = dt.date() + timedelta(days=int(day_boundary == "zi23" and dt.hour == 23))
    daily = calendar_convert(effective.isoformat())
    match = re.search(r"([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])日", daily["calendar_gapja"])
    if match is None:
        raise RuntimeError("간지 일자 응답 형식이 변경되었습니다.")
    day = match.group(1)
    hour_branch = ((dt.hour + 1) // 2) % 12
    hour = STEMS[(STEMS.index(day[0]) % 5 * 2 + hour_branch) % 10] + BRANCHES[hour_branch]
    pillars = dict(year_month(dt), day=day, hour=hour)
    u = dt.astimezone(UTC)
    boundaries = [t for y in (dt.year - 1, dt.year, dt.year + 1)
                  for i, (_, _, t) in enumerate(term_times(y)) if i % 2 == 0]
    near = min(boundaries, key=lambda t: abs((t - u).total_seconds()))
    distance = abs((near - u).total_seconds())
    # Conservative review window, not a statistical uncertainty interval.
    review = distance <= 1800
    variants = []
    if review:
        variants = [year_month((near + timedelta(minutes=m)).astimezone(dt.tzinfo)) for m in (-31, 31)]
    return dict(local=dt.isoformat(), utc=u.isoformat(), timezone=zone,
                fold=dt.fold, pillars=pillars, effective_day=effective.isoformat(),
                status="boundary_review_required" if review else "calculated_not_independently_verified",
                boundary_candidates=variants, nearest_month_boundary_utc=near.isoformat(),
                boundary_distance_minutes=round(distance / 60, 3),
                rules=dict(year="입춘 절입", month="태양 겉보기 황경의 12절 경계",
                           day=day_boundary, hour="선택한 일간 기준 2시간 구간; 자시 23:00~00:59",
                           clock="현지 법정시; 경도·진태양시 보정 없음"),
                unimplemented=["대운 기산", "진태양시", "야자시 세부 유파", "격국·용신 자동 판정"],
                note="절입 전후 30분은 외부 역서로 대조하세요. 이 구간은 보수적 검토 폭이며 오차 보증값이 아닙니다.")


def coordinates(name, dt):
    vector = astro.GeoVector(getattr(astro.Body, name), atime(dt), True)
    ecliptic = astro.Ecliptic(vector)
    return ecliptic.elon, ecliptic.elat, vector.Length()


def planets(value, names):
    dt = aware_iso(value)
    if not 1900 <= dt.year <= 2050:
        raise ValueError("이 어댑터의 천체 계산 범위는 UTC 1900~2050년입니다.")
    rows = []
    for name in names:
        lon, lat, dist = coordinates(name, dt)
        a = coordinates(name, dt - timedelta(hours=1))[0]
        b = coordinates(name, dt + timedelta(hours=1))[0]
        speed = ((b - a + 180) % 360 - 180) * 12
        rows.append(dict(body=name, longitude_deg=round(lon, 6), latitude_deg=round(lat, 6),
                         distance_au=round(dist, 9), tropical_sign=SIGNS[int(lon // 30)],
                         degree_in_sign=round(lon % 30, 6), speed_deg_per_day=round(speed, 6),
                         motion="stationary_review" if abs(speed) < 0.001 else ("retrograde" if speed < 0 else "direct")))
    return dict(utc=dt.isoformat(), frame="지심·날짜의 진황도/진분점; 광행시간·광행차 보정",
                zodiac="회귀 황도대", coordinates=rows,
                precision_note="소수 자릿수는 출력 형식입니다. 엔진 목표 정확도 약 1각분; 정지점 부근은 별도 검증.",
                unimplemented=["상승궁", "하우스", "항성 황도대", "측심 차트"])


def horizons(value, body):
    dt = aware_iso(value)
    params = dict(format="json", COMMAND=f"'{BODY_IDS[body]}'", EPHEM_TYPE="'OBSERVER'",
                  CENTER="'500@399'", MAKE_EPHEM="'YES'", OBJ_DATA="'NO'", TIME_TYPE="'UT'",
                  TLIST="'" + dt.strftime("%Y-%m-%d %H:%M:%S.%f") + "'",
                  QUANTITIES="'31'", CSV_FORMAT="'YES'")
    with urlopen("https://ssd.jpl.nasa.gov/api/horizons.api?" + urlencode(params), timeout=30) as response:
        data = json.load(response)
    if data.get("error") or "$$SOE" not in data.get("result", ""):
        raise RuntimeError("Horizons 응답 오류: " + str(data.get("error", data.get("result", "missing result")))[:500])
    api_version = data.get("signature", {}).get("version")
    return dict(utc=dt.isoformat(), body=body, signature=data.get("signature", {}), parameters=params,
                documented_api_version="1.3", api_version_review_required=(api_version != "1.3"),
                raw_result=data["result"], note="원문 헤더 보존. 비교 시 좌표 기준과 시각계를 대조하세요.")


def save_snapshot(db, person, record):
    if not person or not person.strip():
        raise ValueError("DB 저장에는 --person-id가 필요합니다. 테스트에는 TEST 등을 사용하세요.")
    with closing(sqlite3.connect(db)) as con, con:
        con.execute("CREATE TABLE IF NOT EXISTS calculation_snapshots (id TEXT PRIMARY KEY, person_id TEXT NOT NULL, created_utc TEXT NOT NULL, kind TEXT NOT NULL, payload_json TEXT NOT NULL)")
        con.execute("INSERT INTO calculation_snapshots VALUES (?, ?, ?, ?, ?)",
                    (record["id"], person, record["created_utc"], record["kind"], json.dumps(record, ensure_ascii=False)))


def main():
    parser = argparse.ArgumentParser(description="천문학·사주 계산 어댑터; calculation-tools.md 참조")
    sub = parser.add_subparsers(dest="command", required=True)
    cal = sub.add_parser("calendar", help="한국식 양음력 변환")
    cal.add_argument("--date", required=True)
    cal.add_argument("--input", choices=["solar", "lunar"], default="solar")
    cal.add_argument("--leap", action="store_true")
    terms = sub.add_parser("terms", help="24절기 절입")
    terms.add_argument("--year", type=int, required=True)
    terms.add_argument("--timezone", required=True)
    pillars = sub.add_parser("saju", help="제한된 규칙의 사주 4주; 미상 시각은 입력하지 않음")
    pillars.add_argument("--local", required=True)
    pillars.add_argument("--timezone", required=True)
    pillars.add_argument("--day-boundary", choices=["midnight", "zi23"], required=True)
    pillars.add_argument("--fold", choices=[0, 1], type=int)
    ephem = sub.add_parser("planets", help="지심 황경·황위·역행")
    ephem.add_argument("--datetime", required=True)
    ephem.add_argument("--bodies", nargs="+", choices=list(BODY_IDS), default=list(BODY_IDS))
    remote = sub.add_parser("horizons", help="온라인 NASA/JPL 조회; 시각과 천체를 전송")
    remote.add_argument("--datetime", required=True)
    remote.add_argument("--body", choices=list(BODY_IDS), required=True)
    for command in (cal, terms, pillars, ephem, remote):
        command.add_argument("--output", help="새 JSON 파일 경로; 기존 파일 덮어쓰지 않음")
        command.add_argument("--db", help="선택적 로컬 SQLite 스냅샷 저장")
        command.add_argument("--person-id", help="DB 연결용 사용자 지정 인물 ID")
    args = parser.parse_args()
    try:
        if args.db and not args.person_id:
            raise ValueError("--db 사용 시 --person-id를 지정하세요.")
        if args.output and Path(args.output).exists():
            raise ValueError("출력 파일이 이미 있습니다. 새 파일명을 지정하세요.")
        if args.command == "calendar":
            result = calendar_convert(args.date, args.input, args.leap)
        elif args.command == "terms":
            result = solar_terms(args.year, args.timezone)
        elif args.command == "saju":
            result = saju(args.local, args.timezone, args.day_boundary, args.fold)
        elif args.command == "planets":
            result = planets(args.datetime, args.bodies)
        else:
            result = horizons(args.datetime, args.body)
        record = dict(schema_version=1, adapter_version=VERSION, id=str(uuid.uuid4()),
                      created_utc=datetime.now(UTC).isoformat(), kind=args.command,
                      dependencies={p: version(p) for p in ("astronomy-engine", "korean-lunar-calendar", "tzdata")},
                      input={k: v for k, v in vars(args).items() if k not in ("output", "db", "person_id")},
                      result=result)
        if args.db:
            save_snapshot(args.db, args.person_id, record)
        payload = json.dumps(record, ensure_ascii=False, indent=2)
        if args.output:
            with open(args.output, "x", encoding="utf-8") as handle:
                handle.write(payload + "\n")
        print(payload)
    except (ValueError, KeyError, OSError, RuntimeError, sqlite3.Error) as exc:
        parser.exit(2, str(exc) + "\n")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
