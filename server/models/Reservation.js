const mongoose = require('mongoose');
const { TIME_SLOTS } = require('../constants');

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    slot: { type: String, required: true, enum: TIME_SLOTS },
    guests: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
  },
  { timestamps: true }
);

// Core conflict guard: only one ACTIVE reservation per table/date/slot.
// A partial unique index enforces this atomically at the database level,
// so it holds even under concurrent requests (no race between check and insert).
reservationSchema.index(
  { table: 1, date: 1, slot: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

module.exports = mongoose.model('Reservation', reservationSchema);
