const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { TIME_SLOTS } = require('../constants');

// @route GET /api/tables
const getTables = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort('number');
  res.json({ success: true, count: tables.length, tables });
});

// @route GET /api/tables/available?date=&slot=&guests=
const getAvailableTables = asyncHandler(async (req, res) => {
  const { date, slot, guests } = req.query;
  if (!date || !slot) throw new ApiError(400, 'date and slot query params are required');
  if (!TIME_SLOTS.includes(slot)) throw new ApiError(400, 'Invalid time slot');

  const guestCount = Number(guests) || 1;
  const bookedTableIds = await Reservation.find({ date, slot, status: 'active' }).distinct('table');

  const tables = await Table.find({
    _id: { $nin: bookedTableIds },
    capacity: { $gte: guestCount },
  }).sort('number');

  res.json({ success: true, count: tables.length, tables });
});

// @route POST /api/tables (admin)
const createTable = asyncHandler(async (req, res) => {
  const { number, capacity } = req.body;
  if (!number || !capacity) throw new ApiError(400, 'Table number and capacity are required');

  const existing = await Table.findOne({ number });
  if (existing) throw new ApiError(409, `Table ${number} already exists`);

  const table = await Table.create({ number, capacity });
  res.status(201).json({ success: true, table });
});

// @route PUT /api/tables/:id (admin)
const updateTable = asyncHandler(async (req, res) => {
  const { number, capacity } = req.body;

  if (number) {
    const existing = await Table.findOne({ number, _id: { $ne: req.params.id } });
    if (existing) throw new ApiError(409, `Table ${number} already exists`);
  }

  const table = await Table.findByIdAndUpdate(
    req.params.id,
    { ...(number && { number }), ...(capacity && { capacity }) },
    { new: true, runValidators: true }
  );
  if (!table) throw new ApiError(404, 'Table not found');

  res.json({ success: true, table });
});

// @route DELETE /api/tables/:id (admin)
const deleteTable = asyncHandler(async (req, res) => {
  const hasActiveReservations = await Reservation.exists({ table: req.params.id, status: 'active' });
  if (hasActiveReservations) {
    throw new ApiError(409, 'Cannot delete a table with active reservations');
  }

  const table = await Table.findByIdAndDelete(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');

  res.json({ success: true, message: 'Table deleted' });
});

module.exports = { getTables, getAvailableTables, createTable, updateTable, deleteTable };
