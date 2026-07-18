import axiosClient from './axiosClient';

export const staffOmniSearchApi = {
  search(query) {
    return axiosClient.get(`/staff/omni-search?q=${encodeURIComponent(query)}`);
  }
};
