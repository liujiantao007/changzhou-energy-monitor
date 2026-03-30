"""
Add electricity type fields to energy_charge_daily_summary table
"""

import pymysql

DB_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4'
}

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor()

try:
    print("=" * 70)
    print("Checking electricity types in energy_charge table...")
    print("=" * 70)
    
    # Check electricity types
    cursor.execute("SELECT DISTINCT `用电类型` FROM energy_charge WHERE `用电类型` IS NOT NULL")
    types = cursor.fetchall()
    print(f"\nElectricity types found: {[t[0] for t in types]}")
    
    # Count records by type
    for type_val in types:
        if type_val[0]:
            cursor.execute(f"SELECT COUNT(*) FROM energy_charge WHERE `用电类型` = '{type_val[0]}'")
            count = cursor.fetchone()[0]
            print(f"  {type_val[0]}: {count:,} records")
    
    print("\n" + "=" * 70)
    print("Adding new fields to energy_charge_daily_summary table...")
    print("=" * 70)
    
    # Add new fields
    print("\n1. Adding direct_power_supply_energy field...")
    try:
        cursor.execute("""
            ALTER TABLE energy_charge_daily_summary 
            ADD COLUMN direct_power_supply_energy DECIMAL(15,4) DEFAULT 0 COMMENT '直供电累计能耗'
        """)
        conn.commit()
        print("   ✅ direct_power_supply_energy field added successfully")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("   ⚠️  direct_power_supply_energy field already exists")
        else:
            raise
    
    print("\n2. Adding direct_power_supply_cost field...")
    try:
        cursor.execute("""
            ALTER TABLE energy_charge_daily_summary 
            ADD COLUMN direct_power_supply_cost DECIMAL(15,4) DEFAULT 0 COMMENT '直供电累计电费'
        """)
        conn.commit()
        print("   ✅ direct_power_supply_cost field added successfully")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("   ⚠️  direct_power_supply_cost field already exists")
        else:
            raise
    
    print("\n3. Adding indirect_power_supply_energy field...")
    try:
        cursor.execute("""
            ALTER TABLE energy_charge_daily_summary 
            ADD COLUMN indirect_power_supply_energy DECIMAL(15,4) DEFAULT 0 COMMENT '转供电累计能耗'
        """)
        conn.commit()
        print("   ✅ indirect_power_supply_energy field added successfully")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("   ⚠️  indirect_power_supply_energy field already exists")
        else:
            raise
    
    print("\n4. Adding indirect_power_supply_cost field...")
    try:
        cursor.execute("""
            ALTER TABLE energy_charge_daily_summary 
            ADD COLUMN indirect_power_supply_cost DECIMAL(15,4) DEFAULT 0 COMMENT '转供电累计电费'
        """)
        conn.commit()
        print("   ✅ indirect_power_supply_cost field added successfully")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("   ⚠️  indirect_power_supply_cost field already exists")
        else:
            raise
    
    print("\n" + "=" * 70)
    print("Verifying new fields...")
    print("=" * 70)
    
    # Verify fields were added
    cursor.execute("SHOW COLUMNS FROM energy_charge_daily_summary WHERE Field LIKE '%power_supply%'")
    fields = cursor.fetchall()
    for field in fields:
        print(f"  {field[0]}: {field[1]} (Nullable: {field[2]}, Default: {field[4]})")
    
    print("\n" + "=" * 70)
    print("✅ Schema update completed successfully!")
    print("=" * 70)

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    if conn.open:
        conn.close()
        print("\nDatabase connection closed")
