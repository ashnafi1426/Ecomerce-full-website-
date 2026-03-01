import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerSupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getSupportTickets();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Failed to load tickets');
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (ticketId) => {
    const response = prompt('Enter your response:');
    if (!response) return;

    try {
      await managerAPI.respondToTicket(ticketId, { response });
      toast.success('Response sent successfully');
      fetchTickets();
    } catch (err) {
      console.error('Error responding to ticket:', err);
      toast.error(err.message || 'Failed to send response');
    }
  };

  const handleClose = async (ticketId) => {
    try {
      await managerAPI.closeTicket(ticketId);
      toast.success('Ticket closed successfully');
      fetchTickets();
    } catch (err) {
      console.error('Error closing ticket:', err);
      toast.error(err.message || 'Failed to close ticket');
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">🎫 Support Tickets</h1>
        <p className="text-[#565959]">Manage customer support tickets</p>
      </div>

      <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Tickets</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button onClick={fetchTickets} className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]">
              Try Again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">No Open Tickets!</h2>
            <p className="text-[#565959]">All support tickets have been resolved</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                    <td className="px-6 py-4 font-medium text-[#0F1111]">#TKT-{ticket.id}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{ticket.subject || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{ticket.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{ticket.category || 'General'}</td>
                    <td className="px-6 py-4 text-[#565959]">{ticket.created_at || 'Recently'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        ticket.status === 'closed' 
                          ? 'bg-[#E6F4F1] text-[#067D62]' 
                          : 'bg-[#FFF4E5] text-[#F08804]'
                      }`}>
                        {ticket.status || 'Open'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="border border-[#D5D9D9] px-3 py-1 rounded text-sm hover:bg-[#F7F8F8]">
                          View
                        </button>
                        {ticket.status !== 'closed' && (
                          <>
                            <button
                              onClick={() => handleRespond(ticket.id)}
                              className="bg-[#FF9900] text-white px-3 py-1 rounded text-sm hover:bg-[#F08804]"
                            >
                              Respond
                            </button>
                            <button
                              onClick={() => handleClose(ticket.id)}
                              className="bg-[#067D62] text-white px-3 py-1 rounded text-sm hover:bg-[#056d54]"
                            >
                              Close
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerSupportTicketsPage;
