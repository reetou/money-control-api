import * as moment from 'moment';
import {IPeriod, IPeriodSource} from './interfaces/index';
import * as _ from 'lodash';

export const isWithinPeriod = (current, period: IPeriodSource) => {
  const { toY, fromY, toM, fromM, fromD, toD } = period;
  const before = `${fromY}-${fromM}-${fromD}`;
  const after = `${toY}-${toM}-${toD}`;
  const btw = (date) => {
    return moment(date).isBetween(before, after);
  };
  return btw(current);
};

const isDateValid = date => moment(date, 'DD.MM.YYYY').isValid();
const formatYear = year => year.length === 2 ? `20${year}` : year;

export async function isPeriodValid(period: IPeriod) {
  const errors = [];
  Object.keys(period).map(i => {
    const point = _.at(period[i], ['d', 'm', 'y']);
    point[2] = formatYear(point[2]);
    const stringified = point.join('.');
    if (!isDateValid(stringified)) {
      errors.push(true);
    }
  });
  if (errors.length) {
    return false;
  }
  return true;
}