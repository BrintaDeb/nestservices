import asyncio
import os
from dotenv import load_dotenv
load_dotenv('.env')
from db import get_db

async def main():
    db = get_db()
    print('db got')
    await db.site_settings.insert_one({'key': 'test'})
    print('inserted')
    cur = db.site_settings.find({})
    async for doc in cur:
        print(doc)

asyncio.run(main())
