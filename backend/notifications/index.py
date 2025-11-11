'''
Business: API для работы с уведомлениями - получение, отметка как прочитанное
Args: event - dict с httpMethod, headers, queryStringParameters
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с уведомлениями
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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
        
        cursor.execute("SELECT id FROM users WHERE telegram_id = %s", (telegram_id,))
        user_result = cursor.fetchone()
        
        if not user_result:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'})
            }
        
        user_id = user_result['id']
        
        if method == 'GET':
            cursor.execute(
                """SELECT id, type, title, message, is_read, created_at
                   FROM notifications
                   WHERE user_id = %s
                   ORDER BY created_at DESC
                   LIMIT 50""",
                (user_id,)
            )
            notifications = cursor.fetchall()
            
            notifications_list = []
            for n in notifications:
                notifications_list.append({
                    'id': n['id'],
                    'type': n['type'],
                    'title': n['title'],
                    'message': n['message'],
                    'isRead': n['is_read'],
                    'createdAt': n['created_at'].isoformat()
                })
            
            cursor.execute(
                "SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND is_read = false",
                (user_id,)
            )
            unread_count = cursor.fetchone()['count']
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'notifications': notifications_list,
                    'unreadCount': unread_count
                })
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            notification_id = body_data.get('notificationId')
            
            cursor.execute(
                "UPDATE notifications SET is_read = true WHERE id = %s AND user_id = %s",
                (notification_id, user_id)
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
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'mark_all_read':
                cursor.execute(
                    "UPDATE notifications SET is_read = true WHERE user_id = %s AND is_read = false",
                    (user_id,)
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
