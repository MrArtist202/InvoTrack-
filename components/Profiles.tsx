
import React, { useState, useEffect, useRef } from 'react';
import { User, Profile } from '../types';
import { profilesAPI } from '../api';
import { Plus, Edit2, Trash2, User as UserIcon, MapPin, Phone, Mail, Star, X, Camera } from 'lucide-react';

interface ProfilesProps {
    user: User;
}

const Profiles: React.FC<ProfilesProps> = ({ user }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        avatar: '',
    });

    useEffect(() => {
        loadProfiles();
    }, [user]);

    const loadProfiles = async () => {
        try {
            const all = await profilesAPI.getAll();
            setProfiles(all);
        } catch (error) {
            console.error('Failed to load profiles:', error);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', address: '', phone: '', email: '', avatar: '' });
        setEditingProfile(null);
    };

    const openEditForm = (profile: Profile) => {
        setEditingProfile(profile);
        setFormData({
            name: profile.name,
            address: profile.address,
            phone: profile.phone,
            email: profile.email || '',
            avatar: profile.avatar || '',
        });
        setShowForm(true);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500000) {
                alert('Image too large. Please choose an image under 500KB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, avatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProfile) {
                await profilesAPI.update(editingProfile.id, {
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    avatar: formData.avatar,
                    is_default: editingProfile.isDefault,
                });
            } else {
                await profilesAPI.create({
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    avatar: formData.avatar,
                    is_default: profiles.length === 0,
                });
            }
            loadProfiles();
            setShowForm(false);
            resetForm();
        } catch (error: any) {
            alert(error.message || 'Failed to save profile');
        }
    };

    const deleteProfile = async (id: string) => {
        try {
            await profilesAPI.delete(id);
            setDeleteConfirm(null);
            loadProfiles();
        } catch (error: any) {
            alert(error.message || 'Failed to delete profile');
        }
    };

    const setAsDefault = async (id: string) => {
        try {
            await profilesAPI.setDefault(id);
            loadProfiles();
        } catch (error: any) {
            alert(error.message || 'Failed to set default profile');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Business Profiles</h2>
                    <p className="text-sm text-slate-500">Create profiles to use on your invoices</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all text-sm"
                >
                    <Plus size={16} />
                    New Profile
                </button>
            </div>

            {/* Profiles Grid */}
            {profiles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="text-slate-300" size={32} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-2">No profiles yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Create your first business profile</p>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all text-sm"
                    >
                        <Plus size={16} />
                        Create Profile
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            className={`bg-white rounded-xl border-2 p-4 relative group transition-all hover:shadow-md ${profile.isDefault ? 'border-indigo-500' : 'border-slate-200'
                                }`}
                        >
                            {profile.isDefault && (
                                <div className="absolute -top-2 left-3 bg-indigo-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Star size={8} fill="white" /> Default
                                </div>
                            )}

                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!profile.isDefault && (
                                    <button onClick={() => setAsDefault(profile.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Set Default">
                                        <Star size={14} />
                                    </button>
                                )}
                                <button onClick={() => openEditForm(profile)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => setDeleteConfirm(profile.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold flex-shrink-0 overflow-hidden border-2 border-white shadow">
                                    {profile.avatar ? (
                                        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                                    ) : profile.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900 truncate">{profile.name}</h3>
                                    <p className="flex items-center gap-1.5 text-slate-500 text-xs truncate mt-1">
                                        <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                                        {profile.address}
                                    </p>
                                    <p className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                                        <Phone size={12} className="text-slate-400 flex-shrink-0" />
                                        {profile.phone}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">{editingProfile ? 'Edit Profile' : 'New Profile'}</h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center overflow-hidden transition-all cursor-pointer group"
                                >
                                    {formData.avatar ? (
                                        <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={28} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                    )}
                                </button>
                                <p className="text-xs text-slate-400 mt-2">Click to upload photo</p>
                            </div>

                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Name *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g., John Doe Designs"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Address */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g., 123 Main St, NYC, NY 10001"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone *</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); resetForm(); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all text-sm"
                                >
                                    {editingProfile ? 'Save Changes' : 'Create Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-red-100 rounded-xl"><Trash2 className="text-red-600" size={20} /></div>
                            <div>
                                <h3 className="font-bold text-slate-800">Delete Profile?</h3>
                                <p className="text-xs text-slate-500">This cannot be undone</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm">Cancel</button>
                            <button onClick={() => deleteProfile(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all text-sm">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profiles;
