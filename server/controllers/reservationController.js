const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { TIME_SLOTS } = require('../constants');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const validateBookingInput = ({ date, slot, guests, table }) => {
  if (!date || !slot || !guests || !table) {
    throw new ApiError(400, 'table, date, slot and guests are required');
  }
  if (!DATE_RE.test(date)) throw new ApiError(400, 'date must be in YYYY-MM-DD format');
  if (!TIME_SLOTS.includes(slot)) throw new ApiError(400, `slot must be one of: ${TIME_SLOTS.join(', ')}`);
  if (guests < 1) throw new ApiError(400, 'guests must be at least 1');

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) throw new ApiError(400, 'Cannot book a reservation in the past');
};

// @route POST /api/reservations
const createReservation = asyncHandler(async (req, res) => {
  const { table: tableId, date, slot, guests } = req.body;
  validateBookingInput({ date, slot, guests, table: tableId });

  const table = await Table.findById(tableId);
  if (!table) throw new ApiError(404, 'Table not found');
  if (table.capacity < guests) {
    throw new ApiError(400, `Table ${table.number} only seats ${table.capacity} guests`);
  }

  // No pre-check-then-insert here: the unique partial index on the
  // Reservation model is what actually prevents a double-booking race.
  // If two requests hit this at once, the second insert fails with code
  // 11000 and errorHandler turns that into a 409 for the client.
  const reservation = await Reservation.create({
    user: req.user._id,
    table: tableId,
    date,
    slot,
    guests,
  });

  const populated = await reservation.populate('table');
  res.status(201).json({ success: true, reservation: populated });
});

// @route GET /api/reservations/me
const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .populate('table')
    .sort('-date');
  res.json({ success: true, count: reservations.length, reservations });
});

// @route DELETE /api/reservations/:id (owner cancels their own)
const cancelMyReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, user: req.user._id });
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  if (reservation.status === 'cancelled') throw new ApiError(400, 'Reservation is already cancelled');

  reservation.status = 'cancelled';
  await reservation.save();

  res.json({ success: true, reservation });
});

// @route GET /api/reservations?date=YYYY-MM-DD (admin)
const getAllReservations = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const filter = date ? { date } : {};

  const reservations = await Reservation.find(filter)
    .populate('table')
    .populate('user', 'name email')
    .sort('-date');

  res.json({ success: true, count: reservations.length, reservations });
});

// @route PUT /api/reservations/:id (admin — update or cancel any reservation)
const updateReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw new ApiError(404, 'Reservation not found');

  const { date, slot, guests, table: tableId, status } = req.body;

  if (status) {
    if (!['active', 'cancelled'].includes(status)) throw new ApiError(400, 'Invalid status');
    reservation.status = status;
  }

  const nextTableId = tableId || reservation.table;
  const nextGuests = guests || reservation.guests;
  if (tableId || guests) {
    const table = await Table.findById(nextTableId);
    if (!table) throw new ApiError(404, 'Table not found');
    if (table.capacity < nextGuests) {
      throw new ApiError(400, `Table ${table.number} only seats ${table.capacity} guests`);
    }
  }

  if (date) {
    if (!DATE_RE.test(date)) throw new ApiError(400, 'date must be in YYYY-MM-DD format');
    reservation.date = date;
  }
  if (slot) {
    if (!TIME_SLOTS.includes(slot)) throw new ApiError(400, `slot must be one of: ${TIME_SLOTS.join(', ')}`);
    reservation.slot = slot;
  }
  if (guests) reservation.guests = guests;
  if (tableId) reservation.table = tableId;

  // Relies on the same unique partial index as createReservation to reject
  // conflicts atomically if this update collides with another active booking.
  await reservation.save();
  const populated = await reservation.populate(['table', { path: 'user', select: 'name email' }]);

  res.json({ success: true, reservation: populated });
});

module.exports = {
  createReservation,
  getMyReservations,
  cancelMyReservation,
  getAllReservations,
  updateReservation,
};
