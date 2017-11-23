import {getStatsByPeriod, getStatsBySingleDate, getStats} from '../src/index';
import { assert } from 'chai';
import * as _ from 'lodash'
import * as mongoose from 'mongoose';
const config = require('../config.json');

describe(`getStats functions`.magenta, () => {
	let requestPeriod, name, expectedData, expectedDataByPeriod, expectedPeriod, expectedDataBySpecificPeriod;

	after('Disconnecting from db', async () => {
		await mongoose.disconnect();
	})

	beforeEach('Setting default period like it was from request', () => {
		requestPeriod = {
			from: { y: '2017',  m: '11',  d: '22', },
			to: { y: '2017',  m: '11',  d: '24', },
		};
		name = 'TestUser';
		expectedDataByPeriod = [
			{ date: 1511353556099, comment: 'TestComment', sum: '42' },
			{ date: 1511353556011, comment: 'TestComment', sum: '42' },
		];
		expectedData = { comment: 'TestComment', date: 1511353556011, sum: '42' };
		expectedDataBySpecificPeriod = { date: 1511353556099, comment: 'TestComment', sum: '42' };
		expectedPeriod = {
			from: { y: '2017', m: '11', d: '22', },
			to: { y: '2017', m: '11', d: '24', },
		}
	})

	it('should return data for username by single date without validating', async () => {
		_.unset(requestPeriod, 'to')
		requestPeriod.from.d = '23';
		expectedPeriod = { from: { y: '2017', m: '11', d: '23', } };
		assert.deepEqual(
			requestPeriod,
			expectedPeriod,
			'expected period before requesting stats by single date'
		);
		const result = await getStatsBySingleDate(name, requestPeriod);
		assert.deepEqual(result['15:26:56'], expectedData, 'expectedData from single date')
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
		requestPeriod.from.y = '2016';
		expectedPeriod.from.y = '2016';
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

	it('should return data for username by period without validating with different months and years', async () => {
		requestPeriod.from.m = '10';
		expectedPeriod.from.m = '10';
		requestPeriod.from.y = '2016';
		expectedPeriod.from.y = '2016';
		assert.deepEqual(
			requestPeriod,
			expectedPeriod,
			'excepted period with different years'
		);
		const result = await getStatsByPeriod(name, requestPeriod);
		assert.deepEqual(result[0], expectedDataBySpecificPeriod);
	})

	it('should return data for username by single data with validating', async () => {
		_.unset(requestPeriod, 'to');
		_.unset(expectedPeriod, 'to');
		requestPeriod.from.d = '23';
		expectedPeriod.from.d = '23';
		expectedData = {
			"15:25:56": {
				"sum": "42",
				"comment": "TestComment",
				"date": 1511353556099
			},
			"15:26:56": {
				"sum": "42",
				"comment": "TestComment",
				"date": 1511353556011
			}
		}
		assert.deepEqual(requestPeriod, expectedPeriod);
		const result = await getStats(name, requestPeriod);
		assert.deepEqual(result, expectedData);
	})

	it('should return data for username by period with validating', async () => {
		assert.deepEqual(requestPeriod, expectedPeriod);
		const result = await getStats(name, requestPeriod);
		assert.deepEqual(result, expectedDataByPeriod);
	})

	it('should return data for username by period with validating and different years', async () => {
		requestPeriod.from.y = '2016';
		expectedPeriod.from.y = '2016';
		assert.deepEqual(requestPeriod, expectedPeriod);
		const result = await getStats(name, requestPeriod);
		assert.deepEqual(result[0], expectedDataBySpecificPeriod);
	})

	it('should return data for username by period with validating and different months', async () => {
		requestPeriod.from.m = '10';
		expectedPeriod.from.m = '10';
		assert.deepEqual(requestPeriod, expectedPeriod);
		const result = await getStats(name, requestPeriod);
		assert.deepEqual(result[0], expectedDataBySpecificPeriod);
	})

	it('should return data for username by period with validating and different years and months', async () => {
		requestPeriod.from.m = '10';
		expectedPeriod.from.m = '10';
		requestPeriod.from.y = '2016';
		expectedPeriod.from.y = '2016';
		assert.deepEqual(requestPeriod, expectedPeriod);
		const result = await getStats(name, requestPeriod);
		assert.deepEqual(result[0], expectedDataBySpecificPeriod);
	})
})