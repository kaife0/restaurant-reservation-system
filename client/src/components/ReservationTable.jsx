import Badge from './Badge';
import Button from './Button';

// Shared by the customer dashboard (own reservations) and the admin
// dashboard (all reservations) — `showCustomer` and `onCancel` toggle
// the parts that differ between the two views.
export default function ReservationTable({ reservations, showCustomer = false, onCancel, emptyText }) {
  if (!reservations.length) return <p className="muted">{emptyText || 'No reservations found.'}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          {showCustomer && <th>Customer</th>}
          <th>Date</th>
          <th>Time Slot</th>
          <th>Table</th>
          <th>Guests</th>
          <th>Status</th>
          {onCancel && <th></th>}
        </tr>
      </thead>
      <tbody>
        {reservations.map((r) => (
          <tr key={r._id}>
            {showCustomer && (
              <td>
                {r.user?.name}
                <br />
                <span className="muted">{r.user?.email}</span>
              </td>
            )}
            <td>{r.date}</td>
            <td>{r.slot}</td>
            <td>#{r.table?.number} (seats {r.table?.capacity})</td>
            <td>{r.guests}</td>
            <td>
              <Badge status={r.status} />
            </td>
            {onCancel && (
              <td>
                {r.status === 'active' && (
                  <Button variant="danger" onClick={() => onCancel(r._id)}>
                    Cancel
                  </Button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
