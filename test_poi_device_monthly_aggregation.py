import unittest
import requests


BASE_URL = "http://127.0.0.1:5000/api"


def to_int(value):
    if value is None:
        return 0
    if isinstance(value, str) and value.strip() == "":
        return 0
    return int(float(value))


def sum_latest_day_counts(rows, latest_date):
    if not rows or not latest_date:
        return 0, 0
    poi = 0
    device = 0
    for row in rows:
        if row.get("A") == latest_date:
            poi += to_int(row.get("overview_poi_count"))
            device += to_int(row.get("overview_device_count"))
    return poi, device


class TestPoiDeviceMonthlyAggregation(unittest.TestCase):
    def test_normal_month(self):
        params = {
            "date_from": "2026-03-01",
            "date_to": "2026-03-31",
            "district": "新北区",
        }
        summary = requests.get(f"{BASE_URL}/summary", params=params, timeout=15).json()
        details = requests.get(f"{BASE_URL}/summary_data", params=params, timeout=15).json()

        self.assertTrue(summary.get("success"))
        self.assertTrue(details.get("success"))
        self.assertGreater(details.get("count", 0), 0)

        latest_date = details.get("latest_date")
        poi, device = sum_latest_day_counts(details.get("data", []), latest_date)
        self.assertEqual(poi, to_int(summary.get("total_poi_count")))
        self.assertEqual(device, to_int(summary.get("total_device_count")))

    def test_cross_month_range(self):
        params = {
            "date_from": "2026-02-20",
            "date_to": "2026-03-20",
            "district": "新北区",
        }
        summary = requests.get(f"{BASE_URL}/summary", params=params, timeout=15).json()
        details = requests.get(f"{BASE_URL}/summary_data", params=params, timeout=15).json()

        self.assertTrue(summary.get("success"))
        self.assertTrue(details.get("success"))
        self.assertGreater(details.get("count", 0), 0)

        latest_date = details.get("latest_date")
        poi, device = sum_latest_day_counts(details.get("data", []), latest_date)
        self.assertEqual(poi, to_int(summary.get("total_poi_count")))
        self.assertEqual(device, to_int(summary.get("total_device_count")))

    def test_empty_data_range(self):
        params = {
            "date_from": "2099-01-01",
            "date_to": "2099-01-31",
            "district": "新北区",
        }
        summary = requests.get(f"{BASE_URL}/summary", params=params, timeout=15).json()
        details = requests.get(f"{BASE_URL}/summary_data", params=params, timeout=15).json()

        self.assertTrue(summary.get("success"))
        self.assertTrue(details.get("success"))
        self.assertEqual(details.get("count", 0), 0)
        self.assertEqual(to_int(summary.get("total_poi_count")), 0)
        self.assertEqual(to_int(summary.get("total_device_count")), 0)


if __name__ == "__main__":
    unittest.main()
