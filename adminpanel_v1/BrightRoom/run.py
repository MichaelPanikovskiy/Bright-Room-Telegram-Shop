from app import create_app
from bot.bot import dp, bot
import asyncio

app = create_app()

if __name__ == "__main__":
    # Запуск Flask в отдельном потоке
    from threading import Thread
    Thread(target=app.run, kwargs={'host': '0.0.0.0', 'port': 80}).start()
    
    # Запуск бота
    asyncio.run(dp.start_polling(bot))