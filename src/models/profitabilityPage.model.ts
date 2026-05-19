import mongoose, { Schema } from 'mongoose';

const ProfitabilityPageSchema: Schema = new Schema(
  {
    _id: { type: String, default: 'profitability' },
    hero: {
      visible: { type: Boolean, default: true },
      tagNum: String,
      tagLabel: String,
      headline: String,
      italicWord: String,
      mono: String,
    },
    calculator: {
      visible: { type: Boolean, default: true },
      configHeading: String,
      resultsHeading: String,
      disclaimer: String,
      miners: [{ name: String, hashrate: Number, power: Number, algo: String }],
      defaults: { electricityRate: Number, months: Number },
    },
    faqs: {
      visible: { type: Boolean, default: true },
      sectionTag: String,
      items: [{ q: String, a: String }],
    },
  },
  { timestamps: true, strict: false }
);

const ProfitabilityPage = mongoose.model('ProfitabilityPage', ProfitabilityPageSchema);
export default ProfitabilityPage;
