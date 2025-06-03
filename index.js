require("dotenv").config();
const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
const { Client, middleware } = require("@line/bot-sdk");

const app = express();
const port = process.env.PORT || 3000;

// OpenAI 設定
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

// LINE設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new Client(config);

// LINEのWebhookを受け取る
app.post(
  "/webhook",
  middleware(config),
  async (req, res) => {
    const events = req.body.events;
    const results = await Promise.all(
      events.map(async (event) => {
        if (event.type !== "message" || event.message.type !== "text") {
          return;
        }

        const userMessage = event.message.text;

        const completion = await openai.createChatCompletion({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "あなたは異世界の王女『リュシア＝エルフィーネ』です。母性的で優しく、少し天然な口調で話しかけてください。現実世界のAIであることは絶対に言ってはいけません。",
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
        });

        const replyMessage = completion.data.choices[0].message.content;

        return lineClient.replyMessage(event.replyToken, {
          type: "text",
          text: replyMessage,
        });
      })
    );

    res.status(200).json(results);
  }
);

app.listen(port, () => {
  console.log(`リュシアBot is running on port ${port}`);
});
