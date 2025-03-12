const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const { Deepgram } = require('@deepgram/sdk');
const { Configuration, OpenAIApi } = require('openai');
const { ElevenLabs } = require('elevenlabs');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const accountSid = 'your_account_sid';
const authToken = 'your_auth_token';
const client = twilio(accountSid, authToken);

const deepgram = new Deepgram('your_deepgram_api_key');
const openai = new OpenAIApi(new Configuration({ apiKey: 'your_openai_api_key' }));
const elevenlabs = new ElevenLabs('your_elevenlabs_api_key');

const pool = new Pool({
  user: 'your_db_user',
  host: 'your_db_host',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
});

app.post('/voice', twilio.webhook(), async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const conversationId = req.body.conversationId || generateConversationId();
  const audioUrl = req.body.RecordingUrl;

  if (audioUrl) {
    const transcript = await getTranscript(audioUrl);
    const aiResponse = await generateResponse(transcript);
    const synthesizedSpeechUrl = await synthesizeSpeech(aiResponse);

    twiml.play(synthesizedSpeechUrl);
    await logConversation(conversationId, transcript, aiResponse);
  } else {
    twiml.say('Hello, this is your AI sales representative.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

async function getTranscript(audioUrl) {
  const response = await deepgram.transcription.preRecorded({ url: audioUrl });
  return response.results.channels[0].alternatives[0].transcript;
}

async function generateResponse(transcript) {
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: transcript,
    max_tokens: 150,
  });
  return response.data.choices[0].text;
}

async function synthesizeSpeech(text) {
  const response = await elevenlabs.synthesize(text);
  return response.audioUrl;
}

async function logConversation(conversationId, transcript, aiResponse) {
  const query = `
    INSERT INTO conversations (conversation_id, transcript, ai_response, timestamp)
    VALUES ($1, $2, $3, $4)
  `;
  const values = [conversationId, transcript, aiResponse, new Date()];
  await pool.query(query, values);
}

function generateConversationId() {
  return Math.random().toString(36).substr(2, 9);
}

app.get('/conversations', async (req, res) => {
  const query = 'SELECT * FROM conversations ORDER BY timestamp DESC';
  const result = await pool.query(query);
  res.json(result.rows);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
