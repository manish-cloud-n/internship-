import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface Contact {
  _id: Id<"contacts">;
  name: string;
  phone: string;
  relationship: string;
  isActive: boolean;
}

export function ContactManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    relationship: "",
    isActive: true,
  });

  const contacts = useQuery(api.contacts.listContacts);
  const addContact = useMutation(api.contacts.addContact);
  const updateContact = useMutation(api.contacts.updateContact);
  const deleteContact = useMutation(api.contacts.deleteContact);

  const resetForm = () => {
    setFormData({ name: "", phone: "", relationship: "", isActive: true });
    setIsAdding(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.relationship.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (editingContact) {
        await updateContact({
          contactId: editingContact._id,
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship,
          isActive: formData.isActive,
        });
        toast.success("Contact updated successfully");
      } else {
        await addContact({
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship,
        });
        toast.success("Contact added successfully");
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save contact");
    }
  };

  const handleEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isActive: contact.isActive,
    });
    setEditingContact(contact);
    setIsAdding(true);
  };

  const handleDelete = async (contactId: Id<"contacts">) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await deleteContact({ contactId });
        toast.success("Contact deleted successfully");
      } catch (error) {
        toast.error("Failed to delete contact");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Emergency Contacts</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Contact
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">
            {editingContact ? "Edit Contact" : "Add New Contact"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship *
              </label>
              <input
                type="text"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Spouse, Parent, Friend, Doctor"
                required
              />
            </div>
            {editingContact && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (will receive SOS alerts)
                </label>
              </div>
            )}
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {editingContact ? "Update Contact" : "Add Contact"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      <div className="space-y-3">
        {contacts?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No emergency contacts added yet.</p>
            <p className="text-sm">Add your first contact to get started.</p>
          </div>
        ) : (
          contacts?.map((contact) => (
            <div
              key={contact._id}
              className={`p-4 border rounded-lg ${
                contact.isActive ? "bg-white border-gray-200" : "bg-gray-50 border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                    {!contact.isActive && (
                      <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{contact.phone}</p>
                  <p className="text-sm text-gray-500">{contact.relationship}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contact._id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {contacts && contacts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            💡 <strong>Tip:</strong> Make sure your contacts' phone numbers include the country code (e.g., +1 for US).
            Only active contacts will receive SOS alerts.
          </p>
        </div>
      )}
    </div>
  );
}
