// notion.config.js
require("dotenv").config(); // dotenv をロード

const auth = process.env.NOTION_API_TOKEN;
const NotionConfig = {
    auth,
    databaseIds: [
        process.env.NOTION_DATABASE_LOGIN, // 例: Notion データベースID
    ],
};
module.exports = NotionConfig;
