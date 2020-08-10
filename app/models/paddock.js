const mongoose = require('mongoose')
const systemSchema = require('./system')

const paddockSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  systems: [systemSchema],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Paddock', paddockSchema)
