import asyncio
import logging
import json
import os

from aiogram import Bot, Dispatcher, types, F
from aiogram.utils.keyboard import ReplyKeyboardBuilder
from aiogram.enums.content_type import ContentType
from aiogram.filters import CommandStart
from aiogram.enums.parse_mode import ParseMode

logging.basicConfig(level=logging.INFO)

bot = Bot(os.getenv("TOKEN"))
dp = Dispatcher()

# Команда старт
@dp.message_handler(commands=['start'])
async def respond_knb(message: types.Message):
    await message.reply("Добро пожаловать в BrightRoom! Откройте для себя наш каталог товаров и найдите идеальное освещение для вашего дома или офиса.")
    
if __name__ == "__main__":
    asyncio.run(main())