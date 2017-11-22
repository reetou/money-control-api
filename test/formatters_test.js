import {isWithinPeriod, isPeriodValid} from '../src/formatters';
import { expect } from 'chai';

describe(`Formatters`.magenta, () => {
	let period, requestPeriod, badRequestPeriod;
	before("Set default period", () => {
		requestPeriod = {
			to: {
				y: "2017",
				m: "09",
				d: "10",
			},
			from: {
				y: "2017",
				m: "09",
				d: "08",
			}
		};
		badRequestPeriod = {
			to: {
				y: "2017",
				m: "9",
				d: "10",
			},
			from: {
				y: "2017",
				m: "9",
				d: "8",
			}
		};
		period = {
			fromD: '08', fromM: '09', fromY: '2017',
			toD: '10', toM: '09', toY: '2017',
		}
	})
	it('should return true because entry value is in period', () => {
		const current = '09-09-2017';
		expect(isWithinPeriod(current, period)).to.be.true;
	})

	it('should return false because entry value is not in period', () => {
		const current = '08-09-2017';
		expect(isWithinPeriod(current, period)).to.be.false;
	})

	it('should return true because entry value from request is valid', async () => {
		const result = await isPeriodValid(requestPeriod)
		expect(result).to.be.true;
	})

	it('should return true because BAD entry value from request is formatted', async () => {
		const result = await isPeriodValid(badRequestPeriod);
		expect(result).to.be.true;
	})

})