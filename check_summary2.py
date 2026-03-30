import pymysql

conn = pymysql.connect(
    host='10.38.78.217',
    port=3220,
    user='liujiantao',
    password='Liujt!@#',
    database='energy_management_2026'
)
cursor = conn.cursor()

print("="*60)
print("Summary table statistics:")
print("="*60)

cursor.execute("SELECT COUNT(*) FROM energy_charge_daily_summary")
total = cursor.fetchone()[0]
print(f"Total records: {total}")

cursor.execute("SELECT COUNT(*) FROM energy_charge_daily_summary WHERE district IS NOT NULL AND district != ''")
with_district = cursor.fetchone()[0]
print(f"Records with district: {with_district} ({with_district*100/total:.1f}%)")

cursor.execute("SELECT COUNT(*) FROM energy_charge_daily_summary WHERE grid IS NOT NULL AND grid != ''")
with_grid = cursor.fetchone()[0]
print(f"Records with grid: {with_grid} ({with_grid*100/total:.1f}%)")

cursor.execute("SELECT COUNT(*) FROM energy_charge_daily_summary WHERE poi_name IS NOT NULL AND poi_name != ''")
with_poi = cursor.fetchone()[0]
print(f"Records with poi_name: {with_poi} ({with_poi*100/total:.1f}%)")

cursor.execute("SELECT COUNT(*) FROM energy_charge_daily_summary WHERE overview_total_energy > 0")
with_energy = cursor.fetchone()[0]
print(f"Records with energy > 0: {with_energy} ({with_energy*100/total:.1f}%)")

print("\n" + "="*60)
print("Sample records WITH district data:")
print("="*60)
cursor.execute("SELECT stat_date, district, grid, poi_name, overview_total_energy FROM energy_charge_daily_summary WHERE district IS NOT NULL AND district != '' LIMIT 5")
for row in cursor.fetchall():
    print(f"  {row}")

print("\n" + "="*60)
print("Sample records WITHOUT district data (empty):")
print("="*60)
cursor.execute("SELECT stat_date, district, grid, poi_name, overview_total_energy FROM energy_charge_daily_summary WHERE district IS NULL OR district = '' LIMIT 5")
for row in cursor.fetchall():
    print(f"  {row}")

cursor.close()
conn.close()
