import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Settings() {
  const [formData, setFormData] = useState({
    defaultMessage: "",
    enableGPS: true,
    autoSendDelay: 5,
  });

  const settings = useQuery(api.settings.getUserSettings);
  const updateSettings = useMutation(api.settings.updateUserSettings);

  useEffect(() => {
    if (settings) {
      setFormData({
        defaultMessage: settings.defaultMessage,
        enableGPS: settings.enableGPS,
        autoSendDelay: settings.autoSendDelay,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.defaultMessage.trim()) {
      toast.error("Please enter a default message");
      return;
    }

    if (formData.autoSendDelay < 0 || formData.autoSendDelay > 60) {
      toast.error("Auto-send delay must be between 0 and 60 seconds");
      return;
    }

    try {
      await updateSettings(formData);
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const testLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }

    toast.info("Getting your location...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        toast.success(`Location found! Accuracy: ${Math.round(accuracy)}m`);
        console.log("Location:", { latitude, longitude, accuracy });
      },
      (error) => {
        let message = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  if (!settings) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Default Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Emergency Message
          </label>
          <textarea
            value={formData.defaultMessage}
            onChange={(e) => setFormData({ ...formData, defaultMessage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Enter your default emergency message..."
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            This message will be sent to your emergency contacts. You can customize it before sending.
          </p>
        </div>

        {/* GPS Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enable GPS Location
              </label>
              <p className="text-sm text-gray-500">
                Include your location in emergency messages
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableGPS}
                onChange={(e) => setFormData({ ...formData, enableGPS: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {formData.enableGPS && (
            <div className="ml-4 space-y-2">
              <button
                type="button"
                onClick={testLocation}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Test Location Access
              </button>
              <p className="text-xs text-gray-500">
                Make sure to allow location access when prompted by your browser.
              </p>
            </div>
          )}
        </div>

        {/* Auto-send Delay */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto-send Delay (seconds)
          </label>
          <input
            type="number"
            min="0"
            max="60"
            value={formData.autoSendDelay}
            onChange={(e) => setFormData({ ...formData, autoSendDelay: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Time to wait before automatically sending SOS. Set to 0 for no delay.
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Save Settings
        </button>
      </form>

      {/* Twilio Configuration Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">📱 SMS Configuration Required</h3>
        <p className="text-yellow-700 text-sm mb-2">
          To send SMS alerts, you need to configure Twilio credentials:
        </p>
        <ul className="text-yellow-700 text-sm space-y-1 ml-4">
          <li>• TWILIO_ACCOUNT_SID</li>
          <li>• TWILIO_AUTH_TOKEN</li>
          <li>• TWILIO_PHONE_NUMBER</li>
        </ul>
        <p className="text-yellow-700 text-sm mt-2">
          Add these as environment variables in your Convex dashboard under Settings → Environment Variables.
        </p>
      </div>

      {/* Browser Compatibility */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">🌐 Browser Compatibility</h3>
        <p className="text-blue-700 text-sm">
          This app works on all modern browsers including Chrome, Firefox, Safari, and Edge. 
          GPS location requires HTTPS in production and user permission.
        </p>
      </div>
    </div>
  );
}
