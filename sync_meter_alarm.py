import pymysql
from datetime import datetime

LOCAL_CONFIG = {
    'host': '10.38.78.217',
    'port': 3220,
    'user': 'liujiantao',
    'password': 'Liujt!@#',
    'database': 'energy_management_2026',
    'charset': 'utf8mb4',
    'connect_timeout': 60,
    'read_timeout': 300
}

PROD_CONFIG = {
    'host': '10.38.78.228',
    'port': 53306,
    'user': 'Cmcc',
    'password': 'Cmcc_123!',
    'database': 'usmschis',
    'charset': 'utf8mb4',
    'connect_timeout': 60,
    'read_timeout': 300
}

PROD_SQL = """
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
"""

INSERT_SQL = """
    INSERT INTO meter_alarm (
        序号, 级别, 告警时间, 告警时长, 告警值, 地市, 区域, 机房,
        站点类型, 设备名称, 设备类型, 监控量, 告警描述, 消除时间,
        确认人, 确认时间, 确认说明, 告警逻辑分类, 告警逻辑子类,
        告警标准名, 告警编码ID, 屏蔽类型, 翻转次数, 告警流水号,
        告警接收时间, 业务类型, 告警标准编码, 厂家名称, 更新时间
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s
    )
"""

def sync_alarms():
    now = datetime.now()
    print(f'[{now.strftime("%H:%M:%S")}] 开始同步 meter_alarm...')

    prod_conn = pymysql.connect(**PROD_CONFIG)
    prod_cursor = prod_conn.cursor(pymysql.cursors.DictCursor)
    prod_cursor.execute(PROD_SQL)
    rows = prod_cursor.fetchall()
    prod_cursor.close()
    prod_conn.close()

    if not rows:
        print(f'[{now.strftime("%H:%M:%S")}] 生产平台无数据，跳过同步')
        return

    local_conn = pymysql.connect(**LOCAL_CONFIG)
    local_cursor = local_conn.cursor()
    local_cursor.execute('TRUNCATE TABLE meter_alarm')
    local_conn.commit()

    sync_time = now.strftime('%Y-%m-%d %H:%M:%S')
    batch_size = 500
    batch_values = []

    for seq, row in enumerate(rows, start=1):
        alarm_time = row['告警时间']
        if isinstance(alarm_time, datetime):
            alarm_time = alarm_time.strftime('%Y-%m-%d %H:%M:%S')

        values = (
            seq,                                    # 序号
            row['级别'],                             # 级别
            alarm_time,                              # 告警时间
            row['告警时长'],                          # 告警时长
            None,                                    # 告警值
            None,                                    # 地市
            row['区域'],                             # 区域
            row['机房'],                             # 机房
            row['站点类型'],                          # 站点类型
            row['设备名称'],                          # 设备名称
            None,                                    # 设备类型
            row['监控量'],                           # 监控量
            None,                                    # 告警描述
            None,                                    # 消除时间
            None,                                    # 确认人
            None,                                    # 确认时间
            None,                                    # 确认说明
            None,                                    # 告警逻辑分类
            None,                                    # 告警逻辑子类
            None,                                    # 告警标准名
            None,                                    # 告警编码ID
            None,                                    # 屏蔽类型
            None,                                    # 翻转次数
            None,                                    # 告警流水号
            None,                                    # 告警接收时间
            None,                                    # 业务类型
            None,                                    # 告警标准编码
            None,                                    # 厂家名称
            sync_time,                               # 更新时间
        )
        batch_values.append(values)

        if len(batch_values) >= batch_size:
            local_cursor.executemany(INSERT_SQL, batch_values)
            local_conn.commit()
            batch_values = []

    if batch_values:
        local_cursor.executemany(INSERT_SQL, batch_values)
        local_conn.commit()

    local_cursor.execute("SELECT COUNT(*) as cnt FROM meter_alarm")
    final_count = local_cursor.fetchone()[0]
    local_cursor.close()
    local_conn.close()

    print(f'[{now.strftime("%H:%M:%S")}] 同步完成: {final_count} 条')

def run_scheduled(interval_seconds=300):
    import time
    from datetime import datetime as dt
    print(f'[{dt.now().strftime("%H:%M:%S")}] meter_alarm 定时同步启动，间隔: {interval_seconds}秒 (5分钟)')
    print('按 Ctrl+C 停止')

    next_sync = time.time()
    try:
        while True:
            now = time.time()
            if now >= next_sync:
                try:
                    sync_alarms()
                except Exception as e:
                    print(f'[{dt.now().strftime("%H:%M:%S")}] 同步异常: {e}')
                next_sync = now + interval_seconds
            time.sleep(max(1, next_sync - time.time()))
    except KeyboardInterrupt:
        print(f'\n[{dt.now().strftime("%H:%M:%S")}] 定时同步已停止')

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='meter_alarm 告警数据同步工具')
    parser.add_argument('--schedule', '-s', action='store_true', help='定时模式：每5分钟自动执行')
    parser.add_argument('--interval', '-i', type=int, default=300, help='同步间隔秒数，默认300')
    args = parser.parse_args()

    if args.schedule:
        run_scheduled(args.interval)
    else:
        sync_alarms()
