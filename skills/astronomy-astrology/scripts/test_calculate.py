"""Run: python -m unittest discover -s scripts -p test_calculate.py -v"""
from datetime import datetime, timedelta
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

import calculate as calc


class CalculationTests(unittest.TestCase):
    def test_published_calendar_examples(self):
        # Maintainer's examples, not derived from the adapter.
        r = calc.calendar_convert("2017-06-24")
        self.assertEqual(r["lunar"], "2017-05-01 Intercalation")
        self.assertIn("壬午日", r["calendar_gapja"])
        self.assertEqual(calc.calendar_convert("1956-01-21", "lunar")["solar"], "1956-03-03")
        self.assertEqual(calc.calendar_convert("2017-05-01", "lunar", True)["solar"], "2017-06-24")

    def test_invalid_lunar_and_solar(self):
        for value, kind, leap in (("2017-03-01", "lunar", True), ("2051-01-01", "solar", False),
                                   ("2026-02-30", "solar", False), ("2026-01-01", "solar", True)):
            with self.subTest(value=value), self.assertRaises(ValueError):
                calc.calendar_convert(value, kind, leap)

    def test_hko_lichun_2026(self):
        # HKO 2026 almanac: 4 Feb 04:02 HKT = 3 Feb 20:02 UTC.
        actual = calc.term_times(2026)[2][2]
        published = datetime.fromisoformat("2026-02-03T20:02:00+00:00")
        self.assertLess(abs((actual - published).total_seconds()), 180)

    def test_terms_order(self):
        rows = calc.solar_terms(2026, "Asia/Seoul")["terms"]
        self.assertEqual(len(rows), 24)
        self.assertEqual(sum(r["month_boundary"] for r in rows), 12)
        self.assertEqual([r["utc"] for r in rows], sorted(r["utc"] for r in rows))

    def test_lichun_changes_year_and_month(self):
        a = calc.saju("2026-02-04T04:00:00", "Asia/Seoul", "zi23")
        b = calc.saju("2026-02-04T06:00:00", "Asia/Seoul", "zi23")
        self.assertEqual((a["pillars"]["year"], a["pillars"]["month"]), ("乙巳", "己丑"))
        self.assertEqual((b["pillars"]["year"], b["pillars"]["month"]), ("丙午", "庚寅"))
        edge = calc.saju("2026-02-04T05:02:00", "Asia/Seoul", "zi23")
        self.assertEqual(edge["status"], "boundary_review_required")
        self.assertEqual(len(edge["boundary_candidates"]), 2)

    def test_day_boundary(self):
        a = calc.saju("2017-06-24T23:30:00", "Asia/Seoul", "midnight")
        b = calc.saju("2017-06-24T23:30:00", "Asia/Seoul", "zi23")
        self.assertEqual(a["pillars"]["day"], "壬午")
        self.assertEqual(b["pillars"]["day"], "癸未")
        self.assertEqual(a["pillars"]["hour"], "庚子")
        self.assertEqual(b["pillars"]["hour"], "壬子")

    def test_dst_and_missing_time(self):
        for value in ("2024-03-10T02:30:00", "2024-11-03T01:30:00", "2024-11-03"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                calc.local_time(value, "America/New_York")
        a = calc.local_time("2024-11-03T01:30:00", "America/New_York", 0)
        b = calc.local_time("2024-11-03T01:30:00", "America/New_York", 1)
        self.assertEqual(b.astimezone(calc.UTC) - a.astimezone(calc.UTC), timedelta(hours=1))
        with self.assertRaises(ValueError):
            calc.aware_iso("2026-09-13")

    def test_same_instant(self):
        a = calc.planets("2026-09-13T12:00:00+09:00", list(calc.BODY_IDS))
        b = calc.planets("2026-09-13T03:00:00Z", list(calc.BODY_IDS))
        self.assertEqual(a, b)
        for row in a["coordinates"]:
            self.assertTrue(0 <= row["longitude_deg"] < 360)
            self.assertTrue(-90 <= row["latitude_deg"] <= 90)
            self.assertGreater(row["distance_au"], 0)

    def test_database_preserves_versions(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = str(Path(tmp) / "test.sqlite3")
            record = dict(id="one", created_utc="2026-01-01T00:00:00Z", kind="test", result={"x": 1})
            calc.save_snapshot(path, "TEST'PERSON", record)
            newer = dict(record, id="two", result={"x": 2})
            calc.save_snapshot(path, "TEST'PERSON", newer)
            con = sqlite3.connect(path)
            try:
                rows = con.execute("SELECT payload_json FROM calculation_snapshots ORDER BY id").fetchall()
                self.assertEqual([json.loads(r[0])["result"]["x"] for r in rows], [1, 2])
            finally:
                con.close()


if __name__ == "__main__":
    unittest.main()
