import mongoose, { Schema } from 'mongoose';

const CounterSchema: Schema = new Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', CounterSchema);
export default Counter;
