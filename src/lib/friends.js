import { api } from './api'

export const fetchFriends = () => api('/friends')
export const fetchSuggestions = () => api('/friends/suggestions').then((r) => r.users)
export const searchUsers = (q) => api(`/users/search?q=${encodeURIComponent(q)}`).then((r) => r.users)
export const fetchUser = (idOrName) => api(`/users/${encodeURIComponent(idOrName)}`).then((r) => r.user)
export const requestFriend = (id) => api('/friends/request', { method: 'POST', body: { id } })
export const acceptFriend = (id) => api('/friends/accept', { method: 'POST', body: { id } })
export const declineFriend = (id) => api('/friends/decline', { method: 'POST', body: { id } }) // и отмена своей заявки
export const removeFriend = (id) => api(`/friends/${id}`, { method: 'DELETE' })
export const blockUser = (id) => api('/blocks', { method: 'POST', body: { id } })
export const unblockUser = (id) => api(`/blocks/${id}`, { method: 'DELETE' })
