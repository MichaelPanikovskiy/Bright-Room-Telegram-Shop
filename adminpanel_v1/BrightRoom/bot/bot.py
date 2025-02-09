import os
import json
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo
from app.models import Product, Order, User, db
from config import Config

logging.basicConfig(level=logging.INFO)
bot = Bot(os.getenv("TOKEN"))
dp = Dispatcher()

@dp.message(CommandStart())
async def start(message: types.Message):
    web_app = WebAppInfo(url=Config.WEBAPP_URL)
    builder = types.ReplyKeyboardBuilder()
    builder.button(text="Открыть магазин", web_app=web_app)
    await message.answer("Добро пожаловать в BrightRoom!", reply_markup=builder.as_markup())

@dp.message(F.content_type == "web_app_data")
async def handle_order(message: types.Message):
    data = json.loads(message.web_app_data.data)
    user = User.query.filter_by(telegram_id=str(message.from_user.id)).first()
    
    if not user:
        user = User(telegram_id=str(message.from_user.id))
        db.session.add(user)
        db.session.commit()

    order = Order(
        user_id=user.id,
        total=data['total'],
        address=data['address'],
        status="Принят"  # Статус по умолчанию
    )
    db.session.add(order)
    db.session.commit()

    # Закомментирован блок оплаты
    # await bot.send_invoice(
    #     chat_id=message.chat.id,
    #     title="Оплата заказа",
    #     description=f"Заказ #{order.id}",
    #     payload=str(order.id),
    #     provider_token=os.getenv("PAYMENT_TOKEN"),
    #     currency="RUB",
    #     prices=[LabeledPrice(label="Итого", amount=int(data['total'] * 100))]
    # )

    # Вместо оплаты отправляем подтверждение
    await message.answer(f"✅ Заказ #{order.id} принят! С вами свяжутся для уточнения деталей.")

async def main():
    await bot.delete_webhook()
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())