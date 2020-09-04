const mongoose = require('mongoose')
const stepsSchema = require('./steps')

const paddockSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  steps: [stepsSchema],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Paddock', paddockSchema)
