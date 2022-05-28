const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs/promises');
const crypto = require('crypto');
const { validateEmail, validatePassword } = require('./middleware/validateLogin');
const { validateToken, validateName, validateAge, validateTalk,
  validateRateBody, validateDate } = require('./middleware/validateNewTalker');
const { editedTalk } = require('./middleware/validatePut');

const readFile = async () => {
  const content = await fs.readFile('talker.json', 'utf-8');

  return JSON.parse(content);
};

const writeFile = async (content) => {
  const stringfyContent = JSON.stringify(content, null, 2);
  await fs.writeFile('talker.json', stringfyContent, 'utf-8');
};

const app = express();
app.use(express.json());
app.use(bodyParser.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.get('/talker/search', validateToken, async (req, res) => {
  const { q: term } = req.query;

  const talker = await readFile();

  if (!term) {
    res.status(200).json(talker);
  }

  const people = talker.filter((talk) => talk.name.includes(term));

  if (!people) {
    res.status(200).json([]);
  }

  res.status(200).json(people);
});

app.get('/talker', async (_req, res) => {
  const talker = await readFile();

  if (talker.length === 0) {
    return res.status(200).json([]);
  }
  
  return res.status(200).json(talker);
});

app.get('/talker/:id', async (req, res) => {
  const { id } = req.params;

  const talker = await readFile();

  if (!talker[Number(id)]) {
    return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  }

  const people = talker.find((talk) => talk.id === Number(id));

  return res.status(200).json(people);
});

app.post('/login', validateEmail, validatePassword, async (req, res) => {
  const { email, password } = req.body;
  const validate = /^[a-z0-9.]+@[a-z0-9]+\.[a-z]+(\.[a-z]+)?$/i;

  if (validate.test(email) && password.length >= 6) {
  const token = crypto.randomBytes(8).toString('hex');
  return res.status(200).json({ token });
  } 
});

app.post('/talker', validateToken, validateName, validateAge, validateTalk,
validateRateBody, validateDate,
async (req, res) => {
  const { name, age, talk } = req.body;
  const { watchedAt, rate } = talk;
  const talker = await readFile();

  const newTalker = {
    id: Math.max(...talker.map((people) => people.id)) + 1,
    name,
    age,
    talk: {
      watchedAt,
      rate,
    },
  };
  await writeFile([...talker, newTalker]);
  return res.status(201).json(newTalker);
});

app.put('/talker/:id', validateToken, validateName, validateAge, validateTalk,
validateRateBody, validateDate, async (req, res) => {
  const { id } = req.params;
  const { name, age, talk } = req.body;

  const talkers = await readFile();

  const edited = editedTalk(id, name, age, talk);

  const foundTalkIndex = talkers.findIndex((people) => people.id === Number(id));

  talkers.splice(foundTalkIndex, 1, edited);

  await writeFile(talkers);

  return res.status(200).json(edited);
});

app.delete('/talker/:id', validateToken, async (req, res) => {
  const { id } = req.params;
  const talkers = await readFile();

  const foundTalkIndex = talkers.findIndex((people) => people.id === Number(id));

  talkers.splice(foundTalkIndex, 1);

  await writeFile(talkers);

  return res.status(204).end();
});

app.listen(PORT, () => {
  console.log('Online');
});

module.exports = app;