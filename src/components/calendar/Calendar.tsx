import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  createdBy: string;
  createdByName: string;
  type: 'meeting' | 'photoshoot' | 'design' | 'deadline' | 'other';
  isNote?: boolean; // Новое поле для заметок
}

export function Calendar() {
  const { user, projects } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  // Функция для проверки участия пользователя в проекте
  const isUserInProject = (project: any): boolean => {
    if (!user) return false;
    
    // Админы видят все проекты
    if (user.role === 'admin') return true;
    
    // Менеджеры видят проекты, где они назначены менеджерами
    if (project.manager?.id === user.id) return true;
    
    // Фотографы видят проекты, где они назначены фотографами
    if (user.role === 'photographer' && project.photographers.some((p: any) => p.id === user.id)) return true;
    
    // Дизайнеры видят проекты, где они назначены дизайнерами
    if (user.role === 'designer' && project.designers.some((d: any) => d.id === user.id)) return true;
    
    return false;
  };

  // Создаем события из дедлайнов проектов (только для проектов, в которых участвует пользователь)
  const projectDeadlineEvents: CalendarEvent[] = projects
    .filter(project => isUserInProject(project))
    .map(project => ({
    id: `project-${project.id}`,
    title: `Дедлайн: ${project.title}`,
    description: `Завершение проекта "${project.title}"`,
    date: project.deadline.toISOString().split('T')[0],
    time: '23:59',
    createdBy: project.manager?.id || 'system',
    createdByName: project.manager?.name || 'Система',
    type: 'deadline',
    isNote: false
  }));

  // Персональные события пользователя
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);

  // Загружаем события из localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar_events');
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        const eventsWithDates = parsedEvents.map((event: any) => ({
          ...event,
          // Не преобразуем дату, так как она уже в строковом формате
        }));
        setCustomEvents(eventsWithDates);
      } catch (error) {
        console.error('Ошибка при загрузке событий календаря:', error);
      }
    }
  }, []);

  // Сохраняем события в localStorage при изменении
  useEffect(() => {
    if (customEvents.length >= 0) {
      localStorage.setItem('calendar_events', JSON.stringify(customEvents));
    }
  }, [customEvents]);

  // Объединяем пользовательские события и события дедлайнов проектов
  const events = [...customEvents, ...projectDeadlineEvents];

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    time: '09:00',
    type: 'other' as CalendarEvent['type'],
    isNote: false
  });

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    time: '09:00'
  });

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDate = (dateString: string) => {
    return events.filter(event => event.date === dateString);
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    const colors = {
      meeting: 'bg-blue-100 text-blue-800',
      photoshoot: 'bg-green-100 text-green-800',
      design: 'bg-purple-100 text-purple-800',
      deadline: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type];
  };

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    const labels = {
      meeting: 'Встреча',
      photoshoot: 'Фотосессия',
      design: 'Дизайн',
      deadline: 'Дедлайн',
      other: 'Другое'
    };
    return labels[type];
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateString = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(dateString);
  };

  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.title.trim()) return;

    const event: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      description: newEvent.description,
      date: selectedDate,
      time: newEvent.time,
      createdBy: user?.id || '',
      createdByName: user?.name || '',
      type: newEvent.type,
      isNote: newEvent.isNote
    };

    setCustomEvents(prev => [...prev, event]);
    // Сохраняем в localStorage
    const updatedEvents = [...customEvents, event];
    localStorage.setItem('calendar_events', JSON.stringify(updatedEvents));
    setNewEvent({ title: '', description: '', time: '09:00', type: 'other', isNote: false });
    setShowEventModal(false);
  };

  const handleAddNote = () => {
    if (!selectedDate || !newNote.title.trim()) return;

    const note: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNote.title,
      description: newNote.content,
      date: selectedDate,
      time: newNote.time,
      createdBy: user?.id || '',
      createdByName: user?.name || '',
      type: 'other',
      isNote: true
    };

    setCustomEvents(prev => [...prev, note]);
    // Сохраняем в localStorage
    const updatedEvents = [...customEvents, note];
    localStorage.setItem('calendar_events', JSON.stringify(updatedEvents));
    setNewNote({ title: '', content: '', time: '09:00' });
    setShowNoteModal(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    // Нельзя удалять события дедлайнов проектов
    if (eventId.startsWith('project-')) {
      return;
    }
    setCustomEvents(prev => {
      const updated = prev.filter(event => event.id !== eventId);
      localStorage.setItem('calendar_events', JSON.stringify(updated));
      return updated;
    });
  };

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Календарь</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Планирование проектов и событий
          </p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2">
          {selectedDate && (
            <>
              <Button onClick={() => setShowNoteModal(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Добавить заметку</span>
                <span className="xs:hidden">Заметка</span>
              </Button>
              <Button onClick={() => setShowEventModal(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Добавить событие</span>
                <span className="xs:hidden">Событие</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
        {/* Calendar */}
        <div className="flex-1 lg:w-2/3">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg md:text-xl">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="grid grid-cols-7 gap-1 mb-2 md:mb-4">
                {weekDays.map(day => (
                  <div key={day} className="p-1 md:p-2 text-center text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="p-1 md:p-2 h-12 sm:h-16 md:h-20"></div>;
                  }

                  const dateString = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dayEvents = getEventsForDate(dateString);
                  const isSelected = selectedDate === dateString;
                  const isToday = dateString === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`p-1 md:p-2 h-12 sm:h-16 md:h-20 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-300' : ''
                      } ${isToday ? 'bg-yellow-50 border-yellow-300' : ''}`}
                    >
                      <div className={`text-xs font-medium ${isToday ? 'text-yellow-800' : 'text-gray-900'}`}>
                        {day}
                      </div>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, window.innerWidth < 640 ? 1 : 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded truncate leading-tight ${getEventTypeColor(event.type)} ${
                              event.isNote ? 'border-l-2 border-purple-400' : ''
                            }`}
                            title={event.isNote ? `Заметка: ${event.title}` : event.title}
                          >
                            {event.isNote && '📝 '}{event.title}
                          </div>
                        ))}
                        {dayEvents.length > (window.innerWidth < 640 ? 1 : 2) && (
                          <div className="text-xs text-gray-500 leading-tight">
                            +{dayEvents.length - (window.innerWidth < 640 ? 1 : 2)} еще
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events for selected date */}
        <div className="flex-1 lg:w-1/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                {selectedDate 
                  ? `События на ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU')}`
                  : 'Выберите дату'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {selectedDate ? (
                <div className="space-y-3 md:space-y-4">
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-6 md:py-8">
                      <CalendarIcon className="h-8 w-8 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm md:text-base text-gray-500 mb-3">Нет событий на эту дату</p>
                      <div className="flex flex-col xs:flex-row gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowNoteModal(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Заметка
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowEventModal(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Событие
                        </Button>
                      </div>
                    </div>
                  ) : (
                    selectedDateEvents.map(event => (
                      <div key={event.id} className={`border rounded-lg p-4 ${
                        event.isNote ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {event.isNote ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  📝 Заметка
                                </span>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                                  {getEventTypeLabel(event.type)}
                                </span>
                              )}
                              <div className="flex items-center text-xs md:text-sm text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {event.time}
                              </div>
                            </div>
                            <h4 className="font-medium text-sm md:text-base text-gray-900 mb-1">{event.title}</h4>
                            {event.description && (
                              <p className="text-xs md:text-sm text-gray-600 mb-2 whitespace-pre-wrap">{event.description}</p>
                            )}
                            <div className="flex items-center text-xs text-gray-500">
                              <User className="h-3 w-3 mr-1" />
                              {event.createdByName}
                            </div>
                          </div>
                          {(user?.role === 'admin' || user?.id === event.createdBy) && !event.id.startsWith('project-') && (
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          {event.id.startsWith('project-') && (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2">
                              Проект
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <CalendarIcon className="h-8 w-8 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm md:text-base text-gray-500">Выберите дату в календаре</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Добавить заметку</h2>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заголовок заметки *
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Введите заголовок заметки"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Содержание заметки
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Напишите содержание заметки"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Время
                </label>
                <input
                  type="time"
                  value={newNote.time}
                  onChange={(e) => setNewNote(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowNoteModal(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleAddNote} 
                  disabled={!newNote.title.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Добавить заметку
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Добавить событие</h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название события *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите название события"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Дополнительная информация о событии"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип события
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="meeting">Встреча</option>
                    <option value="photoshoot">Фотосессия</option>
                    <option value="design">Дизайн</option>
                    <option value="deadline">Дедлайн</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowEventModal(false)}>
                  Отмена
                </Button>
                <Button onClick={handleAddEvent} disabled={!newEvent.title.trim()}>
                  Добавить событие
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}