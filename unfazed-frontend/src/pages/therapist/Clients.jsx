
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import ClientCard from "../../components/crm/ClientCard";
import ClientTable from "../../components/crm/ClientTable";
import ChatWindow from "../../components/chat/ChatWindow";
import "./Clients.css";

function Clients() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [chatClient, setChatClient] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/clients", {
        params: { search, status, sortBy, order }
      });

      setClients(response.data.clients || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, status, sortBy, order]);

  const addClient = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await axiosInstance.post("/clients", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim()
      });

      setName("");
      setEmail("");
      setPhone("");
      setMessage("Client added successfully.");

      await fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add client.");
    } finally {
      setSaving(false);
    }
  };

  const viewClient = async (id) => {
    try {
      setError("");
      setMessage("");
      setLoading(true);

      const response = await axiosInstance.get(`/clients/${id}`);
      setSelectedClient(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load client profile.");
    } finally {
      setLoading(false);
    }
  };

  const removeClient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await axiosInstance.delete(`/clients/${id}`);
      setMessage(response.data.message || "Client deleted successfully.");

      if (chatClient?._id === id) setChatClient(null);
      if (selectedClient?._id === id) setSelectedClient(null);

      await fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete this client.");
    }
  };

  const deactivateClient = async (id) => {
    try {
      setError("");
      setMessage("");

      await axiosInstance.put(`/clients/${id}`, {
        status: "inactive"
      });

      setMessage("Client marked as inactive.");
      await fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update client.");
    }
  };

  return (
    <main className="clients-page">
      <h1>Clients</h1>
      <p>Manage your client records and conversations.</p>

      {message && <p>{message}</p>}
      {error && <p role="alert">{error}</p>}

      {chatClient ? (
        <section>
          <button onClick={() => setChatClient(null)}>
            Back to Clients
          </button>

          <ChatWindow
            clientId={chatClient._id}
            clientName={chatClient.name}
          />
        </section>
      ) : selectedClient ? (
        <ClientCard
          data={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      ) : (
        <>
          <section>
            <h2>Add New Client</h2>

            <form onSubmit={addClient}>
              <input
                type="text"
                placeholder="Client name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <input
                type="email"
                placeholder="Client email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <button type="submit" disabled={saving}>
                {saving ? "Adding..." : "Add Client"}
              </button>
            </form>
          </section>

          <section>
            <h2>Search and Filter</h2>

            <input
              type="search"
              placeholder="Search by name, email or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <label>
              Status:
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All clients</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <label>
              Sort by:
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Date added</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="status">Status</option>
              </select>
            </label>

            <label>
              Order:
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
          </section>

          {loading ? (
            <p>Loading clients...</p>
          ) : (
            <ClientTable
              clients={clients}
              onView={viewClient}
              onDelete={removeClient}
              onDeactivate={deactivateClient}
              onChat={(client) => {
                setSelectedClient(null);
                setChatClient(client);
              }}
            />
          )}
        </>
      )}
    </main>
  );
}

export default Clients;
