'''
Business: API для управления бронированиями - создание, получение, отмена записей
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с данными бронирований
'''

import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, date, time, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Создание подключения к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def get_or_create_user(conn, telegram_user: Dict[str, Any]) -> int:
    """Получить или создать пользователя из данных Telegram"""
    cursor = conn.cursor()
    
    telegram_id = telegram_user.get('id')
    first_name = telegram_user.get('first_name', 'User')
    last_name = telegram_user.get('last_name', '')
    username = telegram_user.get('username', '')
    
    cursor.execute(
        "SELECT id FROM users WHERE telegram_id = %s",
        (telegram_id,)
    )
    result = cursor.fetchone()
    
    if result:
        return result['id']
    
    cursor.execute(
        """INSERT INTO users (telegram_id, first_name, last_name, username, role) 
           VALUES (%s, %s, %s, %s, %s) RETURNING id""",
        (telegram_id, first_name, last_name, username, 'client')
    )
    user_id = cursor.fetchone()['id']
    conn.commit()
    return user_id

def get_available_slots(conn, master_id: int, booking_date: str) -> List[str]:
    """Получить доступные временные слоты для мастера на дату"""
    cursor = conn.cursor()
    
    parsed_date = datetime.strptime(booking_date, '%Y-%m-%d').date()
    day_of_week = parsed_date.isoweekday()
    
    cursor.execute(
        """SELECT start_time, end_time FROM master_schedule 
           WHERE master_id = %s AND day_of_week = %s AND is_active = true""",
        (master_id, day_of_week)
    )
    schedule = cursor.fetchone()
    
    if not schedule:
        return []
    
    cursor.execute(
        """SELECT start_time, end_time FROM bookings 
           WHERE master_id = %s AND booking_date = %s AND status != %s""",
        (master_id, booking_date, 'cancelled')
    )
    booked_slots = cursor.fetchall()
    
    all_slots = []
    current = datetime.combine(parsed_date, schedule['start_time'])
    end = datetime.combine(parsed_date, schedule['end_time'])
    
    while current < end:
        slot_time = current.strftime('%H:%M')
        is_available = True
        
        for booked in booked_slots:
            booked_start = datetime.combine(parsed_date, booked['start_time'])
            booked_end = datetime.combine(parsed_date, booked['end_time'])
            
            if booked_start <= current < booked_end:
                is_available = False
                break
        
        if is_available:
            all_slots.append(slot_time)
        
        current += timedelta(minutes=30)
    
    return all_slots

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Telegram-User',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = None
    
    try:
        conn = get_db_connection()
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', 'list')
            
            if action == 'slots':
                master_id = int(params.get('master_id', 0))
                booking_date = params.get('date', '')
                
                slots = get_available_slots(conn, master_id, booking_date)
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'slots': slots})
                }
            
            telegram_user_header = event.get('headers', {}).get('X-Telegram-User', '{}')
            telegram_user = json.loads(telegram_user_header)
            
            if not telegram_user.get('id'):
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'})
                }
            
            user_id = get_or_create_user(conn, telegram_user)
            
            cursor = conn.cursor()
            cursor.execute(
                """SELECT b.id, b.booking_date, b.start_time, b.end_time, b.status, b.notes,
                          m.first_name as master_name, s.name as service_name, s.price
                   FROM bookings b
                   JOIN users m ON b.master_id = m.id
                   JOIN services s ON b.service_id = s.id
                   WHERE b.client_id = %s
                   ORDER BY b.booking_date DESC, b.start_time DESC
                   LIMIT 50""",
                (user_id,)
            )
            bookings = cursor.fetchall()
            
            bookings_list = []
            for b in bookings:
                bookings_list.append({
                    'id': b['id'],
                    'date': b['booking_date'].isoformat(),
                    'time': b['start_time'].strftime('%H:%M'),
                    'endTime': b['end_time'].strftime('%H:%M'),
                    'status': b['status'],
                    'masterName': b['master_name'],
                    'serviceName': b['service_name'],
                    'price': float(b['price']),
                    'notes': b['notes']
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'bookings': bookings_list})
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            telegram_user = body_data.get('telegramUser', {})
            
            if not telegram_user.get('id'):
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'})
                }
            
            user_id = get_or_create_user(conn, telegram_user)
            
            master_id = body_data.get('masterId')
            service_id = body_data.get('serviceId')
            booking_date = body_data.get('date')
            start_time = body_data.get('time')
            duration = body_data.get('duration', 60)
            notes = body_data.get('notes', '')
            
            parsed_time = datetime.strptime(start_time, '%H:%M').time()
            end_datetime = datetime.combine(date.today(), parsed_time) + timedelta(minutes=duration)
            end_time = end_datetime.time()
            
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO bookings 
                   (client_id, master_id, service_id, booking_date, start_time, end_time, status, notes)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                   RETURNING id""",
                (user_id, master_id, service_id, booking_date, start_time, end_time, 'pending', notes)
            )
            booking_id = cursor.fetchone()['id']
            
            cursor.execute(
                """INSERT INTO notifications (user_id, booking_id, type, title, message)
                   VALUES (%s, %s, %s, %s, %s)""",
                (user_id, booking_id, 'booking_created', 'Запись создана',
                 f'Ваша запись на {booking_date} в {start_time} успешно создана')
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'bookingId': booking_id})
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            booking_id = body_data.get('bookingId')
            action = body_data.get('action')
            
            if action == 'cancel':
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE bookings SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    ('cancelled', booking_id)
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
