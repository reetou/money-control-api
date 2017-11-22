import * as moment from 'moment';

export interface IPeriodSource {
  fromY: number;
  toY: number;
  toM: number;
  fromM: number;
  fromD: number;
  toD: number;
}

export interface IValue {
  sum: number;
  comment: string;
  date: moment.Moment;
}

export interface IPeriod {
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
