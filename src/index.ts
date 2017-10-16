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

async function compareAndGetYears(fromY: number, toY: number, user: any) {
  const diff = toY - fromY;
  const years = {};
  const isDiffValid = diff > 0;
  if (fromY === toY && _.has(user.stats, fromY)) {
    console.log(`fromy and toy are identical`)
    years[fromY] = _.at(user.stats, fromY)[0];
  } else if (isDiffValid) {
    console.log(`before cycle at years`.bgYellow);
    for (let i = 0; i < diff + 1; i = i + 1) {
      console.log(`in for, year is ${fromY + i}, diff is ${typeof diff}: ${diff}, i is ${typeof i}: ${i}`);
      console.log(`trying to access user.stats.${fromY + i} and keys of it are`, Object.keys(user.stats))
      if (_.has(user.stats, fromY + i)) {
        years[fromY + i] = _.at(user.stats, fromY + i)[0];
      } else {
        console.log(`user`, user)
        console.log(`has returned false: user.stats.${fromY + i}`.yellow, `user.stats KEYS is`, Object.keys(user.stats));
      }
    }
    console.log(`period is more than one year!111`.bgYellow, years);
  }
  console.log(`typeof years: ${typeof years}`.america)
  return years;
}

async function compareAndGetMonths(fromM, toM, years, fromY, toY) {
  let monthDiff = toM - fromM;
  let yearDiff = toY - fromY;
  const months = {};
  const isMonthDiffValid = monthDiff > 0;
  // Нужен рефакторинг
  // Здесь просто нужно проходиться по всем ключам объекта years
  // И если месяц.год sameorafter fromM.fromY => false то делать unset его
  // И возвращать только валидные месяца
  // Пока так
  console.log(`years keys`.red, Object.keys(years));
  if (fromM === toM && _.has(years, [fromY, fromM])) {
    console.log(`fromM and toM are identical`.red, `trying to receive ${fromM}.${fromY} and ${toM}.${toY}`);
    console.log(`_.at(years[fromY], fromM)[0]`, _.at(years[fromY], fromM)[0]);
    months[fromM] = _.at(years[fromY], fromM)[0];
    console.log(`month[fromM]`, months[fromM]);
  } else {
    console.log(`before cycle at months`.bgYellow);
    if (!isMonthDiffValid) {
      console.log(`month diff not valid, doing some hacking`.bgCyan)
      monthDiff = -1;
    }
    for (let i = 0; i < yearDiff + 1; i = i + 1) {
      const y = fromY + i;
      console.log(`y is ${y}, yeardiff is ${yearDiff}`)
      for (let n = 0; n < monthDiff + 1; n = n + 1) {
        const m = () => {
          if (fromM + n < 10) {
            return `0${fromM + n}`;
          }
          return fromM + n;
        }
        console.log(`in for, month is ${m()}, year is ${y}`);
        if (_.hasIn(years, `${y}.${m()}`)) {
          console.log(`has worked.`.bgBlue);
          _.setWith(months, `${y}.${m()}`, _.at(years, `${y}.${m()}`)[0], Object);
        } else {
          console.log(`has returned false at MONTHS: ${m()}.${fromY + i}`.red, months);
        }
      }
    }
  }
  return months;
}

async function getStatsByPeriod(name: string, period: IPeriod) {
  const userExists = await isUserExists(name);
  const user = await getUser(name);
  const { y: fromY, m:fromM, d: fromD } = period.from;
  const { y: toY, m:toM, d: toD } = period.to;
  const allValuesExist = fromY && fromM && fromD && toY && toM && toD;
  if (userExists && allValuesExist) {
    const years = await compareAndGetYears(Number(fromY), Number(toY), user);
    console.log(`years is`, years);
    const months = await compareAndGetMonths(Number(fromM), Number(toM), years, Number(fromY), Number(toY));
    if (!_.isEmpty(months)) {
      console.log(`month is not empty, returning.`.bgYellow, months)
      return months;
    } else {
      console.log(`bad months`.red, months);
    }
  }
}

async function getStatsBySingleDate(name: string, period: IPeriod) {
  const exists = await isUserExists(name);
  const { y, m, d } = period.from;
  if (exists && y && m && d) {
    const user = await getUser(name);
    console.log(`user`, !!user);
    const data = _.at(user, `stats.${y}.${m}.${d}`)[0];
    console.log(`valuess for ${d}.${m}.${y}:`, data, typeof data);
    console.log(`will give data for single date (today)`.red);
    return {
      status: 'SUCCESS',
      data: !_.isNull(data) ? data : {},
    };
  } else {
    return {
      status: 'ERROR',
      message: 'Cannot access period values',
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
