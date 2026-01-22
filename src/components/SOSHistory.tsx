import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function SOSHistory() {
  const sosHistory = useQuery(api.sos.getSOSHistory);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">SOS History</h2>

      {!sosHistory || sosHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No SOS alerts sent yet.</p>
          <p className="text-sm">Your emergency alert history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sosHistory.map((event) => (
            <div key={event._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getStatusIcon(event.status)}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(event.timestamp)}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Message:</h3>
                  <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded">
                    {event.message}
                  </p>
                </div>

                {event.latitude && event.longitude && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Location:</h4>
                    <div className="text-sm text-gray-600">
                      <p>Coordinates: {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}</p>
                      {event.locationAccuracy && (
                        <p>Accuracy: {Math.round(event.locationAccuracy)}m</p>
                      )}
                      <a
                        href={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View on Google Maps →
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Contacts Notified:</h4>
                  <p className="text-sm text-gray-600">
                    {event.contactsNotified.length} contact{event.contactsNotified.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sosHistory && sosHistory.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm text-center">
            📋 Showing last 20 SOS events. Older events are automatically archived.
          </p>
        </div>
      )}
    </div>
  );
}
