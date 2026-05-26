import os
import json
import hashlib
import requests
from flask import Flask, jsonify, request, send_file, send_from_directory
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

prod_alarm_config = {
    'host': '10.38.78.228',
    'port': 53306,
    'user': 'Cmcc',
    'password': 'Cmcc_123!',
    'database': 'usmschis',
    'charset': 'utf8mb4',
    'connect_timeout': 30,
    'read_timeout': 60
}

def get_db_connection():
    return pymysql.connect(**db_config)

def get_prod_alarm_connection():
    return pymysql.connect(**prod_alarm_config)

def validate_date(date_str):
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
            district_short = district.rstrip('区').rstrip('市')
            where_clauses.append("(归属单元 = %s OR 归属单元 = %s)")
            params.extend([district, district_short])

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
            district_short = district.rstrip('区').rstrip('市')
            where_clauses.append("(district = %s OR district = %s)")
            params.extend([district, district_short])

        if grid:
            where_clauses.append("grid = %s")
            params.append(grid)

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        count_sql = f"SELECT COUNT(*) as total FROM energy_charge_daily_summary{where_sql}"
        cursor.execute(count_sql, params)
        total_count = cursor.fetchone()['total']

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
            district_short = district.rstrip('区').rstrip('市')
            where_clauses.append("(district = %s OR district = %s)")
            params.extend([district, district_short])

        if grid:
            where_clauses.append("grid = %s")
            params.append(grid)

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        last_day_sql = f"""
            SELECT MAX(stat_date) as last_date
            FROM energy_charge_daily_summary{where_sql}
        """
        cursor.execute(last_day_sql, params)
        last_day_result = cursor.fetchone()
        last_date = last_day_result['last_date'] if last_day_result and last_day_result['last_date'] else None

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

        poi_device_result = {'total_poi_count': 0, 'total_device_count': 0}
        if last_date:
            poi_device_sql = f"""
                SELECT SUM(overview_poi_count) as total_poi_count,
                       SUM(overview_device_count) as total_device_count
                FROM energy_charge_daily_summary
                WHERE stat_date = %s
                {where_sql.replace('WHERE', 'AND')}
            """
            poi_device_params = [last_date] + params
            cursor.execute(poi_device_sql, poi_device_params)
            poi_device_result = cursor.fetchone() or poi_device_result

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
    try:
        data_list = _get_alarms_from_production()
        data_source = 'production'

        if not data_list:
            data_list = _get_alarms_from_local()
            data_source = 'local'

        latest_date = datetime.now().strftime('%Y-%m-%d')

        return jsonify({
            'success': True,
            'data': data_list,
            'count': len(data_list),
            'latest_date': latest_date,
            'data_source': data_source
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


def _get_alarms_from_production():
    prod_sql = """
        SELECT
            tcd1.dict_note AS 级别,
            a.alarm_time AS 告警时间,
            CASE
                WHEN TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) DIV 86400 > 0 THEN
                    CONCAT(
                        TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) DIV 86400, '天',
                        (TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 86400) DIV 3600, '小时',
                        (TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 3600) DIV 60, '分',
                        TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 60, '秒'
                    )
                WHEN (TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 86400) DIV 3600 > 0 THEN
                    CONCAT(
                        (TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 86400) DIV 3600, '小时',
                        (TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 3600) DIV 60, '分',
                        TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 60, '秒'
                    )
                WHEN (TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 3600) DIV 60 > 0 THEN
                    CONCAT(
                        (TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 3600) DIV 60, '分',
                        TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 60, '秒'
                    )
                ELSE
                    CONCAT(TIMESTAMPDIFF(SECOND, a.alarm_time, NOW()) % 60, '秒')
            END AS 告警时长,
            tcp2.precinct_name AS 区域,
            tcp1.precinct_name AS 机房,
            tcd2.dict_note AS 站点类型,
            b.device_name AS 设备名称,
            tct.mete_name AS 监控量
        FROM usmschis.t_his_alarmcurrent a
        INNER JOIN usmsc.t_cfg_device b
            ON a.device_id = b.device_id
        LEFT JOIN usmsc.t_cfg_precinct tcp1
            ON tcp1.precinct_id = b.precinct_id
        LEFT JOIN usmsc.t_cfg_precinct tcp2
            ON tcp2.precinct_id = tcp1.up_precinct_id
        LEFT JOIN usmsc.t_cfg_telesignal tct
            ON tct.device_id = a.device_id AND tct.mete_id = a.mete_id
        LEFT JOIN usmsc.t_cfg_dict tcd1
            ON tcd1.col_name = 'alarm_level' AND a.alarm_level = tcd1.dict_code
        LEFT JOIN usmsc.t_cfg_station tcs
            ON tcs.station_id = b.precinct_id
        LEFT JOIN usmsc.t_cfg_dict tcd2
            ON tcd2.col_name = 'station_type' AND tcs.station_type = tcd2.dict_code
        ORDER BY a.alarm_time DESC
        LIMIT 100
    """
    try:
        conn = get_prod_alarm_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute(prod_sql)
        results = cursor.fetchall()
        cursor.close()
        conn.close()

        data_list = []
        for row in results:
            data_item = {}
            for key, value in row.items():
                if isinstance(value, datetime):
                    data_item[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                else:
                    data_item[key] = value
            data_list.append(data_item)
        return data_list
    except Exception as e:
        print(f'生产平台告警查询失败: {e}')
        return []


def _get_alarms_from_local():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        cursor.execute("SELECT MAX(DATE(告警时间)) as latest_date FROM meter_alarm")
        result = cursor.fetchone()
        latest_date = result['latest_date']

        if not latest_date:
            cursor.close()
            conn.close()
            return []

        query_sql = """
            SELECT
                级别, 告警时间, 告警时长, 区域, 机房,
                站点类型, 设备名称, 监控量
            FROM meter_alarm
            WHERE DATE(告警时间) = %s
            ORDER BY 告警时间 DESC
        """
        cursor.execute(query_sql, (latest_date,))
        results = cursor.fetchall()

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
        return data_list
    except Exception as e:
        print(f'本地告警查询失败: {e}')
        return []

@app.route('/api/events/latest_day', methods=['GET'])
def get_events_latest_day():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)

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

        query_sql = """
            SELECT
                id, 分析日期, 用电方, 用电类型, 归属单元, 归属网格,
                关联位置点, 电表编号, 电表事件
            FROM meter_event
            WHERE 分析日期 = %s
            ORDER BY 分析日期 DESC
        """
        cursor.execute(query_sql, (latest_date,))
        results = cursor.fetchall()

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

DFAI_API_URL = 'http://10.33.222.38:30523/czngcssapi/dfai/queryDfaiStatData.do'
DFAI_DETAIL_API_URL = 'http://10.33.222.38:30523/czngcssapi/dfai/queryDfaiData.do'
DFAI_KEY = 'CZYDDFAI20260518'

def generate_signature(timestamp):
    raw_string = timestamp + DFAI_KEY
    return hashlib.sha1(raw_string.encode('utf-8')).hexdigest()

def get_current_timestamp():
    now = datetime.now()
    return now.strftime('%Y%m%d%H%M%S')

def get_current_date_str():
    now = datetime.now()
    return now.strftime('%Y%m%d')

@app.route('/api/dfai/query', methods=['GET'])
def query_dfai_stat_data():
    try:
        read_date = request.args.get('date', get_current_date_str())
        
        timestamp = get_current_timestamp()
        signature = generate_signature(timestamp)
        
        payload = {
            'timestamp': timestamp,
            'signature': signature,
            'readDate': read_date
        }
        
        response = requests.post(DFAI_API_URL, json=payload, timeout=30)
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'data': response.json(),
                'readDate': read_date
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Remote API returned status code {response.status_code}',
                'readDate': read_date
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'error': f'Failed to connect to DFAI API: {str(e)}',
            'readDate': read_date if 'read_date' in locals() else get_current_date_str()
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal error: {str(e)}',
            'readDate': read_date if 'read_date' in locals() else get_current_date_str()
        }), 500

@app.route('/api/dfai/queryDetail', methods=['GET'])
def query_dfai_detail_data():
    try:
        read_date = request.args.get('date', get_current_date_str())
        
        timestamp = get_current_timestamp()
        signature = generate_signature(timestamp)
        
        payload = {
            'timestamp': timestamp,
            'signature': signature,
            'readDate': read_date
        }
        
        response = requests.post(DFAI_DETAIL_API_URL, json=payload, timeout=30)
        
        if response.status_code == 200:
            return jsonify({
                'success': True,
                'data': response.json(),
                'readDate': read_date
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Remote API returned status code {response.status_code}',
                'readDate': read_date
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'error': f'Failed to connect to DFAI Detail API: {str(e)}',
            'readDate': read_date if 'read_date' in locals() else get_current_date_str()
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal error: {str(e)}',
            'readDate': read_date if 'read_date' in locals() else get_current_date_str()
        }), 500

# 知识库文件列表接口（扫描 data 目录）
@app.route('/api/knowledge/files')
def knowledge_files():
    """返回分类后的文件列表"""
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    manifest_path = os.path.join(data_dir, '_manifest.json')

    # 如果存在 manifest.json 且内容有效，从中读取分类信息
    if os.path.isfile(manifest_path):
        try:
            content = open(manifest_path, 'r', encoding='utf-8').read().strip()
            if content:
                return jsonify(json.loads(content))
        except (json.JSONDecodeError, Exception):
            pass  # manifest 无效则回退到文件名分类

    # 否则按文件名关键字分类（兼容已有文件）
    files = os.listdir(data_dir)
    result = {'管理办法': [], '风险管控': []}
    for f in files:
        if f.startswith('~') or f == '_manifest.json':
            continue
        ext = os.path.splitext(f)[1].lower().lstrip('.')
        fsize = os.path.getsize(os.path.join(data_dir, f))
        size_str = f'{fsize/1024:.0f}KB' if fsize < 1024*1024 else f'{fsize/1024/1024:.1f}MB'
        file_info = {
            'name': f, 'size': size_str, 'uploadDate': '', 'type': ext,
            'filePath': f
        }
        if '风险' in f or '廉洁' in f:
            file_info['uploadDate'] = '2026-05-26'
            result['风险管控'].append(file_info)
        elif '办法' in f or '管理' in f or '规范' in f or '规程' in f:
            file_info['uploadDate'] = '2026-05-26'
            result['管理办法'].append(file_info)
    return jsonify(result)

# 知识库文件上传接口
@app.route('/api/knowledge/upload', methods=['POST'])
def knowledge_upload():
    """上传知识库文件"""
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    category = request.form.get('category', '')
    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'success': False, 'error': 'No file provided'}), 400

    # 保留原始文件名，如果重名则加唯一后缀
    filename = file.filename
    file_path = os.path.join(data_dir, filename)
    base_name, ext = os.path.splitext(filename)
    counter = 1
    while os.path.isfile(file_path):
        filename = f'{base_name}_{counter}{ext}'
        file_path = os.path.join(data_dir, filename)
        counter += 1

    file.save(file_path)

    # 更新 manifest
    manifest_path = os.path.join(data_dir, '_manifest.json')
    manifest = {}
    if os.path.isfile(manifest_path):
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content:
                    manifest = json.loads(content)
        except (json.JSONDecodeError, Exception):
            manifest = {}

    if category not in manifest:
        manifest[category] = []
    from datetime import date
    today = date.today().isoformat()
    manifest[category].append({
        'name': filename, 'size': f'{os.path.getsize(file_path)/1024:.0f}KB',
        'uploadDate': today, 'type': ext.lstrip('.'),
        'filePath': filename
    })

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    return jsonify({'success': True, 'filename': filename})

# 知识库文件删除接口
@app.route('/api/knowledge/delete/<path:filename>', methods=['DELETE'])
def knowledge_delete(filename):
    """删除知识库文件"""
    import urllib.parse
    filename = urllib.parse.unquote(filename)
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    file_path = os.path.join(data_dir, filename)
    if not os.path.realpath(file_path).startswith(os.path.realpath(data_dir)):
        return jsonify({'success': False, 'error': 'Invalid file path'}), 403
    # 如果文件存在则删除，不存在也继续清理 manifest
    if os.path.isfile(file_path):
        os.remove(file_path)

    # 更新 manifest（移除已删除文件的记录）
    manifest_path = os.path.join(data_dir, '_manifest.json')
    if os.path.isfile(manifest_path):
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content:
                    manifest = json.loads(content)
                    for cat in list(manifest.keys()):
                        manifest[cat] = [x for x in manifest[cat] if x.get('name') != filename]
                        if not manifest[cat]:
                            del manifest[cat]
                    with open(manifest_path, 'w', encoding='utf-8') as f:
                        json.dump(manifest, f, ensure_ascii=False, indent=2)
        except (json.JSONDecodeError, Exception):
            pass

    return jsonify({'success': True})

# 知识库文件下载接口
@app.route('/api/knowledge/download/<path:filename>')
def knowledge_download(filename):
    """下载知识库文件"""
    import urllib.parse
    filename = urllib.parse.unquote(filename)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, 'data', filename)
    # 安全检查：防止目录遍历
    data_dir = os.path.join(base_dir, 'data')
    if not os.path.realpath(file_path).startswith(os.path.realpath(data_dir)):
        return jsonify({'success': False, 'error': 'Invalid file path'}), 403
    if not os.path.isfile(file_path):
        return jsonify({'success': False, 'error': 'File not found'}), 404
    return send_file(file_path, as_attachment=True)

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
    print("  GET /api/alarms/latest_day - Get latest alarm data (production first, local fallback)")
    print("  GET /api/dfai/query - Query DFAI electricity fee statistics")
    print("  GET /api/dfai/queryDetail - Query DFAI electricity fee detail")
    print("\nServer starting on http://0.0.0.0:5000")
    print("=" * 60)

    app.run(host='0.0.0.0', port=5000, debug=True)
