import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export default mongoose.model('User', new Schema({
  name: { type: String, unique: true, required: true },
  telegramId: { type: String, unique: true, required: true },
  stats: { type: Object, required: true },
}));
