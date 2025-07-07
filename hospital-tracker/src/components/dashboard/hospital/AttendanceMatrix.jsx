import React, { useEffect } from "react";
import { Calendar, Users, TrendingUp, X } from "lucide-react";

export default function AttendanceMatrixModal({ attendanceData, onClose }) {
  const data = attendanceData || [];

  // Gradientes laterales para overflow horizontal
  useEffect(() => {
    const scrollable = document.getElementById('attendance-matrix-scrollable');
    const fadeLeft = document.getElementById('fade-left');
    const fadeRight = document.getElementById('fade-right');
    if (!scrollable || !fadeLeft || !fadeRight) return;

    function updateFades() {
      const { scrollLeft, scrollWidth, clientWidth } = scrollable;
      fadeLeft.style.display = scrollLeft > 5 ? 'block' : 'none';
      fadeRight.style.display = (scrollLeft + clientWidth < scrollWidth - 5) ? 'block' : 'none';
    }
    updateFades();
    scrollable.addEventListener('scroll', updateFades);
    window.addEventListener('resize', updateFades);
    return () => {
      scrollable.removeEventListener('scroll', updateFades);
      window.removeEventListener('resize', updateFades);
    };
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Calcular estadísticas
  const totalDays = data[0]?.dias.length || 0;
  const workDays = data[0]?.dias.filter(dia => !['sáb', 'dom', 'sab', 'dom'].includes(dia.dia_semana.toLowerCase())).length || 0;
  const getAttendanceRate = (empleado) => {
    const workDaysForEmployee = empleado.dias.filter(dia => !['sáb', 'dom', 'sab', 'dom'].includes(dia.dia_semana.toLowerCase()));
    const attendedDays = workDaysForEmployee.filter(dia => dia.asistio).length;
    return workDaysForEmployee.length > 0 ? ((attendedDays / workDaysForEmployee.length) * 100).toFixed(1) : 0;
  };
  const formatDate = (fecha) => {
    const date = new Date(fecha);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es-ES', { month: 'short' })
    };
  };

  // Handler para cerrar al hacer click en el fondo oscuro
  const handleBackdropClick = (e) => {
    // Solo cerrar si el click es en el fondo, no dentro del modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-[98vw] xl:max-w-[1800px] mx-auto bg-white rounded-3xl shadow-2xl p-0 overflow-y-auto max-h-[97vh] border-2 border-blue-300 animate-fade-in flex flex-col"
        onClick={e => e.stopPropagation()} // Evita que el click dentro del modal cierre
      >
        {/* Header modal */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-3xl">
          <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-500" /> Matriz de Asistencia Diaria
          </h2>
          <button
            onClick={onClose}
            className="bg-white border border-gray-200 rounded-full p-2 shadow hover:bg-gray-100 transition-colors z-50"
            title="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-8 pt-6 pb-2 flex-1 overflow-y-auto">
          {/* Stats - Solo si hay datos */}
          {data.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Empleados</p>
                    <p className="text-xl font-semibold text-gray-800">{data.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Días Laborales</p>
                    <p className="text-xl font-semibold text-gray-800">{workDays}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Promedio Asistencia</p>
                    <p className="text-xl font-semibold text-gray-800">
                      {data.length > 0 ? (data.reduce((acc, emp) => acc + parseFloat(getAttendanceRate(emp)), 0) / data.length).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla */}
          {data.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No hay datos de asistencia disponibles</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto relative" id="attendance-matrix-scrollable">
                {/* Gradientes laterales para indicar overflow */}
                <div id="fade-left" className="pointer-events-none absolute top-0 left-0 h-full w-8 z-30" style={{display: 'none'}}></div>
                <div id="fade-right" className="pointer-events-none absolute top-0 right-0 h-full w-8 z-30" style={{display: 'none'}}></div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <th className="sticky left-0 z-20 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-left font-semibold">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Empleado
                        </div>
                      </th>
                      {data[0]?.dias.map((dia, idx) => {
                        const dateInfo = formatDate(dia.fecha);
                        const isWeekend = ['sáb', 'dom', 'sab', 'dom'].includes(dia.dia_semana.toLowerCase());
                        return (
                          <th 
                            key={idx} 
                            className={`px-3 py-4 text-center font-medium min-w-[60px] ${
                              isWeekend ? 'bg-gray-500' : ''
                            }`}
                          >
                            <div className="text-sm font-bold">{dateInfo.day}</div>
                            <div className="text-xs opacity-90">{dateInfo.month}</div>
                            <div className="text-xs opacity-75 mt-1">{dia.dia_semana}</div>
                          </th>
                        );
                      })}
                      <th className="sticky right-0 z-20 px-4 py-4 text-center font-semibold bg-gradient-to-r from-purple-600 to-pink-600">
                        % Asistencia
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={row.empleado.id} className={`transition-colors hover:bg-blue-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="sticky left-0 z-10 bg-white px-6 py-4 border-r border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                              {row.empleado.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{row.empleado.nombre}</p>
                              <p className="text-xs text-gray-500">ID: {row.empleado.id}</p>
                            </div>
                          </div>
                        </td>
                        {row.dias.map((dia, idx) => {
                          const isWeekend = ['sáb', 'dom', 'sab', 'dom'].includes(dia.dia_semana.toLowerCase());
                          let cellClass = 'px-3 py-4 text-center border-l border-gray-100';
                          let content = '';
                          let bgColor = '';
                          
                          if (isWeekend) {
                            bgColor = 'bg-gray-100';
                            content = <div className="text-gray-400 text-sm">—</div>;
                          } else if (dia.asistio) {
                            // Verde brillante, consistente y sin animación
                            bgColor = 'bg-[#bbf7d0]'; // Tailwind emerald-200 más claro
                            content = (
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#22c55e] text-white shadow-green-300 shadow border-2 border-[#059669]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            );
                          } else {
                            bgColor = 'bg-red-50';
                            content = (
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white border-2 border-red-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            );
                          }
                          
                          return (
                            <td 
                              key={idx} 
                              className={`${cellClass} ${bgColor} transition-all duration-200 hover:shadow-md`}
                              title={dia.asistio ? 'Presente' : (isWeekend ? 'Fin de semana' : 'Ausente')}
                            >
                              {content}
                            </td>
                          );
                        })}
                        <td className="sticky right-0 z-10 px-4 py-4 text-center border-l-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                          <div className="inline-flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${parseFloat(getAttendanceRate(row)) >= 80 ? 'bg-green-500' : parseFloat(getAttendanceRate(row)) >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                            <span className="font-semibold text-purple-800">{getAttendanceRate(row)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leyenda - Solo si hay datos */}
          {data.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Presente</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Ausente</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
                <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">Fin de semana</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Gradientes laterales para overflow */}
      <style>{`
        #fade-left {
          background: linear-gradient(to right, rgba(255,255,255,0.95) 60%, rgba(255,255,255,0));
        }
        #fade-right {
          background: linear-gradient(to left, rgba(255,255,255,0.95) 60%, rgba(255,255,255,0));
        }
      `}</style>
    </div>
  );
}