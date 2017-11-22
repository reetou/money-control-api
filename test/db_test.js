import { assert, expect } from 'chai';
import * as mongoose from "mongoose";
const config = require('../config.json');
import {getUser, isUserExists} from "../src/index";

describe(`Server`.magenta, () => {
	let expected, badExpected;

	before("Connecting to db", async () => {
		expected = "BeaReetou";
		badExpected = "Unexisting";
		await mongoose.disconnect();
		await mongoose.connect(config.database)
	})

	after("Disconnecting from db", () => {
		mongoose.disconnect();
	})

	console.log(`Starting Server tests`.red)
	it('should connect to db', async () => {
		expect(mongoose.connection.readyState).to.equal(1)
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

