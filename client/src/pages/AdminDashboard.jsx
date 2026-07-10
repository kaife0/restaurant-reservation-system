import { useEffect, useState } from 'react';
import api from '../api/axios';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import ReservationTable from '../components/ReservationTable';
import PageHeader from '../components/PageHeader';

export default function AdminDashboard() {
  const [reservations, setReservations] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [tables, setTables] = useState(null);
  const [newTable, setNewTable] = useState({ number: '', capacity: '' });
  const [error, setError] = useState('');
  const [tableError, setTableError] = useState('');

  const loadReservations = async (date) => {
    const { data } = await api.get('/reservations', { params: date ? { date } : {} });
    setReservations(data.reservations);
  };

  const loadTables = async () => {
    const { data } = await api.get('/tables');
    setTables(data.tables);
  };

  useEffect(() => {
    loadReservations();
    loadTables();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    loadReservations(dateFilter);
  };

  const handleCancel = async (id) => {
    setError('');
    try {
      await api.put(`/reservations/${id}`, { status: 'cancelled' });
      await loadReservations(dateFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel reservation');
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    setTableError('');
    try {
      await api.post('/tables', {
        number: Number(newTable.number),
        capacity: Number(newTable.capacity),
      });
      setNewTable({ number: '', capacity: '' });
      await loadTables();
    } catch (err) {
      setTableError(err.response?.data?.message || 'Could not add table');
    }
  };

  const handleDeleteTable = async (id) => {
    setTableError('');
    try {
      await api.delete(`/tables/${id}`);
      await loadTables();
    } catch (err) {
      setTableError(err.response?.data?.message || 'Could not delete table');
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Admin Panel"
        subtitle="Oversee every reservation and manage the restaurant's tables."
        badge="Admin"
      />
      <Card title="All Reservations">
        <Alert>{error}</Alert>
        <form onSubmit={handleFilter} className="filter-form">
          <Input
            label="Filter by date"
            id="dateFilter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <Button type="submit">Filter</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setDateFilter('');
              loadReservations();
            }}
          >
            Clear
          </Button>
        </form>
        {reservations === null ? (
          <Loader />
        ) : (
          <ReservationTable reservations={reservations} showCustomer onCancel={handleCancel} />
        )}
      </Card>

      <Card title="Manage Tables">
        <Alert>{tableError}</Alert>
        {tables === null ? (
          <Loader />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Table #</th>
                <th>Capacity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t._id}>
                  <td>{t.number}</td>
                  <td>{t.capacity}</td>
                  <td>
                    <Button variant="danger" onClick={() => handleDeleteTable(t._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form onSubmit={handleAddTable} className="booking-form">
          <Input
            label="Table number"
            id="number"
            type="number"
            min={1}
            required
            value={newTable.number}
            onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
          />
          <Input
            label="Capacity"
            id="capacity"
            type="number"
            min={1}
            required
            value={newTable.capacity}
            onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
          />
          <Button type="submit">Add table</Button>
        </form>
      </Card>
    </div>
  );
}
