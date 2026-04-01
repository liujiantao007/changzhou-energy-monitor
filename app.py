import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql
from datetime import datetime, date

app = Flask(__name__)
CORS(app)

db_config = {
    'host': os.environ.get('DB_HOST', '10.38.78.217'),
    'port': int(os.environ.get('DB_PORT', 3220)),
    'user': os.environ.get('DB_USER', 'liujiantao'),
    'password': os.environ.get('DB_PASSWORD', 'Liujt!@#'),
    'database': os.environ.get('DB_NAME', 'energy_management_2026'),
    'charset': 'utf8mb4',
    'connect_timeout': 60,
    'read_timeout': 300
}

def get_db_connection():
    return pymysql.connect(**db_config)

def validate_date(date_str):
    """验证日期格式是否有效"""
    if not date_str:
        return True, None
    try:
        parsed_date = datetime.strptime(date_str, '%Y-%m-%d')
        return True, parsed_date
    except ValueError as e:
        return False, str(e)

@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 0, type=int)
        date_from = request.args.get('date_from', None, type=str)
        date_to = request.args.get('date_to', None, type=str)
        district = request.args.get('district', None, type=str)
        grid = request.args.get('grid', None, type=str)
        meter = request.args.get('meter', None, type=str)

        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        where_clauses = []
        params = []

        if date_from:
            where_clauses.append("日期 >= %s")
            params.append(date_from)

        if date_to:
            where_clauses.append("日期 <= %s")
            params.append(date_to)

        if district:
            where_clauses.append("归属单元 = %s")
            params.append(district)

        if grid:
            where_clauses.append("归属网格 = %s")
            params.append(grid)

        if meter:
            where_clauses.append("电表 = %s")
            params.append(meter)

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        count_sql = f"SELECT COUNT(*) as total FROM energy_charge{where_sql}"
        cursor.execute(count_sql, params)
        total_count = cursor.fetchone()['total']

        if page_size <= 0:
            query_sql = f"SELECT * FROM energy_charge{where_sql} ORDER BY 日期 DESC"
            query_params = params
            page = 1
            total_pages = 1
        else:
            offset = (page - 1) * page_size
            query_sql = f"SELECT * FROM energy_charge{where_sql} ORDER BY 日期 DESC LIMIT %s OFFSET %s"
            query_params = params + [page_size, offset]
            total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 1

        cursor.execute(query_sql, query_params)
        results = cursor.fetchall()

        cursor.close()
        conn.close()

        data_list = []
        for row in results:
            data_item = {}

            for key, value in row.items():
                if key == 'id':
                    continue
                elif key == '日期':
                    data_item['A'] = format_date(value)
                elif key == '电表':
                    data_item['B'] = str(value) if value else ''
                elif key == '用电类型':
                    data_item['K'] = str(value) if value else ''
                elif key == '用电属性':
                    data_item['I'] = str(value) if value else ''
                elif key == '归属单元':
                    data_item['J'] = str(value) if value else ''
                elif key == '归属网格':
                    data_item['GRID'] = str(value) if value else ''
                elif key == 'poi名称':
                    data_item['L'] = str(value) if value else ''
                elif key == '度数':
                    data_item['AB'] = float(value) if value is not None else 0
                elif key == '电费':
                    data_item['AC'] = float(value) if value is not None else 0

            data_list.append(data_item)

        return jsonify({
            'success': True,
            'data': data_list,
            'count': len(data_list),
            'total': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': total_pages
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/summary_data', methods=['GET'])
def get_summary_data():
    try:
        date_from = request.args.get('date_from', None, type=str)
        date_to = request.args.get('date_to', None, type=str)
        district = request.args.get('district', None, type=str)
        grid = request.args.get('grid', None, type=str)
        latest_date_only = request.args.get('latest_date_only', 'false', type=str).lower() == 'true'

        # 验证日期参数
        if date_from:
            is_valid, result = validate_date(date_from)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': f'Invalid date_from: {result}',
                    'message': f'日期参数 date_from 无效: {result}'
                }), 400
        
        if date_to:
            is_valid, result = validate_date(date_to)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'error': f'Invalid date_to: {result}',
                    'message': f'日期参数 date_to 无效: {result}'
                }), 400

        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        where_clauses = []
        params = []

        where_clauses.append("district IS NOT NULL")
        where_clauses.append("grid IS NOT NULL")

        if latest_date_only:
            latest_date_sql = """
                SELECT DISTINCT stat_date
                FROM energy_charge_daily_summary
                WHERE district IS NOT NULL AND grid IS NOT NULL
                ORDER BY stat_date DESC
                LIMIT 1
            """
            if date_from:
                latest_date_sql += " AND stat_date >= %s"
                params.append(date_from)
            if date_to:
                latest_date_sql += " AND stat_date <= %s"
                params.append(date_to)

            cursor.execute(latest_date_sql, params)
            result = cursor.fetchone()
            latest_date = result['stat_date'] if result else None

            if latest_date:
                where_clauses.append("stat_date = %s")
                params.append(latest_date)
            else:
                cursor.close()
                conn.close()
                return jsonify({
                    'success': True,
                    'data': [],
                    'count': 0,
                    'latest_date': None,
                    'message': 'No valid date found with district and grid not null'
                })
        else:
            if date_from:
                where_clauses.append("stat_date >= %s")
                params.append(date_from)

            if date_to:
                where_clauses.append("stat_date <= %s")
                params.append(date_to)

        if district:
            where_clauses.append("district = %s")
            params.append(district)

        if grid:
            where_clauses.append("grid = %s")
            params.append(grid)

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        count_sql = f"SELECT COUNT(*) as total FROM energy_charge_daily_summary{where_sql}"
        cursor.execute(count_sql, params)
        total_count = cursor.fetchone()['total']

        # 获取最新日期（用于日期范围查询）
        latest_date = None
        if date_from or date_to:
            date_range_sql = f"SELECT MAX(stat_date) as max_date FROM energy_charge_daily_summary{where_sql}"
            cursor.execute(date_range_sql, params)
            result = cursor.fetchone()
            latest_date = result['max_date'] if result else None

        query_sql = f"""
            SELECT stat_date, district, grid, poi_name,
                   electricity_type, electricity_attr,
                   total_energy, total_cost,
                   overview_total_energy, overview_total_cost,
                   overview_poi_count, overview_device_count,
                   electricity_by_district_energy, electricity_by_grid_energy, electricity_by_poi_energy,
                   poi_stat_energy, poi_stat_cost,
                   electricity_type_energy, electricity_type_cost,
                   trend_daily_energy, trend_daily_cost,
                   trend_monthly_energy, trend_monthly_cost,
                   trend_yearly_energy, trend_yearly_cost,
                   record_count,
                   mobile_cumulative_energy, mobile_poi_count,
                   tower_cumulative_energy, tower_poi_count,
                   mobile_electricity_fee, tower_electricity_fee,
                   direct_power_supply_energy, direct_power_supply_cost,
                   indirect_power_supply_energy, indirect_power_supply_cost
            FROM energy_charge_daily_summary{where_sql}
            ORDER BY stat_date DESC, district, grid
        """

        cursor.execute(query_sql, params)
        results = cursor.fetchall()

        cursor.close()
        conn.close()

        data_list = []
        for row in results:
            data_item = {
                'A': row['stat_date'].strftime('%Y-%m-%d') if row['stat_date'] else '',
                'J': str(row['district']) if row['district'] else '',
                'GRID': str(row['grid']) if row['grid'] else '',
                'L': str(row['poi_name']) if row['poi_name'] else '',
                'K': str(row['electricity_type']) if row['electricity_type'] else '',
                'I': str(row['electricity_attr']) if row['electricity_attr'] else '',
                'AB': float(row['total_energy']) if row['total_energy'] is not None else 0,
                'AC': float(row['total_cost']) if row['total_cost'] is not None else 0,
                'overview_total_energy': float(row['overview_total_energy']) if row['overview_total_energy'] is not None else 0,
                'overview_total_cost': float(row['overview_total_cost']) if row['overview_total_cost'] is not None else 0,
                'overview_poi_count': row['overview_poi_count'] or 0,
                'overview_device_count': row['overview_device_count'] or 0,
                'record_count': row['record_count'] or 0,
                'mobile_cumulative_energy': float(row['mobile_cumulative_energy']) if row['mobile_cumulative_energy'] is not None else 0,
                'mobile_poi_count': row['mobile_poi_count'] or 0,
                'tower_cumulative_energy': float(row['tower_cumulative_energy']) if row['tower_cumulative_energy'] is not None else 0,
                'tower_poi_count': row['tower_poi_count'] or 0,
                'mobile_electricity_fee': float(row['mobile_electricity_fee']) if row['mobile_electricity_fee'] is not None else 0,
                'tower_electricity_fee': float(row['tower_electricity_fee']) if row['tower_electricity_fee'] is not None else 0,
                'direct_power_supply_energy': float(row['direct_power_supply_energy']) if row['direct_power_supply_energy'] is not None else 0,
                'direct_power_supply_cost': float(row['direct_power_supply_cost']) if row['direct_power_supply_cost'] is not None else 0,
                'indirect_power_supply_energy': float(row['indirect_power_supply_energy']) if row['indirect_power_supply_energy'] is not None else 0,
                'indirect_power_supply_cost': float(row['indirect_power_supply_cost']) if row['indirect_power_supply_cost'] is not None else 0
            }
            data_list.append(data_item)

        latest_date_str = latest_date.strftime('%Y-%m-%d') if latest_date else None

        return jsonify({
            'success': True,
            'data': data_list,
            'count': len(data_list),
            'total': total_count,
            'latest_date': latest_date_str
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/latest_valid_date', methods=['GET'])
def get_latest_valid_date():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        sql = """
            SELECT DISTINCT stat_date
            FROM energy_charge_daily_summary
            WHERE district IS NOT NULL AND grid IS NOT NULL
            ORDER BY stat_date DESC
            LIMIT 1
        """

        cursor.execute(sql)
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        latest_date = result['stat_date'] if result else None
        latest_date_str = latest_date.strftime('%Y-%m-%d') if latest_date else None

        return jsonify({
            'success': True,
            'latest_date': latest_date_str
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/summary', methods=['GET'])
def get_summary():
    try:
        date_from = request.args.get('date_from', None, type=str)
        date_to = request.args.get('date_to', None, type=str)
        district = request.args.get('district', None, type=str)
        grid = request.args.get('grid', None, type=str)

        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        where_clauses = []
        params = []

        where_clauses.append("district IS NOT NULL")
        where_clauses.append("grid IS NOT NULL")

        # 如果没有指定日期范围，默认只查询最新日期的数据
        if not date_from and not date_to:
            latest_date_sql = """
                SELECT DISTINCT stat_date
                FROM energy_charge_daily_summary
                WHERE district IS NOT NULL AND grid IS NOT NULL
                ORDER BY stat_date DESC
                LIMIT 1
            """
            cursor.execute(latest_date_sql)
            result = cursor.fetchone()
            if result:
                date_from = result['stat_date'].strftime('%Y-%m-%d')
                where_clauses.append("stat_date = %s")
                params.append(date_from)
        else:
            if date_from:
                where_clauses.append("stat_date >= %s")
                params.append(date_from)

            if date_to:
                where_clauses.append("stat_date <= %s")
                params.append(date_to)

        if district:
            where_clauses.append("district = %s")
            params.append(district)

        if grid:
            where_clauses.append("grid = %s")
            params.append(grid)

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        # 获取日期范围内的最后一天
        last_day_sql = f"""
            SELECT MAX(stat_date) as last_date
            FROM energy_charge_daily_summary{where_sql}
        """
        cursor.execute(last_day_sql, params)
        last_day_result = cursor.fetchone()
        last_date = last_day_result['last_date'] if last_day_result and last_day_result['last_date'] else None

        # 获取总能耗、总电费（按日期范围求和 - 这些是可以累加的）
        energy_cost_sql = f"""
            SELECT SUM(total_energy) as total_energy,
                   SUM(total_cost) as total_cost,
                   SUM(record_count) as record_count,
                   SUM(mobile_cumulative_energy) as total_mobile_energy,
                   SUM(tower_cumulative_energy) as total_tower_energy,
                   SUM(mobile_electricity_fee) as total_mobile_fee,
                   SUM(tower_electricity_fee) as total_tower_fee,
                   SUM(mobile_poi_count) as total_mobile_poi,
                   SUM(tower_poi_count) as total_tower_poi,
                   SUM(direct_power_supply_energy) as total_direct_energy,
                   SUM(direct_power_supply_cost) as total_direct_cost,
                   SUM(indirect_power_supply_energy) as total_indirect_energy,
                   SUM(indirect_power_supply_cost) as total_indirect_cost
            FROM energy_charge_daily_summary{where_sql}
        """
        cursor.execute(energy_cost_sql, params)
        energy_cost_result = cursor.fetchone()

        # 获取最后一天的 POI 和设备数量（时点数据，不累加整个月）
        poi_device_sql = f"""
            SELECT SUM(overview_poi_count) as total_poi_count,
                   SUM(overview_device_count) as total_device_count
            FROM energy_charge_daily_summary
            WHERE stat_date = %s
            {where_sql.replace('WHERE', 'AND')}
        """
        poi_device_params = [last_date] + params if last_date else params
        cursor.execute(poi_device_sql, poi_device_params)
        poi_device_result = cursor.fetchone()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'total_energy': float(energy_cost_result['total_energy']) if energy_cost_result['total_energy'] else 0,
            'total_cost': float(energy_cost_result['total_cost']) if energy_cost_result['total_cost'] else 0,
            'record_count': energy_cost_result['record_count'] or 0,
            'total_poi_count': poi_device_result['total_poi_count'] or 0,
            'total_device_count': poi_device_result['total_device_count'] or 0,
            'total_mobile_energy': float(energy_cost_result['total_mobile_energy']) if energy_cost_result['total_mobile_energy'] else 0,
            'total_tower_energy': float(energy_cost_result['total_tower_energy']) if energy_cost_result['total_tower_energy'] else 0,
            'total_mobile_fee': float(energy_cost_result['total_mobile_fee']) if energy_cost_result['total_mobile_fee'] else 0,
            'total_tower_fee': float(energy_cost_result['total_tower_fee']) if energy_cost_result['total_tower_fee'] else 0,
            'total_mobile_poi': energy_cost_result['total_mobile_poi'] or 0,
            'total_tower_poi': energy_cost_result['total_tower_poi'] or 0,
            'total_direct_energy': float(energy_cost_result['total_direct_energy']) if energy_cost_result['total_direct_energy'] else 0,
            'total_direct_cost': float(energy_cost_result['total_direct_cost']) if energy_cost_result['total_direct_cost'] else 0,
            'total_indirect_energy': float(energy_cost_result['total_indirect_energy']) if energy_cost_result['total_indirect_energy'] else 0,
            'total_indirect_cost': float(energy_cost_result['total_indirect_cost']) if energy_cost_result['total_indirect_cost'] else 0,
            'last_date': last_date.strftime('%Y-%m-%d') if last_date else None
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        return jsonify({
            'status': 'healthy',
            'database': 'connected'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 503

@app.route('/api/alarms/latest_day', methods=['GET'])
def get_alarms_latest_day():
    """
    获取 meter_alarm 表中最新一天的告警数据
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        # 先获取最新一天的日期
        cursor.execute("SELECT MAX(DATE(告警时间)) as latest_date FROM meter_alarm")
        result = cursor.fetchone()
        latest_date = result['latest_date']

        if not latest_date:
            return jsonify({
                'success': True,
                'data': [],
                'count': 0,
                'latest_date': None,
                'message': '没有告警数据'
            })

        # 获取最新一天的所有告警
        query_sql = """
            SELECT
                id, 序号, 级别, 告警时间, 告警时长, 告警值,
                地市, 区域, 机房, 站点类型, 设备名称, 设备类型,
                监控量, 告警描述, 消除时间, 确认人, 确认时间,
                确认说明, 告警逻辑分类, 告警逻辑子类, 告警标准名,
                告警编码ID, 屏蔽类型, 翻转次数, 告警流水号,
                告警接收时间, 业务类型, 告警标准编码, 厂家名称
            FROM meter_alarm
            WHERE DATE(告警时间) = %s
            ORDER BY 告警时间 DESC
        """
        cursor.execute(query_sql, (latest_date,))
        results = cursor.fetchall()

        # 转换 datetime 类型为字符串
        data_list = []
        for row in results:
            data_item = {}
            for key, value in row.items():
                if isinstance(value, datetime):
                    data_item[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                else:
                    data_item[key] = value
            data_list.append(data_item)

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'data': data_list,
            'count': len(data_list),
            'latest_date': latest_date.strftime('%Y-%m-%d') if isinstance(latest_date, datetime) else str(latest_date)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/events/latest_day', methods=['GET'])
def get_events_latest_day():
    """
    获取 meter_event 表中最新一天的事件数据
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        # 先获取最新一天的日期
        cursor.execute("SELECT MAX(分析日期) as latest_date FROM meter_event")
        result = cursor.fetchone()
        latest_date = result['latest_date']

        if not latest_date:
            return jsonify({
                'success': True,
                'data': [],
                'count': 0,
                'latest_date': None,
                'message': '没有事件数据'
            })

        # 获取最新一天的所有事件
        query_sql = """
            SELECT
                id, 分析日期, 供电类型, 区县, 归属,
                关联位置点, 电表编号, 电表事件
            FROM meter_event
            WHERE 分析日期 = %s
            ORDER BY 分析日期 DESC
        """
        cursor.execute(query_sql, (latest_date,))
        results = cursor.fetchall()

        # 转换 date/datetime 类型为字符串
        data_list = []
        for row in results:
            data_item = {}
            for key, value in row.items():
                if isinstance(value, (datetime, date)):
                    data_item[key] = value.strftime('%Y-%m-%d')
                else:
                    data_item[key] = value
            data_list.append(data_item)

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'data': data_list,
            'count': len(data_list),
            'latest_date': latest_date.strftime('%Y-%m-%d') if isinstance(latest_date, (datetime, date)) else str(latest_date)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def format_date(date_value):
    if not date_value:
        return ''

    if isinstance(date_value, datetime):
        return date_value.strftime('%Y-%m-%d')

    date_str = str(date_value)

    for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%Y%m%d']:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime('%Y-%m-%d')
        except:
            continue

    return date_str

if __name__ == '__main__':
    print("Starting Energy Data API Server...")
    print("Database config:")
    print(f"  Host: {db_config['host']}:{db_config['port']}")
    print(f"  Database: {db_config['database']}")
    print("\nAPI Endpoints:")
    print("  GET /api/data - Get all energy data (page_size=0 returns all)")
    print("  GET /api/summary_data - Get summary data from daily_summary table")
    print("  GET /api/summary - Get summary statistics")
    print("  GET /api/latest_valid_date - Get latest date with valid district/grid")
    print("  GET /api/health - Health check")
    print("\nServer starting on http://0.0.0.0:5000")
    print("=" * 60)

    app.run(host='0.0.0.0', port=5000, debug=True)
