import {getStatsByPeriod, getStatsBySingleDate} from '../src/index';
import { assert } from 'chai';
import * as _ from 'lodash'
import * as mongoose from 'mongoose';
const config = require('../config.json');

describe(`getStats functions`.magenta, () => {
	let requestPeriod, name, expectedData, expectedDataByPeriod, expectedPeriod, expectedDataBySpecificPeriod;

	before('Connecting to db', async () => {
		await mongoose.connect(config.database);
	})

	beforeEach('Setting default period like it was from request', () => {
		requestPeriod = {
			to: { y: '2017',  m: '11',  d: '24', },
			from: { y: '2017',  m: '11',  d: '22', }
		};
		name = 'BeaReetou';
		expectedDataByPeriod = [ { date: 1511386876561, comment: 'кофе', sum: '120' } ];
		expectedData = { '15:25:56': { comment: 'обед', date: 1511353556099, sum: '350'} };
		expectedDataBySpecificPeriod = { date: 1510598140560, comment: 'Обед', sum: '270' };
		expectedPeriod = {
			from: { y: '2017', m: '11', d: '22', },
			to: { y: '2017', m: '11', d: '24', },
		}
	})

	it('should return data for username by single date without validating', async () => {
		_.unset(requestPeriod, 'to')
		expectedPeriod = { from: { y: '2017', m: '11', d: '22', } };
		assert.deepEqual(
			requestPeriod,
			expectedPeriod,
			'expected period before requesting stats by single date'
		);
		const result = await getStatsBySingleDate(name, requestPeriod);
		assert.deepEqual(result, expectedData, 'expectedData from single date')
	});

	it('should return data for username by period without validating', async () => {
		expectedPeriod = {
			from: { y: '2017', m: '11', d: '22', },
			to: { y: '2017', m: '11', d: '24', },
		}
		assert.deepEqual(
			requestPeriod,
			expectedPeriod,
			'expected period before requesting stats by period'
		);
		const result = await getStatsByPeriod(name, requestPeriod);
		assert.deepEqual(result, expectedDataByPeriod, 'expected data by period from database');
	})
	
	it('should return data for username by period without validating with different years', async () => {
		requestPeriod.from.y = "2016";
		expectedPeriod.from.y = "2016";
		assert.deepEqual(
			requestPeriod,
			expectedPeriod,
			'excepted period with different years'
		);
		const result = await getStatsByPeriod(name, requestPeriod);
		assert.deepEqual(result[0], expectedDataBySpecificPeriod);
	})

	it('should return data for username by period without validating with different months', async () => {
		requestPeriod.from.m = '10';
		expectedPeriod.from.m = '10';
		assert.deepEqual(
			requestPeriod,
			expectedPeriod,
			'excepted period with different years'
		);
		const result = await getStatsByPeriod(name, requestPeriod);
		assert.deepEqual(result[0], expectedDataBySpecificPeriod);
	})
})