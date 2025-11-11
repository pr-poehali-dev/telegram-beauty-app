'''
Business: API для управления профилем пользователя - получение и обновление данных
Args: event - dict с httpMethod, headers, body
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с данными профиля
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Создание подключения к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-User',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = None
    
    try:
        conn = get_db_connection()
        telegram_user_header = event.get('headers', {}).get('X-Telegram-User', '{}')
        telegram_user = json.loads(telegram_user_header)
        
        if not telegram_user.get('id'):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        telegram_id = telegram_user.get('id')
        cursor = conn.cursor()
        
        if method == 'GET':
            cursor.execute(
                """SELECT id, telegram_id, first_name, last_name, username, role, phone, created_at
                   FROM users WHERE telegram_id = %s""",
                (telegram_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                first_name = telegram_user.get('first_name', 'User')
                last_name = telegram_user.get('last_name', '')
                username = telegram_user.get('username', '')
                
                cursor.execute(
                    """INSERT INTO users (telegram_id, first_name, last_name, username, role)
                       VALUES (%s, %s, %s, %s, %s)
                       RETURNING id, telegram_id, first_name, last_name, username, role, phone, created_at""",
                    (telegram_id, first_name, last_name, username, 'client')
                )
                user = cursor.fetchone()
                conn.commit()
            
            cursor.execute(
                "SELECT COUNT(*) as count FROM bookings WHERE client_id = %s",
                (user['id'],)
            )
            bookings_count = cursor.fetchone()['count']
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': user['id'],
                    'telegramId': user['telegram_id'],
                    'firstName': user['first_name'],
                    'lastName': user['last_name'] or '',
                    'username': user['username'] or '',
                    'role': user['role'],
                    'phone': user['phone'] or '',
                    'bookingsCount': bookings_count,
                    'createdAt': user['created_at'].isoformat()
                })
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            
            cursor.execute("SELECT id FROM users WHERE telegram_id = %s", (telegram_id,))
            user = cursor.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
            
            user_id = user['id']
            first_name = body_data.get('firstName')
            last_name = body_data.get('lastName', '')
            phone = body_data.get('phone', '')
            
            cursor.execute(
                """UPDATE users 
                   SET first_name = %s, last_name = %s, phone = %s, updated_at = CURRENT_TIMESTAMP
                   WHERE id = %s""",
                (first_name, last_name, phone, user_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    
    finally:
        if conn:
            conn.close()
