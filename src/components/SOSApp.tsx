import { useState } from "react";
import { ContactManager } from "./ContactManager";
import { SOSButton } from "./SOSButton";
import { Settings } from "./Settings";
import { SOSHistory } from "./SOSHistory";

export function SOSApp() {
  const [activeTab, setActiveTab] = useState<'sos' | 'contacts' | 'settings' | 'history'>('sos');

  const tabs = [
    { id: 'sos' as const, label: '🚨 SOS', color: 'bg-red-600 text-white' },
    { id: 'contacts' as const, label: '👥 Contacts', color: 'bg-blue-600 text-white' },
    { id: 'settings' as const, label: '⚙️ Settings', color: 'bg-gray-600 text-white' },
    { id: 'history' as const, label: '📋 History', color: 'bg-green-600 text-white' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? tab.color
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeTab === 'sos' && <SOSButton />}
        {activeTab === 'contacts' && <ContactManager />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'history' && <SOSHistory />}
      </div>
    </div>
  );
}
