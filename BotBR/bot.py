import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, accuracy_score
import numpy as np
from aiogram import Bot, Dispatcher, types
from aiogram.utils import executor
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
import matplotlib.pyplot as plt
import io

# Загрузка данных
data = pd.read_csv('data/sales_data.csv')

# Подготовка данных для регрессионной модели
X_reg = data[['Количество проданных единиц', 'Цена за единицу']]
y_reg = data['Общая стоимость']

# Разделение данных на обучающую и тестовую выборки для регрессии
X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(X_reg, y_reg, test_size=0.2, random_state=42)

# Обучение регрессионной модели
reg_model = LinearRegression()
reg_model.fit(X_train_reg, y_train_reg)

# Подготовка данных для классификатора
label_encoder = LabelEncoder()
data['Тип продажи'] = label_encoder.fit_transform(data['Тип продажи'])

X_clf = data[['Количество проданных единиц', 'Цена за единицу', 'Оценка товара']]
y_clf = data['Тип продажи']

# Разделение данных на обучающую и тестовую выборки для классификации
X_train_clf, X_test_clf, y_train_clf, y_test_clf = train_test_split(X_clf, y_clf, test_size=0.2, random_state=42)

# Обучение классификатора с градиентным бустингом
clf_model = GradientBoostingClassifier(random_state=42)
clf_model.fit(X_train_clf, y_train_clf)

# Анализ отзывов и оценок
label_encoder_rating = LabelEncoder()
data['Оценка товара'] = label_encoder_rating.fit_transform(data['Оценка товара'])

X_rating = data[['Количество проданных единиц', 'Цена за единицу', 'Общая стоимость']]
y_rating = data['Оценка товара']

# Разделение данных на обучающую и тестовую выборки для анализа отзывов
X_train_rating, X_test_rating, y_train_rating, y_test_rating = train_test_split(X_rating, y_rating, test_size=0.2, random_state=42)

# Обучение модели для анализа отзывов с градиентным бустингом
rating_model = GradientBoostingClassifier(random_state=42)
rating_model.fit(X_train_rating, y_train_rating)

# Оптимизация логистики
label_encoder_delivery = LabelEncoder()
data['Способ получения'] = label_encoder_delivery.fit_transform(data['Способ получения'])

X_delivery = data[['Количество проданных единиц', 'Цена за единицу', 'Оценка товара']]
y_delivery = data['Способ получения']

# Разделение данных на обучающую и тестовую выборки для оптимизации логистики
X_train_delivery, X_test_delivery, y_train_delivery, y_test_delivery = train_test_split(X_delivery, y_delivery, test_size=0.2, random_state=42)

# Обучение модели для оптимизации логистики с градиентным бустингом
delivery_model = GradientBoostingClassifier(random_state=42)
delivery_model.fit(X_train_delivery, y_train_delivery)

# Инициализация бота
API_TOKEN = '7600134141:AAH093R872jeekPiVP_R9xRmDnX3Z1Jo7dg'
bot = Bot(token=API_TOKEN)
dp = Dispatcher(bot)

# Создание клавиатуры с кнопками
keyboard_markup = ReplyKeyboardMarkup(resize_keyboard=True)
buttons = ["Помощь", "Использовать ИИ"]
keyboard_markup.add(*buttons)

# Клавиатура для кнопки "Использовать ИИ"
ai_keyboard_markup = ReplyKeyboardMarkup(resize_keyboard=True)
ai_buttons = ["Прогноз", "Классифицикация", "Анализ отзывов", "Оптимизация логистики", "Назад"]
ai_keyboard_markup.add(*ai_buttons)

@dp.message_handler(lambda message: message.text == "Использовать ИИ")
async def use_ai(message: types.Message):
await message.reply("Выберите тип анализа:", reply_markup=ai_keyboard_markup)

@dp.message_handler(lambda message: message.text == "Назад")
async def go_back(message: types.Message):
await message.reply("Выберите действие:", reply_markup=keyboard_markup)

@dp.message_handler(commands=['start'])
async def send_welcome(message: types.Message):
await message.reply("💡Добро пожаловать в BrightRoom - магазин освещения внутри Телеграм! Перейдите в каталог для ознакомления с ассортиментом или выберите действие по кнопке ниже:", reply_markup=keyboard_markup)

@dp.message_handler(lambda message: message.text == "Помощь")
async def send_help(message: types.Message):
help_text = (
"Я помогу вам с анализом данных. Вот доступные функции:\n\n"
"Прогноз - Прогнозирование общей стоимости продаж\n"
"Классифицикация - Классификация типа продажи\n"
"Анализ отзывов - Анализ оценок товаров\n"
"Оптимизация логистики - Оптимизация способа доставки\n"
)
await message.reply(help_text)

@dp.message_handler(lambda message: message.text == "Прогноз")
async def predict_sales(message: types.Message):
# Пример данных для прогнозирования
example_data = np.array([[5, 2826.47]])
prediction = reg_model.predict(example_data)

# Создание изображения
fig, ax = plt.subplots()
ax.bar(['Прогноз'], prediction, color='skyblue')
ax.set_ylabel('Общая стоимость')
ax.set_title('Прогнозируемая общая стоимость')

# Сохранение изображения в буфер
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)

# Отправка изображения
await bot.send_photo(chat_id=message.chat.id, photo=buf, caption=f"Прогнозируемая общая стоимость: {prediction[0]:.2f}")
plt.close(fig)

@dp.message_handler(lambda message: message.text == "Классифицикация")
async def classify_sale(message: types.Message):
# Пример данных для классификации
example_data = np.array([[5, 2826.47, 1]])
prediction = clf_model.predict(example_data)
sale_type = label_encoder.inverse_transform(prediction)

# Создание изображения
fig, ax = plt.subplots()
ax.bar(['Тип продажи'], [1], color='lightgreen')
ax.set_xticklabels([sale_type[0]])
ax.set_title('Предсказанный тип продажи')

# Сохранение изображения в буфер
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)

# Отправка изображения
await bot.send_photo(chat_id=message.chat.id, photo=buf, caption=f"Предсказанный тип продажи: {sale_type[0]}")
plt.close(fig)

@dp.message_handler(lambda message: message.text == "Анализ отзывов")
async def analyze_reviews(message: types.Message):
# Пример данных для анализа отзывов
example_data = np.array([[5, 2826.47, 14132.35]])
prediction = rating_model.predict(example_data)
rating = label_encoder_rating.inverse_transform(prediction)

# Создание изображения
fig, ax = plt.subplots()
ax.bar(['Оценка товара'], [1], color='lightcoral')
ax.set_xticklabels([str(rating[0])])
ax.set_title('Предсказанная оценка товара')

# Сохранение изображения в буфер
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)

# Отправка изображения
await bot.send_photo(chat_id=message.chat.id, photo=buf, caption=f"Предсказанная оценка товара: {rating[0]}")
plt.close(fig)

@dp.message_handler(lambda message: message.text == "Оптимизация логистики")
async def optimize_logistics(message: types.Message):
# Пример данных для оптимизации логистики
example_data = np.array([[5, 2826.47, 1]])
prediction = delivery_model.predict(example_data)
delivery_method = label_encoder_delivery.inverse_transform(prediction)

# Создание изображения
fig, ax = plt.subplots()
ax.bar(['Способ получения'], [1], color='lightblue')
ax.set_xticklabels([delivery_method[0]])
ax.set_title('Предсказанный способ получения')

# Сохранение изображения в буфер
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)

# Отправка изображения
await bot.send_photo(chat_id=message.chat.id, photo=buf, caption=f"Предсказанный способ получения: {delivery_method[0]}")
plt.close(fig)

if __name__ == '__main__':
executor.start_polling(dp, skip_updates=True)