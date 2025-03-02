from flask import Flask, request, jsonify, send_from_directory
from aiogram import Bot, Dispatcher, types
from aiogram.contrib.fsm_storage.memory import MemoryStorage
from aiogram.utils import executor
import sqlite3
import hashlib
import threading

API_TOKEN = '7600134141:AAH093R872jeekPiVP_R9xRmDnX3Z1Jo7dg'
app = Flask(__name__, static_folder='static')
bot = Bot(token=API_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(bot, storage=storage)

# Инит базы данных
def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT DEFAULT '',
        orders TEXT DEFAULT '[]',
        notifications TEXT DEFAULT '[]',
        is_admin INTEGER DEFAULT 0
    )''')
    c.execute('SELECT COUNT(*) FROM users WHERE email = ?', ('admin@admin.com',))
    if c.fetchone()[0] == 0:
        c.execute('INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
                  ('Admin', 'admin@admin.com', hash_password('admin123'), 1))
    c.execute('''CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        image TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )''')
    c.execute('SELECT COUNT(*) FROM products')
    if c.fetchone()[0] == 0:
        initial_products = [
            (None, "LP-270", 5000, "Классический потолочный светильник.", "static/tov1.png"),
            (None, "LT-150", 7000, "Современный встраиваемый светильник.", "static/tov2.png"),
            (None, "LS-300", 3000, "Настенный светильник с плафонами.", "static/tov3.png"),
            (None, "LX-450", 4000, "Трековый светильник.", "static/tov4.png"),
            (None, "LG-500", 5600, "Стильный подвесной светильник.", "static/tov5.png"),
            (None, "LB-120", 1240, "Настольный светильник с абажуром.", "static/tov6.png"),
            (None, "LM-100", 1200, "Промышленный светильник.", "static/tov7.png"),
            (None, "LK-780", 7800, "Линейный светильник.", "static/tov8.png"),
            (None, "LF-520", 5200, "Настенно-потолочный светильник.", "static/tov9.png"),
            (None, "LZ-820", 8200, "Дизайнерский потолочный светильник.", "static/tov10.png"),
        ]
        c.executemany('INSERT INTO products (id, name, price, description, image) VALUES (?, ?, ?, ?, ?)', initial_products)
    conn.commit()
    conn.close()

# Хешируем пароль
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Проверка на админа
def is_admin(user_id):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT is_admin FROM users WHERE id = ?', (user_id,))
    result = c.fetchone()
    conn.close()
    return result and result[0] == 1

# Главная страница
@app.route("/")
def web():
    return send_from_directory('.', 'index.html')

# Работа с товарами
@app.route('/products', methods=['GET'])
def get_products():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT * FROM products')
    products = c.fetchall()
    conn.close()
    return jsonify([{'id': p[0], 'name': p[1], 'price': p[2], 'description': p[3], 'image': p[4]} for p in products]), 200

@app.route('/cart', methods=['GET'])
def get_cart():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'Требуется user_id!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT product_id, quantity FROM cart_items WHERE user_id = ?', (user_id,))
    cart_items = c.fetchall()
    conn.close()
    return jsonify([{'id': item[0], 'quantity': item[1]} for item in cart_items]), 200

@app.route('/cart', methods=['POST'])
def add_to_cart():
    data = request.get_json()
    user_id = data.get('user_id')
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)
    if not user_id or not product_id:
        return jsonify({'error': 'Требуется user_id и product_id!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?', (user_id, product_id))
    existing = c.fetchone()
    if existing:
        new_quantity = existing[0] + quantity
        if new_quantity <= 0:
            c.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', (user_id, product_id))
        else:
            c.execute('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', (new_quantity, user_id, product_id))
    else:
        if quantity > 0:
            c.execute('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', (user_id, product_id, quantity))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Корзина обновлена!'}), 200

@app.route('/cart', methods=['DELETE'])
def remove_from_cart():
    data = request.get_json()
    user_id = data.get('user_id')
    product_id = data.get('product_id')
    if not user_id or not product_id:
        return jsonify({'error': 'Требуется user_id и product_id!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', (user_id, product_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Товар удалён из корзины!'}), 200

@app.route('/favorites', methods=['GET'])
def get_favorites():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'Требуется user_id!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT product_id FROM favorites WHERE user_id = ?', (user_id,))
    favorites = c.fetchall()
    conn.close()
    return jsonify([item[0] for item in favorites]), 200

@app.route('/favorites', methods=['POST'])
def add_to_favorites():
    data = request.get_json()
    user_id = data.get('user_id')
    product_id = data.get('product_id')
    if not user_id or not product_id:
        return jsonify({'error': 'Требуется user_id и product_id!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?', (user_id, product_id))
    if c.fetchone():
        conn.close()
        return jsonify({'message': 'Товар уже в избранном!'}), 200
    c.execute('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', (user_id, product_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Товар добавлен в избранное!'}), 200

@app.route('/favorites', methods=['DELETE'])
def remove_from_favorites():
    data = request.get_json()
    user_id = data.get('user_id')
    product_id = data.get('product_id')
    if not user_id or not product_id:
        return jsonify({'error': 'Требуется user_id и product_id!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', (user_id, product_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Товар удалён из избранного!'}), 200

# Регистрация и вход
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = hash_password(data.get('password'))
    phone = data.get('phone', '')
    if not name or not email or not password:
        return jsonify({'error': 'Заполните все обязательные поля!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        c.execute('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)', (name, email, password, phone))
        conn.commit()
        user_id = c.lastrowid
        user = {'id': user_id, 'name': name, 'email': email, 'phone': phone, 'orders': [], 'notifications': [], 'is_admin': 0}
        return jsonify(user), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Пользователь с таким email уже существует!'}), 400
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    global currentUser
    data = request.get_json()
    email = data.get('email')
    password = hash_password(data.get('password'))
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password))
    user = c.fetchone()
    conn.close()
    if user:
        currentUser = {'id': user[0], 'name': user[1], 'email': user[2], 'phone': user[4], 'orders': eval(user[5]), 'notifications': eval(user[6]), 'is_admin': user[7]}
        return jsonify(currentUser), 200
    return jsonify({'error': 'Неверные данные!'}), 401

# Профиль и заказы
@app.route('/profile', methods=['PUT'])
def update_profile():
    data = request.get_json()
    user_id = data.get('id')
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    if not name or not email:
        return jsonify({'error': 'Имя и email обязательны!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?', (name, email, phone, user_id))
    conn.commit()
    conn.close()
    return jsonify({'id': user_id, 'name': name, 'email': email, 'phone': phone}), 200

@app.route('/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()
    if user:
        return jsonify({'id': user[0], 'name': user[1], 'email': user[2], 'phone': user[4], 'orders': eval(user[5]), 'notifications': eval(user[6]), 'is_admin': user[7]}), 200
    return jsonify({'error': 'Пользователь не найден!'}), 404

@app.route('/checkout', methods=['POST'])
def checkout():
    data = request.get_json()
    user_id = data.get('user_id')
    order = data.get('order')
    notification = data.get('notification')
    if not user_id or not order or not notification:
        return jsonify({'error': 'Недостаточно данных!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT orders, notifications FROM users WHERE id = ?', (user_id,))
    result = c.fetchone()
    if not result:
        conn.close()
        return jsonify({'error': 'Пользователь не найден!'}), 404
    current_orders = eval(result[0])
    current_notifications = eval(result[1])
    current_orders.append(order)
    current_notifications.append(notification)
    c.execute('UPDATE users SET orders = ?, notifications = ? WHERE id = ?', (str(current_orders), str(current_notifications), user_id))
    c.execute('DELETE FROM cart_items WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'orders': current_orders, 'notifications': current_notifications}), 200

# Админские приколюхи
@app.route('/admin', methods=['GET'])
def admin_panel():
    if not currentUser or not is_admin(currentUser.get('id')):
        return jsonify({'error': 'Доступ запрещён!'}), 403
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT * FROM products')
    products = [{'id': p[0], 'name': p[1], 'price': p[2], 'description': p[3], 'image': p[4]} for p in c.fetchall()]
    c.execute('SELECT id, name, email, phone, is_admin FROM users')
    users = [{'id': u[0], 'name': u[1], 'email': u[2], 'phone': u[3], 'is_admin': u[4]} for u in c.fetchall()]
    conn.close()
    return jsonify({'products': products, 'users': users}), 200

@app.route('/admin/products', methods=['POST'])
def add_product():
    if not currentUser or not is_admin(currentUser.get('id')):
        return jsonify({'error': 'Доступ запрещён!'}), 403
    data = request.get_json()
    name = data.get('name')
    price = data.get('price')
    description = data.get('description')
    image = data.get('image')
    if not name or not price:
        return jsonify({'error': 'Требуется name и price!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('INSERT INTO products (name, price, description, image) VALUES (?, ?, ?, ?)', (name, price, description, image))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Товар добавлен!'}), 201

@app.route('/admin/products/<int:product_id>', methods=['PUT'])
def edit_product(product_id):
    if not currentUser or not is_admin(currentUser.get('id')):
        return jsonify({'error': 'Доступ запрещён!'}), 403
    data = request.get_json()
    name = data.get('name')
    price = data.get('price')
    description = data.get('description')
    image = data.get('image')
    if not name or not price:
        return jsonify({'error': 'Требуется name и price!'}), 400
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('UPDATE products SET name = ?, price = ?, description = ?, image = ? WHERE id = ?', (name, price, description, image, product_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Товар обновлён!'}), 200

@app.route('/admin/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if not currentUser or not is_admin(currentUser.get('id')):
        return jsonify({'error': 'Доступ запрещён!'}), 403
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('DELETE FROM products WHERE id = ?', (product_id,))
    c.execute('DELETE FROM cart_items WHERE product_id = ?', (product_id,))
    c.execute('DELETE FROM favorites WHERE product_id = ?', (product_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Товар удалён!'}), 200

@app.route('/admin/users/<int:user_id>', methods=['PUT'])
def toggle_admin(user_id):
    if not currentUser or not is_admin(currentUser.get('id')):
        return jsonify({'error': 'Доступ запрещён!'}), 403
    data = request.get_json()
    is_admin_status = data.get('is_admin', 0)
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('UPDATE users SET is_admin = ? WHERE id = ?', (is_admin_status, user_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Статус администратора обновлён!'}), 200

@app.route('/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if not currentUser or not is_admin(currentUser.get('id')):
        return jsonify({'error': 'Доступ запрещён!'}), 403
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('DELETE FROM users WHERE id = ?', (user_id,))
    c.execute('DELETE FROM cart_items WHERE user_id = ?', (user_id,))
    c.execute('DELETE FROM favorites WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Пользователь удалён!'}), 200

# Запуск
@dp.message_handler(commands=['start'])
async def send_welcome(message: types.Message):
    await message.reply("Привет! Я простой бот на aiogram. Чем могу помочь? 😊")

def run_aiogram():
    executor.start_polling(dp, skip_updates=True)

def run_flask():
    app.run(host='0.0.0.0', port=80, debug=True, use_reloader=False)

if __name__ == "__main__":
    init_db()
    global currentUser
    currentUser = None
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    run_aiogram()