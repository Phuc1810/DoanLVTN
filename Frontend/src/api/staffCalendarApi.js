import axiosClient from "./axiosClient";

export const staffCalendarApi = {
  getEvents: (start, end) => {
    return axiosClient.get("/staff/calendar", {
      params: { start, end },
    });
  },
};
