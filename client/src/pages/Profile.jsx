import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState({})
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [updateData, setUpdateData] = useState({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/api/users/profile')
      setProfile(res.data.user)
      setUpdateData({
        name: res.data.user.name,
        age: res.data.user.age || '',
        gender: res.data.user.gender || '',
        location: res.data.user.location || '',
        phone: res.data.user.phone || '',
        profileImage: res.data.user.profileImage || '',
        dateOfBirth: res.data.user.dateOfBirth ? new Date(res.data.user.dateOfBirth).toISOString().slice(0, 10) : '',
        addressLine1: res.data.user.addressLine1 || '',
        addressLine2: res.data.user.addressLine2 || '',
        city: res.data.user.city || '',
        state: res.data.user.state || '',
        country: res.data.user.country || '',
        postalCode: res.data.user.postalCode || '',
      })
    } catch (error) {
      console.error('Profile fetch error:', error)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiClient.put('/api/users/profile', updateData)
      setProfile(res.data.user)
      setEditMode(false)
    } catch (error) {
      console.error('Update error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUpdateData({ ...updateData, profileImage: reader.result })
    }
    reader.readAsDataURL(file)
  }

  if (!user) return <p className="text-center py-20 text-gray-500">Please login to view profile</p>

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Card */}
          <div className="flex-1">
            <div className="text-center md:text-left mb-8">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full mx-auto md:ml-0 object-cover border-4 border-orange-300"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full mx-auto md:ml-0 flex items-center justify-center">
                  <i className="fas fa-user text-3xl text-white"></i>
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mt-4">{profile.name}</h1>
              <p className="text-xl text-gray-600">{profile.role === 'admin' ? 'Admin' : 'Customer'}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-semibold">{profile.email}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>
                <p className="font-semibold">{profile.phone || 'Not set'}</p>
              </div>
              <div>
                <span className="text-gray-500">Purchases:</span>
                <p className="font-semibold">{profile.purchaseHistory || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Browsing:</span>
                <p className="font-semibold">{profile.browsingHistory || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Member Since:</span>
                <p className="font-semibold">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Address:</span>
                <p className="font-semibold">
                  {[profile.addressLine1, profile.addressLine2, profile.city, profile.state, profile.country, profile.postalCode]
                    .filter(Boolean)
                    .join(', ') || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="flex-1 border-l md:border-l-0 md:border-t border-gray-200 md:pl-8 pt-8 md:pt-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Profile Settings
              </h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editMode && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={updateData.name}
                    onChange={(e) => setUpdateData({...updateData, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Image (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={updateData.phone}
                      onChange={(e) => setUpdateData({...updateData, phone: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={updateData.age}
                      onChange={(e) => setUpdateData({...updateData, age: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={updateData.gender}
                      onChange={(e) => setUpdateData({...updateData, gender: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={updateData.dateOfBirth}
                      onChange={(e) => setUpdateData({...updateData, dateOfBirth: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={updateData.location}
                    onChange={(e) => setUpdateData({...updateData, location: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={updateData.addressLine1}
                    onChange={(e) => setUpdateData({...updateData, addressLine1: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={updateData.addressLine2}
                    onChange={(e) => setUpdateData({...updateData, addressLine2: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    value={updateData.city}
                    onChange={(e) => setUpdateData({...updateData, city: e.target.value})}
                    placeholder="City"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                  />
                  <input
                    type="text"
                    value={updateData.state}
                    onChange={(e) => setUpdateData({...updateData, state: e.target.value})}
                    placeholder="State"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                  />
                  <input
                    type="text"
                    value={updateData.country}
                    onChange={(e) => setUpdateData({...updateData, country: e.target.value})}
                    placeholder="Country"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                  />
                  <input
                    type="text"
                    value={updateData.postalCode}
                    onChange={(e) => setUpdateData({...updateData, postalCode: e.target.value})}
                    placeholder="Postal Code"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-400 focus:border-orange-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-lg font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

