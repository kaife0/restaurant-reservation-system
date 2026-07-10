import { useEffect, useState } from 'react';
import api from '../api/axios';
import { TIME_SLOTS } from '../constants';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import ReservationTable from '../components/ReservationTable';

const today = () => new Date().toISOString().slice(0, 10);

export default function CustomerDashboard() {
  const [form, setForm] = useState({ date: today(), slot: TIME_SLOTS[0], guests: 2 });
  const [availableTables, setAvailableTables] = useState(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const loadReservations = async () => {
    const { data } = await api.get('/reservations/me');
    setReservations(data.reservations);
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSelectedTable('');
    setSearching(true);
    try {
      const { data } = await api.get('/tables/available', { params: form });
      setAvailableTables(data.tables);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not check availability');
    } finally {
      setSearching(false);
    }
  };

  const handleBook = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/reservations', { ...form, table: selectedTable });
      setSuccess('Reservation confirmed!');
      setAvailableTables(null);
      setSelectedTable('');
      await loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    setError('');
    try {
      await api.delete(`/reservations/${id}`);
      await loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel reservation');
    }
  };

  return (
    <div className="page">
      <Card title="Book a table">
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
        <form onSubmit={handleSearch} className="booking-form">
          <Input
            label="Date"
            id="date"
            type="date"
            min={today()}
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Select
            label="Time Slot"
            id="slot"
            value={form.slot}
            options={TIME_SLOTS.map((s) => ({ value: s, label: s }))}
            onChange={(e) => setForm({ ...form, slot: e.target.value })}
          />
          <Input
            label="Guests"
            id="guests"
            type="number"
            min={1}
            required
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
          />
          <Button type="submit" disabled={searching}>
            {searching ? 'Checking…' : 'Check availability'}
          </Button>
        </form>

        {availableTables && (
          <div className="tables-result">
            {availableTables.length === 0 ? (
              <p className="muted">No tables available for that date, time and party size.</p>
            ) : (
              <>
                <Select
                  label="Choose a table"
                  id="table"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  options={[
                    { value: '', label: 'Select a table' },
                    ...availableTables.map((t) => ({
                      value: t._id,
                      label: `Table ${t.number} — seats ${t.capacity}`,
                    })),
                  ]}
                />
                <Button onClick={handleBook} disabled={!selectedTable || loading}>
                  {loading ? 'Booking…' : 'Confirm reservation'}
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      <Card title="My Reservations">
        {reservations === null ? <Loader /> : <ReservationTable reservations={reservations} onCancel={handleCancel} />}
      </Card>
    </div>
  );
}
