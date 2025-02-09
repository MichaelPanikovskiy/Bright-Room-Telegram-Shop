from flask import Flask, render_template
from aiogram import Bot, Dispatcher, types
from aiogram.contrib.fsm_storage.memory import MemoryStorage
from aiogram.utils import executor

API_TOKEN = '7600134141:AAH093R872jeekPiVP_R9xRmDnX3Z1Jo7dg'

# Создание объектов бота и диспетчера
bot = Bot(token=API_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(bot, storage=storage)  
  
app = Flask(__name__, template_folder='.')  
  
@app.route("/")  
def web():  
    return render_template('index.html')  
    
# Обработчик команды /start
@dp.message_handler(commands=['start'])
async def send_welcome(message: types.Message):
    await message.reply("Привет! Я простой бот на aiogram. Чем могу помочь? 😊")
  
if __name__ == "__main__":  
    app.run(debug=True, host="0.0.0.0", port='80')
    executor.start_polling(dp, skip_updates=True)    