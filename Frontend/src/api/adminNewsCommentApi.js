import axiosClient from './axiosClient'

const adminNewsCommentApi = {
  list: (params) => {
    return axiosClient.get('/admin/news-comments', { params })
  },
  
  toggleStatus: (id) => {
    return axiosClient.patch(`/admin/news-comments/${id}/toggle-status`)
  },

  reply: (id, data) => {
    return axiosClient.post(`/admin/news-comments/${id}/reply`, data)
  }
}

export default adminNewsCommentApi
