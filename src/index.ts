import express from 'express';
import 'colors';
import * as _ from 'lodash';
import * as redis from 'redis';
import * as bodyParser from 'body-parser';
import * as bluebird from 'bluebird';
import mongoose from 'mongoose';
import User from './models/User';
import moment from 'moment';

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


interface IValue {
  sum: number;
  comment: string;
  date: moment.Moment;
}

interface IPeriod {
  from: {
    y: string;
    m: string;
    d: string;
  };
  to?: {
    y: string;
    m: string;
    d: string;
  };
}

async function getUser(name: string) {
  console.log(`getting name ${name}`.green);
  try {
    const result = await User.findOne({ name });
    console.log(`mongo reply`, !!result);
    if (result) {
      return result;
    } else {
      return false;
    }
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

async function editUser(name: string, val: IValue, m) {
  console.log(`at edituser`.green);
  const f = (format: string) => {
    console.log(`m is`.red, m);
    return m.format(format);
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

interface IPeriodSource {
  fromY: number;
  toY: number;
  toM: number;
  fromM: number;
  fromD: number;
  toD: number;
}

async function compareAndGet(period: IPeriodSource, user) {
  const { toY, fromY, toM, fromM, fromD, toD } = period;
  const yearDiff = toY - fromY;
  const years = {};
  let data = [];
  const isYearDiffValid = yearDiff > 0;
  if (fromY === toY && _.has(user.stats, fromY)) {
    console.log(`fromy and toy are identical`)
    years[fromY] = _.at(user.stats, fromY)[0];
    console.log(`year is single and`.magenta, years[fromY], `but years are`, years);
  } else if (isYearDiffValid) {
    console.log(`before cycle at years`.bgYellow);
    for (let i = 0; i < yearDiff + 1; i = i + 1) {
      console.log(`in for, year is ${fromY + i}, diff is ${typeof yearDiff}: ${yearDiff}, i is ${typeof i}: ${i}`);
      console.log(`trying to access user.stats.${fromY + i} and keys of it are`, Object.keys(user.stats))
      if (_.has(user.stats, fromY + i)) {
        years[fromY + i] = _.at(user.stats, fromY + i)[0];
      }
    }
    console.log(`period is more than one year!111`.bgYellow);
  }
  // years получен, в нем лежат объекты с годами, которые затронуты запрошенным периодом.
  console.log(`years finally are`, years);
  Object.keys(years).map((year) => {
    Object.keys(years[year]).map((month) => {
      console.log(`year is`.red, year)
      Object.keys(years[year][month]).map((day) => {
        console.log(`month is`.red, month)
        const dayData = _.values(years[year][month][day]);
        const isWithinPeriod = (current) => {
          const before = `${fromY}-${fromM}-${fromD}`;
          const after = `${toY}-${toM}-${toD}`;
          const btw = (date) => {
            return moment(date).isBetween(before, after);
          }
          console.log(`is between?`, btw(current), `shit is ${before}, ${after}`);
          return btw(current);
        }
        const f = (val) => {
          if (val.length === 1) {
            return `0${val}`;
          }
          return val;
        }
        const current = `${year}-${f(month)}-${f(day)}`
        if (isWithinPeriod(current)) {
          console.log(`isWithin: ${current}`.green);
          data = [...data, ...dayData];
        } else {
          console.log(`NOT WITHIN: ${current}`);
        }
      });
    });
  });
  console.log(`data finally is`, data);
  return data;
}

async function isPeriodValid(period: IPeriod) {
  const errors = [];
  Object.keys(period).map(i => {
    const point = _.at(period[i], ['d', 'm', 'y']);
    const isDateValid = date => moment(date, 'DD.MM.YYYY').isValid();
    const formatYear = year => year.length === 2 ? `20${year}` : year;
    point[2] = formatYear(point[2]);
    console.log(`will return date`.blue, point.join('.'))
    const stringified = point.join('.');
    console.log(`value is okay`, stringified, isDateValid(stringified));
    if (!isDateValid(stringified)) {
      errors.push(true);
    }
  });
  if (errors.length) {
    console.log(`it has errors?`, !!errors);
    return false;
  }
  console.log(`it has errors?`, errors, !!errors);
  return true;
}

async function getStatsByPeriod(name: string, period: IPeriod) {
  const user = await getUser(name);
  const { y: fromY, m: fromM, d: fromD } = period.from;
  const { y: toY, m: toM, d: toD } = period.to;
  const allValuesExist = fromY && fromM && fromD && toY && toM && toD;
  if (allValuesExist) {
    const period = {
      fromM: Number(fromM),
      toM: Number(toM),
      fromY: Number(fromY),
      toY: Number(toY),
      toD: Number(toD),
      fromD: Number(fromD),
    }
    const data = await compareAndGet(period, user);
    if (!_.isEmpty(data)) {
      console.log(`month is not empty, returning.`.bgYellow, data)
      return data;
    } else {
      console.log(`bad months`.red, data);
    }
  }
}

async function getStatsBySingleDate(name: string, period: IPeriod) {
  const { y, m, d } = period.from;
  if (y && m && d) {
    const user = await getUser(name);
    console.log(`user`, !!user);
    const data = _.get(user.stats, [y, m, d], []);
    console.log(`values for ${d}.${m}.${y}:`, data, typeof data);
    console.log(`will give data for single date`.red);
    return data;
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
      message: `No name and period provided.`,
      status: `ERROR`,
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
  console.log(`before stats add we are here`);
  const d = moment();
  console.log(`at stats add d is`.red, d);
  const value = {
    sum: sum || 0,
    comment: comment || '',
    date: d,
  };
  const result = await isUserExists(name);
  if (result) {
    console.log(`found name?`.red, !!result);
    try {
      const edited = await editUser(name, value, d);
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

app.post('/stats/get', async (req: { body: { name: string, period: IPeriod } }, res) => {
  const { name, period } = req.body;
  console.log(`period is`.bgRed, period);
  const exists = await isUserExists(name);
  if (!exists) {
    console.log(`returning USER NOT FOUND ERROR`.red)
    return res.json({
      status: 'ERROR',
      message: 'User not found',
    });
  }
  const isValid = await isPeriodValid(period);
  console.log(`period is okay?`.magenta, isValid)
  if (!isValid) {
    return res.json({
      status: 'ERROR',
      message: 'Period is not valid',
    });
  }
  const getStats = async () => {
    if (period.from && period.to) {
      return await getStatsByPeriod(name, period);
    } else if (period.from) {
      return await getStatsBySingleDate(name, period);
    }
  };
  const data = await getStats();
  console.log(`data from periods is`, data);
  if (!_.isUndefined(data)) {
    return res.json({
      name,
      data,
      status: 'SUCCESS',
    });
  } else {
    return res.json({
      status: 'ERROR',
      message: 'No data found',
    });
  }
});

httpServer.listen(3000, () => console.log(`listening on 3000!11`));
