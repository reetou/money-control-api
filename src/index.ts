import express from 'express';
import 'colors';
import moment from 'moment';
import * as _ from 'lodash';
import * as redis from 'redis';
import * as bodyParser from 'body-parser';
import * as bluebird from 'bluebird';
import mongoose from 'mongoose';
import User from './models/User';

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

async function getUser(name: string) {
  console.log(`getting name ${name}`.green);
  try {
    const result = await User.findOne({ name });
    console.log(`mongo reply`, !!result);
    return result;
  } catch (e) {
    console.log(`mongo err`, e);
  }
}

async function isUserExists(name: string) {
  console.log(`getting name ${name}`.green);
  try {
    const result = await User.findOne({ name });
    console.log(`mongo reply`, !!result);
    return !!result;
  } catch (e) {
    console.log(`mongo err`, e);
  }
}

async function editUser(name: string, val: { sum: number, comment: string }) {
  const f = (format: string) => {
    return moment().format(format);
  };
  const user = await User.findOne({ name });
  const year = f('YYYY');
  const month = f('MM');
  const day = f('DD');
  const time = `${f('HH')}:${f('mm')}:${f('ss')}`;
  const updated = _.setWith(user, ['stats', year, month, day, time], val, Object);
  const newUser = await User.findOneAndUpdate({ name }, updated, { new: true });
  return newUser;
}

async function getStatsByPeriod(name: string, period: { y: string, m: string, d: string }) {
  const exists = isUserExists(name);
  const { y, m, d } = period;
  if (exists && y && m && d) {
    const user = await getUser(name);
    console.log(`user`, user);
    const data = _.at(user, `stats.${y}.${m}.${d}`);
    console.log(`values for ${d}.${m}.${y}:`, data);
    return {
      name,
      data,
      status: 'SUCCESS',
    };
  } else {
    return {
      name,
      message: 'Cannot access period values',
      status: 'ERROR',
    };
  }
}

app.post('/me', async (req, res) => {
  console.log(`req.body`, req.body);
  const { name = 'default' } = req.body;
  const exists = await isUserExists(name);
  const user = await getUser(name);
  console.log(`exists?`.bgGreen, exists);
  if (name && exists) {
    res.json({
      user,
      name: user.name,
      status: 'SUCCESS',
    });
  } else {
    console.log(`exists?`.bgGreen, exists);
    res.json({
      status: `ERROR`,
      error: `No name and period provided.`,
    });
  }
});

app.post('/create', async (req: { body: { name: string, telegramId: string } }, res) => {
  const { name, telegramId = '3333' } = req.body;
  const result = await isUserExists(name);
  console.log(`is ${name} already exists?`.red, result);
  if (!result) {
    const newUser = new User({
      name,
      telegramId,
      stats: {},
    });
    try {
      await newUser.save();
      console.log(`is registered it?`.bgRed, await isUserExists(name));
      res.json({
        name,
        message: `Created user with name ${name}. Good Luck`,
        status: 'SUCCESS',
      });
    } catch (e) {
      console.error(`Error at creating newUser`, e);
      res.json({
        name,
        message: `User ${name} already exists.`,
        status: 'ERROR',
      });
    }
  } else {
    res.json({
      name,
      message: `User ${name} already exists.`,
      status: 'ERROR',
    });
  }
});

app.post('/stats/add', async (req: { body: { name: string, sum: number, comment: string } }, res) => {
  const { name, sum, comment } = req.body;
  const value = {
    sum: sum || 0,
    comment: comment || '',
  };
  const result = await isUserExists(name);
  if (result) {
    console.log(`found name?`.red, result);
    try {
      const edited = await editUser(name, value);
      res.json({
        name,
        message: `Successfully edited.`,
        new: edited,
        status: 'SUCCESS',
      });
    } catch (e) {
      res.json({
        name,
        message: `Error at editing: ${e}`,
        status: 'ERROR',
      });
    }
  } else {
    res.json({
      name,
      message: `Name ${name} not found.`,
      status: 'ERROR',
    });
  }
});

app.post('/stats/get', async (req: { body: { name: string, period: { y: string, m: string, d: string } } }, res) => {
  const { name, period } = req.body;
  console.log(`period is`.bgRed, period);
  res.json({
    name,
    ...await getStatsByPeriod(name, period),
  });
});

httpServer.listen(3000, () => console.log(`listening on 3000!11`));
