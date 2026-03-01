import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerEscalationsPage = () => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getEscalations();
      setEscalations(data.escalations || []);
    } catch (err) {
      console.error('Error fetching escalations:', err);
      setError(err.message || 'Failed to load escalations');
      toast.error('Failed to load escalated issues');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (escalationId) => {
    const assignee = prompt('Enter admin username to assign:');
    if (!assignee) return;

    try {
      await managerAPI.assignEscalation(escalationId, { assignee });
      toast.success('Escalation assigned successfully');
      fetchEscalations();
    } catch (err) {
      console.error('Error assigning escalation:', err);
      toast.error(err.message || 'Failed to assign escalation');
    }
  };

  if (loading && escalations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading escalations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">🚨 Escalated Issues</h1>
        <p className="text-[#565959]">Critical issues requiring admin attention</p>
      </div>

      <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Escalations</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button onClick={fetchEscalations} className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]">
              Try Again
            </button>
          </div>
        ) : escalations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">No Escalations!</h2>
            <p className="text-[#565959]">No issues have been escalated to admin</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Issue ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Escalated By</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Priority</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {escalations.map((escalation) => (
                  <tr key={escalation.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                    <td className="px-6 py-4 font-medium text-[#0F1111]">#ESC-{escalation.id}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{escalation.type || 'General'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{escalation.description || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{escalation.escalated_by || 'Manager'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFE5E5] text-[#C7511F]">
                        CRITICAL
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="border border-[#D5D9D9] px-3 py-1 rounded text-sm hover:bg-[#F7F8F8]">
                          Review
                        </button>
                        <button
                          onClick={() => handleAssign(escalation.id)}
                          className="bg-[#FF9900] text-white px-3 py-1 rounded text-sm hover:bg-[#F08804]"
                        >
                          Assign
                        </button>
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

export default ManagerEscalationsPage;
