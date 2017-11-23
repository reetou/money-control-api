import { assert, expect } from 'chai';
import * as mongoose from "mongoose";
import User from '../src/models/User';
const config = require('../config.json');
import {getUser, isUserExists, createUser, editUser} from "../src/index";
import * as moment from "moment";

describe(`Server`.magenta, () => {
	let expected, badExpected, userData, expectedData, data, value;

	before("Connecting to db", async () => {
		expected = `TestUser`;
		badExpected = 'Unexisting';
		data = {
			"2017": {
				"11": {
					"23": {
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
				}
			}
		}
		userData = {
			name: expected,
			telegramId: '123456789',
			stats: data
		};
		expectedData = {
			name: expected,
			message: `User ${expected} already exists.`,
			status: 'ERROR',
		};
		value = {
			sum: '42',
			comment: 'TestComment',
			date: moment("2017-11-25 15:15:15", "YYYY-MM-DD HH:mm:ss"),
		};
		await mongoose.disconnect();
		await mongoose.connect(config.database);
		User.collection.remove({ });
	})

	console.log(`Starting Server tests`.red)
	it('should connect to db', async () => {
		expect(mongoose.connection.readyState).to.equal(1)
	})

	it("should successfully create user", async () => {
		await assert.isFalse(await isUserExists(expected), 'user should not exist');
		const result = await createUser(userData);
		await assert.isTrue(await isUserExists(expected), 'user should exist after creating')
		const createdUser = await getUser(expected)
		assert.equal(createdUser.name, expected, 'should return expected name from get user');
		assert.deepEqual(result, expectedData, 'expected result from creating user')
	})

	it("should successfully edit user", async () => {
		const editedUser = await editUser(expected, value, value.date);
		const expectedEdited = {
			sum: '42',
			comment: 'TestComment',
			date: 1511612115000
		}
		assert.equal(
			editedUser.name,
			expected,
			'should return expected name from editedUser'
		)
		assert.deepEqual(
			editedUser.stats['2017']['11']['25']['15:15:15'],
			expectedEdited,
			'should return expected edited data from edited user'
		)
	})

	it('should return true if user exists', async () => {
		const reply = await isUserExists(expected);
		assert.isTrue(reply, "User exists");
	})

	it('should return false if user not exists', async () => {
		const reply = await isUserExists(badExpected);
		assert.isFalse(reply, "User not exists");
	})

	it("should return same username as expected", async () => {
		const reply = await getUser(expected);
		assert.equal(reply.name, expected, "Username from getting user data");
	})

	it("should return false if username at getUser not exists or anything", async () => {
		const reply = await getUser(badExpected);
		assert.isFalse(reply, "Result from getting bad username (non-existing)");
	})
})

