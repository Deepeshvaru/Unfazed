
function ClientTable({
  clients = [],
  onView,
  onDelete,
  onDeactivate,
  onChat
}) {
  if (!clients.length) {
    return <p>No clients found.</p>;
  }

  return (
    <section>
      <h2>Client List</h2>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {clients.map((client) => (
              <tr key={client._id}>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.phone || "-"}</td>
                <td>{client.status}</td>

                <td>
                  <button onClick={() => onView(client._id)}>
                    View
                  </button>

                  <button onClick={() => onChat?.(client)}>
                    Chat
                  </button>

                  {client.status === "active" && (
                    <button onClick={() => onDeactivate(client._id)}>
                      Deactivate
                    </button>
                  )}

                  <button onClick={() => onDelete(client._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ClientTable;
