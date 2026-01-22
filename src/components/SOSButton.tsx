import { useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function SOSButton() {
  const [isActivating, setIsActivating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  
  const sendSOS = useAction(api.sos.sendSOSAlert);
  const settings = useQuery(api.settings.getUserSettings);
  const contacts = useQuery(api.contacts.getActiveContacts);

  useEffect(() => {
    if (settings?.defaultMessage && !customMessage) {
      setCustomMessage(settings.defaultMessage);
    }
  }, [settings, customMessage]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleSendSOS();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const handleSOSActivation = async () => {
    if (!contacts || contacts.length === 0) {
      toast.error("Please add emergency contacts first!");
      return;
    }

    setIsActivating(true);

    // Get location if GPS is enabled
    if (settings?.enableGPS) {
      try {
        const position = await getCurrentLocation();
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        toast.success("Location acquired");
      } catch (error) {
        console.error("Location error:", error);
        toast.warning("Could not get location, continuing without GPS");
      }
    }

    // Start countdown
    const delay = settings?.autoSendDelay || 5;
    setCountdown(delay);
    toast.info(`SOS will be sent in ${delay} seconds. Tap Cancel to stop.`);
  };

  const handleSendSOS = async () => {
    try {
      const result = await sendSOS({
        message: customMessage || settings?.defaultMessage || "Emergency! I need help!",
        latitude: location?.latitude,
        longitude: location?.longitude,
        locationAccuracy: location?.accuracy,
      });

      if (result.success) {
        toast.success(`SOS sent to ${result.contactsNotified} contacts!`);
      } else {
        toast.error("Some messages failed to send");
      }
    } catch (error) {
      console.error("SOS Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send SOS");
    } finally {
      setIsActivating(false);
      setCountdown(0);
    }
  };

  const handleCancel = () => {
    setIsActivating(false);
    setCountdown(0);
    toast.info("SOS cancelled");
  };

  const handleInstantSOS = async () => {
    if (!contacts || contacts.length === 0) {
      toast.error("Please add emergency contacts first!");
      return;
    }

    // Get location if GPS is enabled
    let currentLocation = location;
    if (settings?.enableGPS && !currentLocation) {
      try {
        const position = await getCurrentLocation();
        currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
      } catch (error) {
        console.error("Location error:", error);
      }
    }

    try {
      const result = await sendSOS({
        message: customMessage || settings?.defaultMessage || "Emergency! I need help!",
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        locationAccuracy: currentLocation?.accuracy,
      });

      if (result.success) {
        toast.success(`SOS sent to ${result.contactsNotified} contacts!`);
      } else {
        toast.error("Some messages failed to send");
      }
    } catch (error) {
      console.error("SOS Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send SOS");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Emergency SOS</h2>
        <p className="text-gray-600">
          {contacts?.length || 0} emergency contact{contacts?.length !== 1 ? 's' : ''} configured
        </p>
      </div>

      {/* Custom Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emergency Message
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          rows={3}
          placeholder="Enter your emergency message..."
        />
      </div>

      {/* Location Status */}
      {settings?.enableGPS && (
        <div className="flex items-center justify-center space-x-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${location ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
          <span className="text-gray-600">
            {location ? 'GPS Location Ready' : 'GPS Location Pending'}
          </span>
        </div>
      )}

      {/* SOS Buttons */}
      <div className="space-y-4">
        {!isActivating ? (
          <>
            {/* Main SOS Button with Countdown */}
            <button
              onClick={handleSOSActivation}
              disabled={!contacts || contacts.length === 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-lg text-xl transition-colors shadow-lg"
            >
              🚨 ACTIVATE SOS
            </button>
            
            {/* Instant SOS Button */}
            <button
              onClick={handleInstantSOS}
              disabled={!contacts || contacts.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              ⚡ INSTANT SOS (No Countdown)
            </button>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-red-600">
              {countdown}
            </div>
            <p className="text-lg text-gray-700">
              Sending SOS in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
            <button
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              CANCEL
            </button>
          </div>
        )}
      </div>

      {(!contacts || contacts.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-center">
            ⚠️ No emergency contacts configured. Please add contacts in the Contacts tab.
          </p>
        </div>
      )}
    </div>
  );
}
