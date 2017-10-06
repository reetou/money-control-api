import express from 'express';
import 'colors';
import * as redis from 'redis';
import * as bodyParser from 'body-parser';
import * as bluebird from 'bluebird';
import mongoose from 'mongoose';

// constants
const http = require('http');
const app = express();
const httpServer = http.createServer(app);
const client = bluebird.promisifyAll(redis.createClient());
const config = require('../config.json');

console.log(`db`, config.database);

mongoose.connect(config.database);

const db = mongoose.connection;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

console.log(`STARTED. AT: ${new Date(Date.now())}`.magenta);

async function getName(name) {
  console.log(`getting name ${name}`.green);
  try {
    const result = await client.getAsync(name);
    console.log(`redis reply`, result);
    return result;
  } catch (e) {
    console.log(`redis err`, e);
  }
}

app.post('/me', async (req, res) => {
  console.log(`req.body`, req.body);
  const { name, period } = req.body;
  const data = await getName(name);
  console.log(`data`, data);
  if (name && period && data) {
    res.json({
      name: data,
      period: `Chosen period is ${period}`,
      status: 'SUCCESS',
    });
    console.log(`Sent something to ${req.name}`);
  } else {
    console.log(`not found it?`.bgGreen, data);
    res.json({
      status: `ERROR`,
      error: `No name and period provided.`,
    });
  }
});

app.post('/create', async (req, res) => {
  const { name } = req.body;
  const result = await getName(name);
  console.log(`is ${name} already exists?`.red, !!result, result);
  if (!result) {
    client.setAsync(name, {
      name,
      fake: true,
      registeredAt: new Date(Date.now()),
      admin: false,
    }.toString());
    console.log(`is registered it?`.bgRed, !!await getName(name), await getName(name));
    res.json({
      name,
      message: `Created user with name ${name}. Good Luck`,
      status: 'SUCCESS',
    });
  } else {
    res.json({
      name,
      message: `User ${name} already exists.`,
      status: 'ERROR',
    });
  }
});

httpServer.listen(3000, () => console.log(`listening on 3000!11`));
