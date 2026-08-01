import { useEffect, useState, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import vi from 'date-fns/locale/vi'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useNavigate } from 'react-router-dom'
import { staffCalendarApi } from '../../api/staffCalendarApi'
import Loading from '../../components/common/Loading'

const locales = {
  'vi': vi,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

const messages = {
  allDay: 'Cả ngày',
  previous: 'Trước',
  next: 'Sau',
  today: 'Hôm nay',
  month: 'Tháng',
  week: 'Tuần',
  day: 'Ngày',
  agenda: 'Lịch trình',
  date: 'Ngày',
  time: 'Thời gian',
  event: 'Sự kiện',
  noEventsInRange: 'Không có tour khởi hành trong khoảng thời gian này.',
  showMore: total => `+ Xem thêm (${total})`
};

export default function StaffCalendarPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState(Views.MONTH)

  const handleViewChange = (newView) => {
    setCurrentView(newView)
  }

  const fetchEvents = useCallback(async (date) => {
    setLoading(true)
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // Fetch a generous range (month +/- 2 weeks) to cover month, week, and agenda views
      const startDate = new Date(year, month, -14);
      const endDate = new Date(year, month + 1, 14);
      
      const formatLocal = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const res = await staffCalendarApi.getEvents(formatLocal(startDate), formatLocal(endDate));
      const data = res.data || res;
      
      const calendarEvents = data.map(item => {
        const [sYear, sMonth, sDay] = item.start.split('-');
        const startDate = new Date(Number(sYear), Number(sMonth) - 1, Number(sDay));
        
        const [eYear, eMonth, eDay] = item.end.split('-');
        const endDate = new Date(Number(eYear), Number(eMonth) - 1, Number(eDay));
        
        // React Big Calendar considers end date exclusive for all-day events
        endDate.setDate(endDate.getDate() + 1); 

        return {
          id: item.id,
          title: item.title,
          start: startDate,
          end: endDate,
          allDay: true,
          type: item.type,
          status: item.status,
          url: item.url,
          raw: item.raw
        }
      });
      setEvents(calendarEvents)
    } catch (error) {
      console.error('Failed to fetch calendar events:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch when the month/year of currentDate changes
  useEffect(() => {
    fetchEvents(currentDate)
  }, [currentDate.getMonth(), currentDate.getFullYear(), fetchEvents])

  const eventStyleGetter = (event, start, end, isSelected) => {
    let backgroundColor = '#3b82f6'; // default blue
    let borderColor = '#2563eb';

    if (event.type === 'Doanh nghiệp') {
      backgroundColor = '#f97316'; // orange
      borderColor = '#ea580c';
    }

    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: `1px solid ${borderColor}`,
      display: 'block',
      padding: '2px 4px',
      fontSize: '12px',
      fontWeight: 500,
    };
    
    return { style };
  }

  const handleSelectEvent = (event) => {
    if (event.url) {
      navigate(event.url);
    }
  }

  const components = {}

  return (
    <div className="container-fluid px-0 h-100">
      <div className="d-flex justify-content-between align-items-center mb-4 px-4 pt-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">
            <i className="fa-solid fa-calendar-days me-2"></i> Lịch trình Khởi hành
          </h4>
          <p className="text-muted mb-0">Theo dõi toàn bộ lịch khởi hành tour cá nhân và sự kiện doanh nghiệp.</p>
        </div>
      </div>

      <div className="cardx mx-4 mb-4 position-relative" style={{ height: 'calc(100vh - 160px)', minHeight: '600px' }}>
        {loading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
            <Loading />
          </div>
        )}
        
        <div style={{ height: '100%', padding: '20px' }}>
          <style dangerouslySetInnerHTML={{__html: `
            .rbc-calendar {
              font-family: inherit;
            }
            .rbc-toolbar {
              margin-bottom: 20px;
            }
            .rbc-toolbar button {
              color: #4b5563;
              border-color: #d1d5db;
            }
            .rbc-toolbar button.rbc-active {
              background-color: #f3f4f6;
              box-shadow: inset 0 3px 5px rgba(0,0,0,.05);
            }
            .rbc-toolbar button:active, .rbc-toolbar button:focus, .rbc-toolbar button:hover {
              color: #111827;
              background-color: #f9fafb;
              border-color: #9ca3af;
            }
            .rbc-header {
              padding: 10px 0;
              font-weight: 600;
              color: #374151;
            }
            .rbc-today {
              background-color: #eff6ff !important;
            }
            .rbc-event {
              transition: transform 0.1s ease;
            }
            .rbc-event:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            /* Customize Week/Day View for All-Day only events */
            .rbc-time-content {
              display: none !important;
            }
            .rbc-time-header {
              flex: 1 1 auto !important;
              height: auto !important;
            }
            .rbc-time-header-content {
              border-left: none !important;
              flex: 1 !important;
            }
            .rbc-allday-cell {
              max-height: none !important;
              height: 100% !important;
            }
            .rbc-time-view {
              border: 1px solid #ddd;
              background: #fff;
            }
            /* Hide the "all-day" gutter text since everything is all day */
            .rbc-time-header .rbc-time-gutter {
              display: none !important;
            }
          `}} />
          
          <div className="d-flex gap-3 mb-3 justify-content-end">
            <span className="d-flex align-items-center gap-1 small text-muted">
              <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#3b82f6', display: 'inline-block' }}></span> Cá nhân
            </span>
            <span className="d-flex align-items-center gap-1 small text-muted">
              <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: '#f97316', display: 'inline-block' }}></span> Doanh nghiệp
            </span>
          </div>

          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100% - 40px)' }}
            messages={messages}
            culture="vi"
            views={['month', 'week']}
            view={currentView}
            onView={handleViewChange}
            date={currentDate}
            onNavigate={setCurrentDate}
            length={31}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            components={components}
            popup
          />
        </div>
      </div>
    </div>
  )
}
