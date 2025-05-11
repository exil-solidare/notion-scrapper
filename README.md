### Notion Scrapper

### Структура проекта
Проект использует переменные среды, которые можно просмотреть в файле .env.example (документация к модулю, который использует данные переменные - https://developers.notion.com/docs/getting-started):
``` 
NOTION_DB_POSTS=
NOTION_DB_PAGES=
NOTION_SECRET=
```
NOTION_SECRET - секретный ключ, который можно получить при настройке интеграции в самом пространстве Notion (https://www.notion.so/profile/integrations/internal/) 


#### Установка и сборка 
Для сборки проекта используется Yarn Package Manager 4.2.2. 

Для использования и инициализации потребуется установка NodeJS и пакета yarn - ```npm install -g yarn```

Проверка установки corepack - ```npm install -g corepack```

Инициализируем использование *corepack* в системе: ```corepack enable```

Наконец ```yarn install```

Для запуска используется команда ```yarn start```
