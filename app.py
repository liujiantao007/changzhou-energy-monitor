import os
from flask import Flask, jsonify
from flask_cors import CORS
import pymysql
from datetime import datetime

app = Flask(__name__)
CORS(app)

db_config = {
    'host': os.environ.get('DB_HOST', '10.38.78.217'),
    'port': int(os.environ.get('DB_PORT', 3220)),
    'user': os.environ.get('DB_USER', 'liujiantao'),
    'password': os.environ.get('DB_PASSWORD', 'Liujt!@#'),
    'database': os.environ.get('DB_NAME', 'energy_management_2026'),
    'charset': 'utf8mb4',
    'connect_timeout': 10
}

def get_db_connection():
    return pymysql.connect(**db_config)

@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        
        cursor.execute("SELECT * FROM energy_charge")
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
            'count': len(data_list)
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
    print("  GET /api/data - Get all energy data")
    print("  GET /api/health - Health check")
    print("\nServer starting on http://0.0.0.0:5000")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
